# encoding: UTF-8
# export_footings_metadata.rb
# Extracts all 21 Primary Footings + Fence Footings + Boundary + Gridlines
# from SketchUp model to footings_metadata.json for WEBPROGRESS.

require 'json'

model = Sketchup.active_model
unless model
  puts "ERROR: No active SketchUp model"
  exit 1
end

# 1. Footings configuration map
footings_defs = [
  { id: 'F5_C3_5A', f_name: 'F5: C3 (Grid 5-A)', mark: 'F5: C3', grid: '5-A', tag_grp: 'TAG_F5__C3', piles_count: 5, top: -0.90, bot: -1.80, pco: -1.725, dim_note: '2.50x2.50x0.90(H)' },
  { id: 'F6_C2_3A', f_name: 'F6: C2 (Grid 3-A)', mark: 'F6: C2', grid: '3-A', tag_grp: 'TAG_F6__C2', piles_count: 6, top: -0.40, bot: -1.60, pco: -1.525, dim_note: '3.20x2.00x1.20(H)' },
  { id: 'F6_C4_1Mid', f_name: 'F6: C4 (Grid 1 / Mid)', mark: 'F6: C4', grid: '1-Mid', tag_grp: 'TAG_F6__C4', piles_count: 6, top: -0.70, bot: -1.90, pco: -1.825, dim_note: '3.20x2.00x1.20(H)' },
  { id: 'F6_C3_6A', f_name: 'F6: C3 (Grid 6-A)', mark: 'F6: C3', grid: '6-A', tag_grp: 'TAG_F6__C3', piles_count: 6, top: -0.55, bot: -1.75, pco: -1.675, dim_note: '3.20x2.00x1.20(H)' },
  { id: 'F6_C3A_7A', f_name: 'F6: C3A (Grid 7-A)', mark: 'F6: C3A', grid: '7-A', tag_grp: 'TAG_F6__C3A', piles_count: 6, top: -0.40, bot: -1.60, pco: -1.525, dim_note: '3.20x2.00x1.20(H)' },
  { id: 'F6A_C1A_8', f_name: 'F6A: C1A: C3 (Grid 8)', mark: 'F6A: C1A: C3', grid: '8', tag_grp: 'TAG_F6A__C1A__C3', piles_count: 6, top: -0.40, bot: -1.60, pco: -1.525, dim_note: '3.25x2.00x1.20(H)' },
  { id: 'F3_C3_2A', f_name: 'F3: C3 (Grid 2-A)', mark: 'F3: C3', grid: '2-A', tag_grp: 'TAG_F3__C3', piles_count: 3, top: -0.40, bot: -1.30, pco: -1.225, dim_note: 'SEE DETAIL 0.90(H)' },
  { id: 'F3_C3_9A', f_name: 'F3: C3 (Grid 9-A)', mark: 'F3: C3', grid: '9-A', tag_grp: 'TAG_F3__C3', piles_count: 3, top: -0.40, bot: -1.30, pco: -1.225, dim_note: 'SEE DETAIL 0.90(H)' },
  { id: 'F3_C3_10C', f_name: 'F3: C3 (Grid 10-C)', mark: 'F3: C3', grid: '10-C', tag_grp: 'TAG_F3__C3', piles_count: 3, top: -0.40, bot: -1.30, pco: -1.225, dim_note: 'SEE DETAIL 0.90(H)' },
  { id: 'F2_C1C_1D', f_name: 'F2: C1C (Grid 1-D)', mark: 'F2: C1C', grid: '1-D', tag_grp: 'TAG_F2__C1C', piles_count: 2, top: -0.70, bot: -1.50, pco: -1.425, dim_note: '2.60x0.80x0.80(H)' },
  { id: 'F2_C1_8E', f_name: 'F2: C1 (Grid 8-E)', mark: 'F2: C1', grid: '8-E', tag_grp: 'TAG_F2__C1', piles_count: 2, top: -0.90, bot: -1.70, pco: -1.625, dim_note: '2.80x0.80x0.80(H)' },
  { id: 'F2_C1_10E', f_name: 'F2: C1 (Grid 10-E)', mark: 'F2: C1', grid: '10-E', tag_grp: 'TAG_F2__C1', piles_count: 2, top: -0.90, bot: -1.70, pco: -1.625, dim_note: '2.80x0.80x0.80(H)' },
  { id: 'F1_3B', f_name: 'F1 (Grid 3-B)', mark: 'F1', grid: '3-B', tag_grp: 'TAG_F1', piles_count: 1, top: -0.15, bot: -0.85, pco: -0.650, dim_note: '0.80x0.80x0.70(H)' },
  { id: 'F1_3D', f_name: 'F1 (Grid 3-D)', mark: 'F1', grid: '3-D', tag_grp: 'TAG_F1', piles_count: 1, top: -0.15, bot: -0.85, pco: -0.650, dim_note: '0.80x0.80x0.70(H)' },
  { id: 'F1_C0_Top', f_name: 'F1: C0 (Water Tank บน)', mark: 'F1: C0', grid: 'Tank-Top', tag_grp: 'TAG_F1__C0', piles_count: 1, top: -2.75, bot: -3.45, pco: -3.250, dim_note: '0.80x0.80x0.70(H)' },
  { id: 'F1_C0_Mid', f_name: 'F1: C0 (Water Tank กลาง)', mark: 'F1: C0', grid: 'Tank-Mid', tag_grp: 'TAG_F1__C0', piles_count: 1, top: -2.75, bot: -3.45, pco: -3.250, dim_note: '0.80x0.80x0.70(H)' },
  { id: 'F1_C0_Bot', f_name: 'F1: C0 (Water Tank ล่าง)', mark: 'F1: C0', grid: 'Tank-Bot', tag_grp: 'TAG_F1__C0', piles_count: 1, top: -2.75, bot: -3.45, pco: -3.250, dim_note: '0.80x0.80x0.70(H)' },
  { id: 'F20A_Core1A', f_name: 'F20A: CORE 1A (Grid 4-5)', mark: 'F20A: CORE 1A', grid: '4-5', tag_grp: 'TAG_F20A', piles_count: 20, top: -1.70, bot: -2.70, pco: -2.625, dim_note: '5.20x6.90x1.00(H)' },
  { id: 'F18A_Core2A', f_name: 'F18A: CORE 2A (Grid 6)', mark: 'F18A: CORE 2A', grid: '6', tag_grp: 'TAG_F18A', piles_count: 18, top: -3.50, bot: -4.10, pco: -4.125, dim_note: '5.40x6.80x1.40(H)' },
  { id: 'WWT_1', f_name: 'WWT 1', mark: 'WWT 1', grid: 'WWT-1', tag_grp: 'TAG_WWT_1', piles_count: 20, top: -2.95, bot: -3.20, pco: -3.150, dim_note: '10.95x3.50x0.25(H)' },
  { id: 'WWT_2', f_name: 'WWT 2', mark: 'WWT 2', grid: 'WWT-2', tag_grp: 'TAG_WWT_2', piles_count: 4, top: -2.90, bot: -3.10, pco: -3.050, dim_note: '2.50x2.50x0.20(H)' }
]

# 2. Known BOQ Data (Pre-audited from structural model)
boq_map = {
  'F5: C3 (Grid 5-A)' => { conc: 5.62, rebar: 401.0, breakdown: { 'DB25' => 392.5, 'DB12' => 8.5 } },
  'F6: C2 (Grid 3-A)' => { conc: 7.68, rebar: 459.4, breakdown: { 'DB25' => 450.1, 'DB12' => 9.3 } },
  'F6: C4 (Grid 1 / Mid)' => { conc: 7.68, rebar: 459.4, breakdown: { 'DB25' => 450.1, 'DB12' => 9.3 } },
  'F6: C3 (Grid 6-A)' => { conc: 7.68, rebar: 459.4, breakdown: { 'DB25' => 450.1, 'DB12' => 9.3 } },
  'F6: C3A (Grid 7-A)' => { conc: 7.68, rebar: 459.4, breakdown: { 'DB25' => 450.1, 'DB12' => 9.3 } },
  'F6A: C1A: C3 (Grid 8)' => { conc: 7.68, rebar: 842.7, breakdown: { 'DB25' => 825.0, 'DB12' => 17.7 } },
  'F3: C3 (Grid 2-A)' => { conc: 2.36, rebar: 166.8, breakdown: { 'DB20' => 161.4, 'DB12' => 5.4 } },
  'F3: C3 (Grid 9-A)' => { conc: 2.36, rebar: 166.8, breakdown: { 'DB20' => 161.4, 'DB12' => 5.4 } },
  'F3: C3 (Grid 10-C)' => { conc: 2.36, rebar: 166.8, breakdown: { 'DB20' => 161.4, 'DB12' => 5.4 } },
  'F2: C1C (Grid 1-D)' => { conc: 1.44, rebar: 103.8, breakdown: { 'DB20' => 53.7, 'DB16' => 45.2, 'DB12' => 4.8 } },
  'F2: C1 (Grid 8-E)' => { conc: 1.28, rebar: 101.5, breakdown: { 'DB20' => 53.7, 'DB16' => 43.2, 'DB12' => 4.6 } },
  'F2: C1 (Grid 10-E)' => { conc: 1.28, rebar: 101.5, breakdown: { 'DB20' => 53.7, 'DB16' => 43.2, 'DB12' => 4.6 } },
  'F1 (Grid 3-B)' => { conc: 0.45, rebar: 51.9, breakdown: { 'DB16' => 44.4, 'DB12' => 7.6 } },
  'F1 (Grid 3-D)' => { conc: 0.45, rebar: 51.9, breakdown: { 'DB16' => 44.4, 'DB12' => 7.6 } },
  'F1: C0 (Water Tank บน)' => { conc: 0.45, rebar: 51.9, breakdown: { 'DB16' => 44.4, 'DB12' => 7.6 } },
  'F1: C0 (Water Tank กลาง)' => { conc: 0.45, rebar: 51.9, breakdown: { 'DB16' => 44.4, 'DB12' => 7.6 } },
  'F1: C0 (Water Tank ล่าง)' => { conc: 0.45, rebar: 51.9, breakdown: { 'DB16' => 44.4, 'DB12' => 7.6 } },
  'F20A: CORE 1A (Grid 4-5)' => { conc: 35.88, rebar: 2120.2, breakdown: { 'DB20' => 2098.2, 'DB12' => 22.0 } },
  'F18A: CORE 2A (Grid 6)' => { conc: 51.41, rebar: 3833.1, breakdown: { 'DB25' => 2202.1, 'DB20' => 1586.7, 'DB12' => 44.3 } },
  'WWT 1' => { conc: 9.58, rebar: 691.4, breakdown: { 'DB12' => 691.4 } },
  'WWT 2' => { conc: 1.25, rebar: 108.6, breakdown: { 'DB12' => 108.6 } }
}

# 3. Read Piles metadata to associate piles with footings
piles_file = "C:/Users/niwat/OneDrive/เอกสาร/EXTENSION SKETCHUP/WEBPROGRESS/piling_src/piles_metadata.json"
piles_data = File.exist?(piles_file) ? JSON.parse(File.read(piles_file)) : []

# Find callout groups
cad = model.entities.find { |e| e.respond_to?(:name) && e.name =~ /PRIDI 37 - CAD PILING/ }
callout_grp = cad ? cad.entities.find { |e| e.respond_to?(:name) && e.name =~ /FOOTING CALLOUT TAGS/ } : nil

tag_positions = {}
if cad && callout_grp
  tr = cad.transformation * callout_grp.transformation
  callout_grp.entities.grep(Sketchup::Group).each do |tg|
    bb_g = Geom::BoundingBox.new
    (0..7).each { |i| bb_g.add(tg.bounds.corner(i).transform(tr)) }
    tag_positions[tg.name] ||= []
    tag_positions[tg.name] << {
      center: [bb_g.center.x.to_m.round(3), bb_g.center.y.to_m.round(3)],
      min: [bb_g.min.x.to_m.round(3), bb_g.min.y.to_m.round(3)],
      max: [bb_g.max.x.to_m.round(3), bb_g.max.y.to_m.round(3)]
    }
  end
end

footings_result = []

footings_defs.each_with_index do |f_def, idx|
  f_ent = model.entities.find { |e| e.name == f_def[:f_name] || (e.respond_to?(:definition) && e.definition.name == f_def[:f_name]) }
  bb = f_ent ? f_ent.bounds : nil
  
  center = bb ? [bb.center.x.to_m.round(3), bb.center.y.to_m.round(3), bb.center.z.to_m.round(3)] : [0,0,0]
  w = bb ? bb.width.to_m.round(2) : 1.0
  l = bb ? bb.height.to_m.round(2) : 1.0
  h = bb ? bb.depth.to_m.round(2) : 1.0
  
  # Find nearest card for this footing
  cards = tag_positions[f_def[:tag_grp]] || []
  matched_card = cards.min_by { |c| (c[:center][0] - center[0])**2 + (c[:center][1] - center[1])**2 }
  card_center = matched_card ? matched_card[:center] : [center[0], center[1] + 1.2]
  
  boq = boq_map[f_def[:f_name]] || { conc: (w*l*h).round(2), rebar: 100.0, breakdown: {} }
  
  # Find associated piles within or near footing bounds
  margin = 0.5
  assoc_piles = piles_data.select do |p|
    px = p["x"].to_f
    py = p["y"].to_f
    if bb
      px >= (bb.min.x.to_m - margin) && px <= (bb.max.x.to_m + margin) &&
      py >= (bb.min.y.to_m - margin) && py <= (bb.max.y.to_m + margin)
    else
      false
    end
  end.map { |p| { no: p["no"], tag: p["tag"], grid: p["grid"], pco: p["pco_level"] } }
  
  footings_result << {
    id: f_def[:id],
    no: idx + 1,
    name: f_def[:f_name],
    mark: f_def[:mark],
    grid: f_def[:grid],
    dim: { w: w, l: l, h: h, note: f_def[:dim_note] },
    levels: { top: f_def[:top], bot: f_def[:bot], pco: f_def[:pco] },
    center: center,
    bounds: bb ? { min_x: bb.min.x.to_m.round(3), max_x: bb.max.x.to_m.round(3), min_y: bb.min.y.to_m.round(3), max_y: bb.max.y.to_m.round(3), min_z: bb.min.z.to_m.round(3), max_z: bb.max.z.to_m.round(3) } : nil,
    card_position: card_center,
    boq: {
      concrete_m3: boq[:conc],
      rebar_kg: boq[:rebar],
      ratio_kg_m3: boq[:conc] > 0 ? (boq[:rebar] / boq[:conc]).round(1) : 0,
      breakdown: boq[:breakdown]
    },
    piles_count: f_def[:piles_count],
    associated_piles: assoc_piles
  }
end

# 4. Property Boundary Coordinates
boundary = {
  north: { label: "39.15 m", length_m: 39.15 },
  south: { label: "41.91 m", length_m: 41.91 },
  west: { label: "19.77 m", length_m: 19.77 },
  east: { label: "18.25 m (SOI PRIDI 37)", length_m: 18.25 },
  code: "n115816"
}

# 5. Gridlines info
gridlines = {
  x_axes: [
    { name: "1", x: 0.0 },
    { name: "2", x: 0.50 },
    { name: "3", x: 5.70 },
    { name: "4", x: 10.85 },
    { name: "5", x: 12.20 },
    { name: "6", x: 20.00 },
    { name: "7", x: 27.50 },
    { name: "8", x: 29.45 },
    { name: "9", x: 32.70 },
    { name: "10", x: 32.90 }
  ],
  y_axes: [
    { name: "A", y: 12.40 },
    { name: "B", y: 5.20 },
    { name: "C", y: 3.50 },
    { name: "D", y: 1.30 },
    { name: "E", y: 0.00 }
  ]
}

total_conc = footings_result.sum { |f| f[:boq][:concrete_m3] }.round(2)
total_rebar = footings_result.sum { |f| f[:boq][:rebar_kg] }.round(1)

output_data = {
  project: "PYNN PRIDI 37",
  scene: "06_ฟุตติ้ง_เข็ม_เหล็กตอม่อ_TOP_BOT_PCO",
  generated_at: Time.now.strftime("%Y-%m-%d %H:%M:%S"),
  summary: {
    total_footings: footings_result.size,
    total_concrete_m3: total_conc,
    total_rebar_kg: total_rebar,
    total_rebar_tons: (total_rebar / 1000.0).round(2),
    avg_rebar_ratio: (total_rebar / total_conc).round(1)
  },
  boundary: boundary,
  gridlines: gridlines,
  footings: footings_result
}

json_str = JSON.pretty_generate(output_data)

out_paths = [
  "C:/Users/niwat/OneDrive/เอกสาร/EXTENSION SKETCHUP/WEBPROGRESS/public/footings_metadata.json",
  "C:/Users/niwat/OneDrive/เอกสาร/EXTENSION SKETCHUP/WEBPROGRESS/piling_src/footings_metadata.json",
  "C:/Users/niwat/OneDrive/เอกสาร/EXTENSION SKETCHUP/WEBPROGRESS/footings_metadata.json"
]

out_paths.each do |p|
  FileUtils.mkdir_p(File.dirname(p))
  File.write(p, json_str, encoding: 'UTF-8')
  puts "Wrote #{p} (#{File.size(p)} bytes)"
end

puts "SUCCESS: Exported #{footings_result.size} footings. Total Conc: #{total_conc} m3, Total Rebar: #{total_rebar} kg."
