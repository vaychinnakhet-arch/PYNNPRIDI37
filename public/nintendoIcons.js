/**
 * Modern Industrial Construction & QC Trade Badges
 * Professional architectural and engineering vector icons:
 * - High-contrast, crisp technical linework (1.8 - 2.5px)
 * - Industrial palette (Slate, Cobalt Navy, Emerald Green, Amber Orange, Cyan)
 * - Clean geometric symbols optimized for outdoor sunlight legibility
 * - 100% backward-compatible key mapping for all QC inspections
 */

const icons = {
  // 1. งานสนิม/ทาสีกันสนิม (Rust Primer & Steel Coating) - [STR]
  skimAndPaint: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <rect x="16" y="16" width="24" height="28" rx="4" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <path d="M16 26H40" stroke="#38BDF8" stroke-width="2"/>
      <path d="M22 16V12C22 10 24 9 26 9H30C32 9 34 10 34 12V16" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <path d="M38 20L49 31M44 15L53 24" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="35" r="4" fill="#38BDF8"/>
      <rect x="18" y="48" width="28" height="5" rx="2.5" fill="#38BDF8"/>
    </svg>
  `,

  // 2. งานเท TOPPING คอนกรีต (Structural Concrete Topping) - [STR]
  topping: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Concrete Slab 3D isometric representation -->
      <path d="M12 36L32 24L52 36L32 48L12 36Z" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
      <path d="M12 36V44L32 56V48L12 36Z" fill="#1E293B" stroke="#94A3B8" stroke-width="2"/>
      <path d="M52 36V44L32 56V48L52 36Z" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
      <!-- Level Indicator Trowel -->
      <path d="M22 18L38 12L44 18L28 24L22 18Z" fill="#10B981" stroke="#34D399" stroke-width="2"/>
      <path d="M33 15V9" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // 3. งานฝ้าเพดาน (Ceiling Suspension Grid) - [ARC]
  ceiling: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Suspension Hangers -->
      <line x1="20" y1="12" x2="20" y2="24" stroke="#94A3B8" stroke-width="2" stroke-dasharray="2 2"/>
      <line x1="44" y1="12" x2="44" y2="24" stroke="#94A3B8" stroke-width="2" stroke-dasharray="2 2"/>
      <!-- Ceiling Tile Grid -->
      <path d="M10 32L32 20L54 32L32 44L10 32Z" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <line x1="21" y1="26" x2="43" y2="38" stroke="#0284C7" stroke-width="2"/>
      <line x1="43" y1="26" x2="21" y2="38" stroke="#0284C7" stroke-width="2"/>
      <!-- Recessed Downlight -->
      <ellipse cx="32" cy="32" rx="6" ry="3.5" fill="#FACC15" stroke="#E2E8F0" stroke-width="1.5"/>
    </svg>
  `,

  // 4. งานผนัง TEXCA มวลเบา (Texca Lightweight Masonry Wall) - [STR/ARC]
  texcaWall: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Staggered Block Masonry Courses -->
      <rect x="12" y="16" width="18" height="11" rx="2" fill="#EA580C" stroke="#FDBA74" stroke-width="1.8"/>
      <rect x="34" y="16" width="18" height="11" rx="2" fill="#EA580C" stroke="#FDBA74" stroke-width="1.8"/>
      <rect x="20" y="29" width="24" height="11" rx="2" fill="#C2410C" stroke="#FDBA74" stroke-width="1.8"/>
      <rect x="12" y="42" width="18" height="11" rx="2" fill="#EA580C" stroke="#FDBA74" stroke-width="1.8"/>
      <rect x="34" y="42" width="18" height="11" rx="2" fill="#EA580C" stroke="#FDBA74" stroke-width="1.8"/>
      <!-- Precision Mortar Lines -->
      <line x1="10" y1="28" x2="54" y2="28" stroke="#64748B" stroke-width="1.5"/>
      <line x1="10" y1="41" x2="54" y2="41" stroke="#64748B" stroke-width="1.5"/>
    </svg>
  `,

  // 5. งานระบบกันซึม (Waterproofing Membrane) - [SAN]
  waterproofing: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Hydro Shield Symbol -->
      <path d="M32 12L48 18V32C48 42 41 49 32 52C23 49 16 42 16 32V18L32 12Z" fill="#0369A1" stroke="#38BDF8" stroke-width="2"/>
      <!-- Water Droplet Barrier -->
      <path d="M32 22C32 22 24 31 24 36C24 40.5 27.5 44 32 44C36.5 44 40 40.5 40 36C40 31 32 22 32 22Z" fill="#38BDF8" stroke="#E0F2FE" stroke-width="1.8"/>
    </svg>
  `,

  // 6. งานปูกระเบื้อง (Tile Flooring & Alignment) - [ARC]
  tiling: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- 4 Tile Quadrants -->
      <rect x="14" y="14" width="16" height="16" rx="2" fill="#0F766E" stroke="#2DD4BF" stroke-width="1.8"/>
      <rect x="34" y="14" width="16" height="16" rx="2" fill="#115E59" stroke="#2DD4BF" stroke-width="1.8"/>
      <rect x="14" y="34" width="16" height="16" rx="2" fill="#115E59" stroke="#2DD4BF" stroke-width="1.8"/>
      <rect x="34" y="34" width="16" height="16" rx="2" fill="#0F766E" stroke="#2DD4BF" stroke-width="1.8"/>
      <!-- Center Precision Laser Crosshair -->
      <line x1="12" y1="32" x2="52" y2="32" stroke="#FACC15" stroke-width="1.8" stroke-dasharray="3 2"/>
      <line x1="32" y1="12" x2="32" y2="52" stroke="#FACC15" stroke-width="1.8" stroke-dasharray="3 2"/>
      <circle cx="32" cy="32" r="3" fill="#FACC15"/>
    </svg>
  `,

  // 7. งานติดตั้งอลูมิเนียม (Aluminum Glazing System) - [ARC]
  aluminum: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Architectural Window Frame Profile -->
      <rect x="14" y="14" width="36" height="36" rx="3" fill="#1E293B" stroke="#94A3B8" stroke-width="2"/>
      <line x1="32" y1="14" x2="32" y2="50" stroke="#94A3B8" stroke-width="2"/>
      <!-- Reflective Glazing Lines -->
      <path d="M19 40L27 24" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M37 40L45 24" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
      <!-- Sash Handle -->
      <rect x="29" y="30" width="3" height="8" rx="1.5" fill="#F8FAFC"/>
    </svg>
  `,

  // 8. คะแนน WET WORK ตรวจงานเปียก (Wet Work QC Verified)
  wetWork: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Quality Clipboard -->
      <rect x="16" y="14" width="32" height="38" rx="4" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
      <rect x="24" y="10" width="16" height="6" rx="2" fill="#94A3B8" stroke="#E2E8F0" stroke-width="1.5"/>
      <!-- Inspection Lines -->
      <line x1="22" y1="24" x2="32" y2="24" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <line x1="22" y1="32" x2="30" y2="32" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <!-- Verified Green Checkmarks -->
      <path d="M36 22L39 25L44 19" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 30L39 33L44 27" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Pass Stamp Badge -->
      <rect x="22" y="38" width="20" height="8" rx="2" fill="#065F46" stroke="#10B981" stroke-width="1.5"/>
      <text x="32" y="44" font-size="6" font-weight="900" fill="#34D399" text-anchor="middle" font-family="sans-serif">PASS</text>
    </svg>
  `,

  // 9. งานเฟอร์นิเจอร์ Built-in (Joinery & Built-in Furniture) - [ARC]
  furniture: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Cabinet Enclosure -->
      <rect x="14" y="14" width="36" height="38" rx="3" fill="#1E293B" stroke="#B45309" stroke-width="2"/>
      <line x1="32" y1="14" x2="32" y2="38" stroke="#B45309" stroke-width="1.8"/>
      <!-- Minimalist Door Pulls -->
      <line x1="30" y1="24" x2="30" y2="28" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="24" x2="34" y2="28" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
      <!-- Bottom Utility Drawer -->
      <rect x="17" y="40" width="30" height="8" rx="1.5" fill="#334155" stroke="#B45309" stroke-width="1.5"/>
      <line x1="28" y1="44" x2="36" y2="44" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 10. งานพื้นไม้ลามิเนต (Laminate & Engineered Wood Flooring) - [ARC]
  laminate: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Staggered Plank Layout -->
      <rect x="12" y="14" width="24" height="10" rx="1.5" fill="#92400E" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="38" y="14" width="14" height="10" rx="1.5" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="12" y="26" width="12" height="10" rx="1.5" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="26" y="26" width="26" height="10" rx="1.5" fill="#92400E" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="12" y="38" width="22" height="10" rx="1.5" fill="#92400E" stroke="#F59E0B" stroke-width="1.5"/>
      <rect x="36" y="38" width="16" height="10" rx="1.5" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>
      <!-- Wood Grain Highlights -->
      <line x1="16" y1="19" x2="28" y2="19" stroke="#D97706" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="30" y1="31" x2="44" y2="31" stroke="#D97706" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `,

  // 11. งานติดตั้งบานประตู (Architectural Door Installation) - [ARC]
  door: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Door Jamb -->
      <rect x="16" y="12" width="32" height="42" rx="3" fill="#1E293B" stroke="#94A3B8" stroke-width="2"/>
      <rect x="20" y="15" width="24" height="38" rx="2" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>
      <!-- Architectural Lever Handle -->
      <circle cx="25" cy="34" r="2.5" fill="#FACC15"/>
      <path d="M25 34H30" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 12. งาน Shower Screen กระจกกั้นห้องน้ำ (Tempered Glass Enclosure) - [SAN]
  showerScreen: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Tempered Glass Partition -->
      <rect x="18" y="12" width="28" height="42" rx="3" fill="#0284C7" fill-opacity="0.25" stroke="#38BDF8" stroke-width="2"/>
      <line x1="22" y1="46" x2="38" y2="18" stroke="#E0F2FE" stroke-width="2" stroke-linecap="round"/>
      <!-- Stainless Steel Wall Clamps -->
      <rect x="15" y="18" width="5" height="6" rx="1" fill="#E2E8F0"/>
      <rect x="15" y="42" width="5" height="6" rx="1" fill="#E2E8F0"/>
      <rect x="42" y="28" width="3" height="12" rx="1.5" fill="#F8FAFC"/>
    </svg>
  `,

  // 13. งานสีผนังและฝ้า (Architectural Wall Painting & Finish) - [ARC]
  paintOnly: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Precision Paint Roller -->
      <rect x="18" y="16" width="26" height="12" rx="3" fill="#6366F1" stroke="#A5B4FC" stroke-width="2"/>
      <path d="M44 22H50V32C50 34 48 35 46 35H32V42" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="29" y="42" width="6" height="12" rx="2" fill="#3B82F6"/>
      <!-- Coating Swatch Stripe -->
      <path d="M14 12H34" stroke="#818CF8" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,

  // 14. งานเก็บสีอลูมิเนียม (Aluminum Coating Inspection) - [ARC]
  aluminumPaint: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <rect x="14" y="14" width="36" height="36" rx="3" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
      <circle cx="32" cy="32" r="10" stroke="#F59E0B" stroke-width="2" stroke-dasharray="3 2"/>
      <path d="M32 26V38M26 32H38" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 15. งานทำความสะอาดส่งมอบ (Handover Cleaning & Sparkle Check)
  cleaning: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Sparkle Verification Diamond -->
      <path d="M32 14L37 27L50 32L37 37L32 50L27 37L14 32L27 27L32 14Z" fill="#0D9488" stroke="#2DD4BF" stroke-width="2"/>
      <circle cx="32" cy="32" r="4" fill="#F0FDFA"/>
      <path d="M46 16L48 21L53 23L48 25L46 30L44 25L39 23L44 21L46 16Z" fill="#FACC15"/>
    </svg>
  `,

  // 16. คะแนน END PRODUCT คุณภาพส่งมอบ (Final Quality Handover Crest)
  endProduct: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Royal Engineering Shield -->
      <path d="M32 12L48 18V32C48 42 41 49 32 53C23 49 16 42 16 32V18L32 12Z" fill="#065F46" stroke="#10B981" stroke-width="2"/>
      <!-- Verified Star Ribbon -->
      <path d="M32 22L35 28L42 29L37 34L38 41L32 38L26 41L27 34L22 29L29 28L32 22Z" fill="#FACC15" stroke="#E2E8F0" stroke-width="1.2"/>
    </svg>
  `,

  // 17. พื้นที่ส่วนกลาง (Common Amenities & Landscape) - [COM]
  common: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <rect x="16" y="20" width="32" height="30" rx="3" fill="#1E293B" stroke="#818CF8" stroke-width="2"/>
      <path d="M12 24L32 12L52 24" stroke="#818CF8" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="22" y="26" width="6" height="8" rx="1" fill="#FEF08A"/>
      <rect x="36" y="26" width="6" height="8" rx="1" fill="#FEF08A"/>
      <rect x="28" y="38" width="8" height="12" rx="1" fill="#38BDF8"/>
    </svg>
  `,

  // 18. งานระบบไฟฟ้า (Electrical Rough-in & Distribution) - [ELE]
  electrical: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <circle cx="32" cy="32" r="18" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
      <path d="M34 16L22 34H33L29 48L42 28H31L34 16Z" fill="#FACC15" stroke="#78350F" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>
  `,

  // 19. งานระบบสุขาภิบาล/ท่อ (Sanitary & Plumbing Lines) - [SAN]
  plumbing: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <path d="M16 22H32V34H48V46H16V22Z" fill="#0369A1" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="40" cy="24" r="5" fill="#38BDF8" stroke="#E0F2FE" stroke-width="1.5"/>
      <line x1="22" y1="28" x2="28" y2="28" stroke="#E0F2FE" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 20. งานระบบปรับอากาศ (HVAC & Air Conditioning) - [MEP]
  airCon: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg industrial-badge-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <rect x="14" y="20" width="36" height="22" rx="3" fill="#1E293B" stroke="#0284C7" stroke-width="2"/>
      <line x1="20" y1="34" x2="44" y2="34" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 46C24 48 26 48 28 46M32 46C34 48 36 48 38 46" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
};

// Aliases for 100% full compatibility with any key naming convention
icons.rustPaint = icons.skimAndPaint;
icons.texca = icons.texcaWall;
icons.waterproof = icons.waterproofing;
icons.tile = icons.tiling;
icons.electricalRoughIn = icons.electrical;
icons.plumbingRoughIn = icons.plumbing;
icons.airConRoughIn = icons.airCon;

export const nintendoWorkIcons = icons;

if (typeof window !== "undefined") {
  window.nintendoWorkIcons = nintendoWorkIcons;
}

export default nintendoWorkIcons;
