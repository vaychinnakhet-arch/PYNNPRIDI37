import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supabase client initialization (dynamic loader)
function getSupabaseConfig() {
  dotenv.config();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const table = process.env.SUPABASE_TABLE || 'piling_progress';
  const isValid = !!(url && key && !url.includes('your-project-id') && url.startsWith('http'));
  return { url, key, table, isValid };
}

function getSupabase() {
  const { url, key, isValid } = getSupabaseConfig();
  if (!isValid) return null;
  try {
    return createClient(url, key);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
    return null;
  }
}

// SQL Schema for piling table in Supabase
const PILING_SQL_SCHEMA = `-- สร้างตารางบันทึกความคืบหน้างานเสาเข็ม 93 ต้น
CREATE TABLE IF NOT EXISTS piling_progress (
  pile_no INT PRIMARY KEY,
  tag TEXT,
  grid TEXT,
  footing TEXT,
  status TEXT DEFAULT 'pending',
  driven_date TEXT,
  northing NUMERIC,
  easting NUMERIC,
  pco_level NUMERIC,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิด Row Level Security และอนุญาตให้อ่าน/เขียน
ALTER TABLE piling_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for piling" ON piling_progress;
CREATE POLICY "Allow all for piling" ON piling_progress FOR ALL USING (true) WITH CHECK (true);`;

// Check Supabase connection status
app.get('/api/supabase/status', async (req, res) => {
  const { url, table, isValid } = getSupabaseConfig();
  const client = getSupabase();
  const maskedUrl = url
    ? url.replace(/^(https?:\/\/[a-z0-9]{4})[a-z0-9]+(\.supabase\.co.*)$/, '$1****$2')
    : '';

  let liveConnected = false;
  let rowCount = 0;
  let testError = '';

  if (client) {
    try {
      const { count, error } = await client
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (!error) {
        liveConnected = true;
        rowCount = count || 0;
      } else {
        testError = error.message;
      }
    } catch (e: any) {
      testError = e.message || 'Connection failed';
    }
  }

  res.json({
    configured: isValid && !!client,
    connected: liveConnected,
    url: maskedUrl || (isValid ? 'Connected' : ''),
    table,
    rowCount,
    error: testError,
    schema: PILING_SQL_SCHEMA
  });
});

// Fetch SQL Schema for user setup
app.get('/api/supabase/schema', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(PILING_SQL_SCHEMA);
});

// Fetch all pile records from Supabase
app.get('/api/supabase/piles', async (req, res) => {
  const client = getSupabase();
  const { isValid } = getSupabaseConfig();
  if (!client || !isValid) {
    return res.status(503).json({
      error: 'Supabase is not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env',
      configured: false,
    });
  }
  try {
    // 1. Try reading from project_data first (default table in this project)
    const { data: projRow } = await client
      .from('project_data')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (projRow?.data?.pilingProgress) {
      return res.json({
        data: projRow.data.pilingProgress,
        source: 'project_data',
        timestamp: projRow.data.pilingProgressLastUpdated || null
      });
    }

    // 2. Try relational table piling_progress
    const { data: pileRows, error: pileError } = await client
      .from('piling_progress')
      .select('*')
      .order('pile_no', { ascending: true });

    if (!pileError && pileRows && pileRows.length > 0) {
      // Map back to dictionary format { [no]: { status, date } }
      const dict: Record<string, any> = {};
      pileRows.forEach((r: any) => {
        dict[r.pile_no] = {
          status: r.status,
          date: r.driven_date,
          notes: r.notes || ''
        };
      });
      return res.json({ data: dict, raw: pileRows, source: 'piling_progress' });
    }

    res.json({ data: null, source: 'none' });
  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Upsert single pile or array of piles
app.post('/api/supabase/piles', async (req, res) => {
  const client = getSupabase();
  const { isValid } = getSupabaseConfig();
  if (!client || !isValid) {
    return res.status(503).json({
      error: 'Supabase is not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env',
      configured: false,
    });
  }
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    
    // Save to project_data under pilingProgress
    const { data: projRow } = await client
      .from('project_data')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (projRow && projRow.data) {
      const currentPiles = projRow.data.pilingProgress || {};
      records.forEach((r: any) => {
        const no = r.pile_no || r.no;
        if (no) {
          currentPiles[no] = {
            status: r.status || 'driven',
            date: r.driven_date || r.date || new Date().toISOString().slice(0, 10),
            notes: r.notes || ''
          };
        }
      });
      projRow.data.pilingProgress = currentPiles;
      projRow.data.pilingProgressLastUpdated = new Date().toISOString();

      await client
        .from('project_data')
        .update({ data: projRow.data })
        .eq('id', 1);
    }

    // Also attempt to upsert to piling_progress if table exists
    try {
      await client
        .from('piling_progress')
        .upsert(records, { onConflict: 'pile_no' });
    } catch (_) {}

    res.json({ success: true, count: records.length, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Batch sync all 93 piles at once
app.post('/api/supabase/sync', async (req, res) => {
  const client = getSupabase();
  const { isValid } = getSupabaseConfig();
  if (!client || !isValid) {
    return res.status(503).json({
      error: 'Supabase is not configured yet. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env',
      configured: false,
      schema: PILING_SQL_SCHEMA
    });
  }
  try {
    const { piles, records } = req.body;
    const progressMap: Record<string, any> = records || {};

    if (Array.isArray(piles)) {
      piles.forEach((p: any) => {
        const no = p.pile_no || p.no;
        if (no) {
          progressMap[no] = {
            status: p.status || 'pending',
            date: p.driven_date || p.date || null,
            notes: p.notes || ''
          };
        }
      });
    }

    const now = new Date().toISOString();

    // 1. Save directly into project_data.data.pilingProgress (User's live table!)
    const { data: projRow } = await client
      .from('project_data')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (projRow && projRow.data) {
      projRow.data.pilingProgress = progressMap;
      projRow.data.pilingProgressLastUpdated = now;

      const { error: updateErr } = await client
        .from('project_data')
        .update({ data: projRow.data })
        .eq('id', 1);

      if (updateErr) {
        console.error('Error updating project_data in Supabase:', updateErr);
      } else {
        console.log('✅ Piling progress saved to project_data in Supabase!');
      }
    }

    // 2. Also try upserting to separate table piling_progress if it exists
    if (Array.isArray(piles)) {
      try {
        const cleaned = piles.map((p: any) => ({
          pile_no: Number(p.pile_no || p.no),
          tag: p.tag || `P${String(p.pile_no || p.no).padStart(2, '0')}`,
          grid: p.grid || '',
          footing: p.footing || '',
          status: p.status || 'pending',
          driven_date: p.driven_date || p.date || null,
          northing: p.northing !== undefined ? Number(p.northing) : null,
          easting: p.easting !== undefined ? Number(p.easting) : null,
          pco_level: p.pco_level !== undefined ? Number(p.pco_level) : null,
          notes: p.notes || null,
          updated_at: now
        }));
        await client.from('piling_progress').upsert(cleaned, { onConflict: 'pile_no' });
      } catch (_) {}
    }

    res.json({
      success: true,
      synced: Object.keys(progressMap).length || 93,
      table: 'project_data',
      timestamp: now
    });
  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Mount Vite middleware in development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // In production, serve static dist files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
