/**
 * Paper Mario Nintendo Style Construction & QC Trade Icons
 * Clean, pure vector SVGs without external filter dependencies:
 * - Die-cut papercraft sticker aesthetic with clean white silhouette backing
 * - Bold, expressive ink lineart (Paper Mario 2.5-3px lines)
 * - Saturated Nintendo color palette (Mario Red, Super Star Gold, Yoshi Green, Sky Blue)
 * - Playful Paper Mario character touches (cute oval eyes, star sparkles, paper seams)
 * - All trade keys and aliases fully supported (100% complete, zero missing icons)
 */

const icons = {
  // 1. งานสนิม/ทาสี (Rust Primer & Paint) - skimAndPaint / rustPaint
  skimAndPaint: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Die-cut Paper Sticker Backing -->
      <path d="M12 21C12 18.5 14 16.5 16.5 16.5H43.5C46 16.5 48 18.5 48 21V46C48 50.5 44.5 54 40 54H20C15.5 54 12 50.5 12 46V21Z" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>
      <!-- Paint Bucket Body -->
      <path d="M14 22C14 20 15.5 18 17.5 18H42.5C44.5 18 46 20 46 22V46C46 49.5 43 52.5 39.5 52.5H20.5C17 52.5 14 49.5 14 46V22Z" fill="#F8FAFC" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- Bucket Rim -->
      <rect x="12" y="16" width="36" height="6.5" rx="3.2" fill="#E2E8F0" stroke="#241E38" stroke-width="2.8"/>
      <!-- Rich Mario Red Paint Wave -->
      <path d="M15.5 24C19 28 23 23 27 26C31 29 36 24 44.5 27V46C44.5 48.5 42.5 50.5 40 50.5H20C17.5 50.5 15.5 48.5 15.5 46V24Z" fill="#EF4444"/>
      <!-- Drips running down -->
      <path d="M22 26V34C22 35.5 23.5 36.5 25 36.5C26.5 36.5 28 35.5 28 34V28" fill="#DC2626" stroke="#241E38" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Paper Mario Cute Bucket Eyes -->
      <ellipse cx="23" cy="43" rx="2.2" ry="3.5" fill="#241E38"/>
      <circle cx="22.2" cy="41.5" r="1.1" fill="#FFFFFF"/>
      <ellipse cx="33" cy="43" rx="2.2" ry="3.5" fill="#241E38"/>
      <circle cx="32.2" cy="41.5" r="1.1" fill="#FFFFFF"/>
      <!-- Cheerful Bucket Smile -->
      <path d="M26 46C27.2 47.5 28.8 47.5 30 46" stroke="#241E38" stroke-width="2" stroke-linecap="round"/>
      <circle cx="19.5" cy="45" r="1.8" fill="#FCA5A5"/>
      <circle cx="36.5" cy="45" r="1.8" fill="#FCA5A5"/>
      <!-- Wire Handle -->
      <path d="M12.5 19C12.5 9 47.5 9 47.5 19" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Slanted Paint Brush -->
      <g transform="rotate(32 46 18)">
        <rect x="42" y="2" width="6" height="15" rx="3" fill="#F59E0B" stroke="#241E38" stroke-width="2.2"/>
        <rect x="41" y="15" width="8" height="6" rx="1.5" fill="#CBD5E1" stroke="#241E38" stroke-width="2.2"/>
        <path d="M41 21H49V27C49 29.5 47 31 45 31C43 31 41 29.5 41 27V21Z" fill="#EF4444" stroke="#241E38" stroke-width="2.2"/>
      </g>
      <!-- Paper Sparkle Star -->
      <path d="M49 42L50.5 38.5L54 37L50.5 35.5L49 32L47.5 35.5L44 37L47.5 38.5L49 42Z" fill="#FACC15" stroke="#241E38" stroke-width="1.8"/>
    </svg>
  `,

  // 2. งานเท TOPPING (Concrete Floor Screed Topping)
  topping: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Backing -->
      <path d="M8 36L32 22L56 36L32 50L8 36Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
      <!-- 3D Paper Slab Layer -->
      <path d="M8 36L32 23L56 36L32 49L8 36Z" fill="#94A3B8" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M8 36V44L32 57V49L8 36Z" fill="#64748B" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M56 36V44L32 57V49L56 36Z" fill="#475569" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- Fresh Smooth Screed Top Inset -->
      <path d="M14 34L32 24L50 34L32 44L14 34Z" fill="#E2E8F0" stroke="#241E38" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Screed Texture Lines -->
      <path d="M20 34L44 34" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
      <!-- Cute Paper Mario Concrete Float / Trowel -->
      <g transform="translate(18, 9)">
        <path d="M2 20L18 10L30 17L14 26L2 20Z" fill="#38BDF8" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M16 18V12" stroke="#241E38" stroke-width="3" stroke-linecap="round"/>
        <rect x="10" y="8" width="12" height="5" rx="2.5" fill="#F59E0B" stroke="#241E38" stroke-width="2.2"/>
        <!-- Little Trowel Eyes -->
        <ellipse cx="14" cy="18" rx="1.5" ry="2.2" fill="#241E38"/>
        <ellipse cx="19" cy="21" rx="1.5" ry="2.2" fill="#241E38"/>
      </g>
      <!-- Paper Mario Level Sparkle Star -->
      <path d="M48 18L49.5 14.5L53 13L49.5 11.5L48 8L46.5 11.5L43 13L46.5 14.5L48 18Z" fill="#FACC15" stroke="#241E38" stroke-width="1.8"/>
    </svg>
  `,

  // 3. งานฝ้า (Gypsum & Suspension Ceiling)
  ceiling: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <path d="M6 32L32 17L58 32L32 47L6 32Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
      <!-- Hanging Suspension Rods with Paper Coil Springs -->
      <line x1="16" y1="6" x2="16" y2="24" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="48" y1="6" x2="48" y2="24" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Spring Coils -->
      <circle cx="16" cy="22" r="3" fill="#F59E0B" stroke="#241E38" stroke-width="2"/>
      <circle cx="48" cy="22" r="3" fill="#F59E0B" stroke="#241E38" stroke-width="2"/>
      <!-- Main Ceiling Grid Tile -->
      <path d="M6 32L32 18L58 32L32 46L6 32Z" fill="#FFFFFF" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- T-Bar Cross Lines in Sky Blue -->
      <path d="M19 25L45 39" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <path d="M45 25L19 39" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <!-- Smiling Paper Mario Downlight in Center -->
      <ellipse cx="32" cy="32" rx="7.5" ry="4.5" fill="#FDE047" stroke="#241E38" stroke-width="2.5"/>
      <circle cx="30" cy="31.5" r="1.2" fill="#241E38"/>
      <circle cx="34" cy="31.5" r="1.2" fill="#241E38"/>
      <path d="M31 33.5C31.5 34.2 32.5 34.2 33 33.5" stroke="#241E38" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Radiating Paper Sunshine Cones -->
      <path d="M25 36L18 54H46L39 36Z" fill="#FEF08A" fill-opacity="0.55"/>
      <line x1="24" y1="48" x2="28" y2="40" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="48" x2="36" y2="40" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 4. งานผนัง TEXCA (Texca Lightweight Block Masonry) - texcaWall / texca
  texcaWall: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Silhouette -->
      <rect x="6" y="20" width="52" height="34" rx="5" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Staggered Texca Lightweight Blocks (Terracotta / Warm Orange) -->
      <!-- Bottom Layer Blocks -->
      <rect x="8" y="36" width="22" height="15" rx="3" fill="#FB923C" stroke="#241E38" stroke-width="2.8"/>
      <rect x="34" y="36" width="22" height="15" rx="3" fill="#F97316" stroke="#241E38" stroke-width="2.8"/>
      <!-- Block Core Holes -->
      <ellipse cx="14" cy="43.5" rx="2.5" ry="3" fill="#EA580C"/>
      <ellipse cx="23" cy="43.5" rx="2.5" ry="3" fill="#EA580C"/>
      <ellipse cx="40" cy="43.5" rx="2.5" ry="3" fill="#C2410C"/>
      <ellipse cx="49" cy="43.5" rx="2.5" ry="3" fill="#C2410C"/>
      <!-- Top Middle Staggered Block -->
      <rect x="18" y="20" width="28" height="15" rx="3" fill="#FDBA74" stroke="#241E38" stroke-width="2.8"/>
      <!-- Paper Mario Eyes on the Main Block! -->
      <ellipse cx="27" cy="27" rx="2" ry="3.2" fill="#241E38"/>
      <circle cx="26.2" cy="25.5" r="1" fill="#FFFFFF"/>
      <ellipse cx="37" cy="27" rx="2" ry="3.2" fill="#241E38"/>
      <circle cx="36.2" cy="25.5" r="1" fill="#FFFFFF"/>
      <path d="M30 30.5C31 31.5 33 31.5 34 30.5" stroke="#241E38" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="23" cy="29" r="1.5" fill="#F97316"/>
      <circle cx="41" cy="29" r="1.5" fill="#F97316"/>
      <!-- Mortar Layer Line -->
      <line x1="6" y1="35.5" x2="58" y2="35.5" stroke="#F1F5F9" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cute Paper Trowel on side -->
      <g transform="translate(36, 4) rotate(18)">
        <path d="M4 14L16 6L20 18L4 14Z" fill="#E2E8F0" stroke="#241E38" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M16 11L21 8" stroke="#241E38" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="21" y="5" width="8" height="4.5" rx="2" fill="#D97706" stroke="#241E38" stroke-width="1.8"/>
      </g>
    </svg>
  `,

  // 5. งานกันซึม (Waterproofing Membrane & Seal) - waterproofing / waterproof
  waterproofing: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <path d="M32 6C32 6 15 23 15 32C15 41.5 22.5 49 32 49C41.5 49 49 41.5 49 32C49 23 32 6 32 6Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
      <!-- Concrete Foundation Layer -->
      <rect x="10" y="44" width="44" height="11" rx="3" fill="#94A3B8" stroke="#241E38" stroke-width="2.8"/>
      <!-- Blue Waterproof Elastomeric Membrane Band -->
      <rect x="8" y="38" width="48" height="7" rx="3" fill="#0284C7" stroke="#241E38" stroke-width="2.8"/>
      <!-- Cheerful Paper Mario Water Drop Mascot -->
      <path d="M32 9C32 9 17 25 17 33C17 41.2 23.7 48 32 48C40.3 48 47 41.2 47 33C47 25 32 9 32 9Z" fill="#38BDF8" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- Droplet Core Depth Shading -->
      <path d="M32 15C32 15 22 26 22 33C22 38.5 26.5 43 32 43C37.5 43 42 38.5 42 33C42 26 32 15 32 15Z" fill="#0EA5E9"/>
      <!-- Paper Mario Cute Vertical Eyes -->
      <ellipse cx="28" cy="32" rx="2" ry="3.5" fill="#241E38"/>
      <circle cx="27.2" cy="30.5" r="1.1" fill="#FFFFFF"/>
      <ellipse cx="36" cy="32" rx="2" ry="3.5" fill="#241E38"/>
      <circle cx="35.2" cy="30.5" r="1.1" fill="#FFFFFF"/>
      <!-- Happy Mascot Smile & Cheeks -->
      <path d="M30 36C31 37.5 33 37.5 34 36" stroke="#241E38" stroke-width="2" stroke-linecap="round"/>
      <circle cx="24.5" cy="34.5" r="1.8" fill="#7DD3FC"/>
      <circle cx="39.5" cy="34.5" r="1.8" fill="#7DD3FC"/>
      <!-- Gloss Specular Highlight Streak -->
      <path d="M24 22C21 26 21 30 22 34" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Water Splash Drops -->
      <circle cx="12" cy="28" r="2.8" fill="#38BDF8" stroke="#241E38" stroke-width="2"/>
      <circle cx="52" cy="30" r="2.2" fill="#38BDF8" stroke="#241E38" stroke-width="2"/>
    </svg>
  `,

  // 6. งานปูกระเบื้อง (Tile Flooring & Grout) - tiling / tile
  tiling: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Silhouette -->
      <rect x="8" y="8" width="48" height="48" rx="6" stroke="#FFFFFF" stroke-width="6"/>
      <!-- 4 Vibrant Ceramic Tile Quadrants -->
      <!-- Tile 1 (Top-Left Bright Teal) -->
      <rect x="10" y="10" width="20" height="20" rx="3.5" fill="#2DD4BF" stroke="#241E38" stroke-width="2.8"/>
      <path d="M14 14L26 26" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.75"/>
      <!-- Tile 2 (Top-Right Mint Green) -->
      <rect x="34" y="10" width="20" height="20" rx="3.5" fill="#14B8A6" stroke="#241E38" stroke-width="2.8"/>
      <!-- Tile 3 (Bottom-Left Mint Green) -->
      <rect x="10" y="34" width="20" height="20" rx="3.5" fill="#14B8A6" stroke="#241E38" stroke-width="2.8"/>
      <!-- Tile 4 (Bottom-Right Deep Teal) -->
      <rect x="34" y="34" width="20" height="20" rx="3.5" fill="#0D9488" stroke="#241E38" stroke-width="2.8"/>
      <path d="M38 38L50 50" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.75"/>
      <!-- Center Grout Spacer Cross in Nintendo Gold -->
      <g transform="translate(32, 32)">
        <circle cx="0" cy="0" r="5.5" fill="#FACC15" stroke="#241E38" stroke-width="2.4"/>
        <line x1="-3" y1="0" x2="3" y2="0" stroke="#241E38" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-3" x2="0" y2="3" stroke="#241E38" stroke-width="2" stroke-linecap="round"/>
      </g>
      <!-- Dazzling Paper Mario Star Sparkle -->
      <path d="M46 16L47.5 12L52 10.5L47.5 9L46 5L44.5 9L40 10.5L44.5 12L46 16Z" fill="#FDE047" stroke="#241E38" stroke-width="1.8"/>
      <circle cx="15" cy="45" r="1.5" fill="#FFFFFF"/>
    </svg>
  `,

  // 7. งานติดตั้งอลูมิเนียม (Aluminum Window Installation)
  aluminum: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Silhouette -->
      <rect x="6" y="8" width="52" height="48" rx="5" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Deep Charcoal Anodized Aluminum Outer Frame -->
      <rect x="8" y="10" width="48" height="44" rx="4" fill="#334155" stroke="#241E38" stroke-width="2.8"/>
      <!-- Window Opening -->
      <rect x="12" y="14" width="40" height="36" fill="#E2E8F0"/>
      <!-- Left Glass Sash -->
      <rect x="13" y="15" width="19" height="34" fill="#BAE6FD" stroke="#241E38" stroke-width="2.4"/>
      <path d="M16 42L28 20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-opacity="0.85"/>
      <!-- Right Glass Sash (Sliding Forward) -->
      <rect x="30" y="15" width="21" height="34" fill="#7DD3FC" stroke="#241E38" stroke-width="2.4"/>
      <path d="M35 44L47 22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-opacity="0.85"/>
      <!-- Cute Flush Handle -->
      <rect x="46" y="27" width="3.5" height="10" rx="1.7" fill="#0F172A" stroke="#241E38" stroke-width="1.5"/>
      <!-- Little Paper Mario Star Peeking Through Window! -->
      <path d="M22 23L23 21L25 20.5L23 20L22 18L21 20L19 20.5L21 21L22 23Z" fill="#FACC15" stroke="#241E38" stroke-width="1.2"/>
      <!-- Corner Bolts -->
      <circle cx="10.5" cy="12.5" r="1.2" fill="#94A3B8"/>
      <circle cx="53.5" cy="12.5" r="1.2" fill="#94A3B8"/>
      <circle cx="10.5" cy="51.5" r="1.2" fill="#94A3B8"/>
      <circle cx="53.5" cy="51.5" r="1.2" fill="#94A3B8"/>
    </svg>
  `,

  // 8. คะแนน WET WORK (Wet Work Quality Assurance Pass)
  wetWork: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Die-cut Outline -->
      <rect x="10" y="10" width="40" height="47" rx="6" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Hardboard Clipboard Body -->
      <rect x="12" y="12" width="36" height="44" rx="4.5" fill="#F8FAFC" stroke="#241E38" stroke-width="2.8"/>
      <!-- Top Brass Binder Clip -->
      <path d="M22 12V8C22 6.5 23.5 5.5 25 5.5H35C36.5 5.5 38 6.5 38 8V12" fill="#F59E0B" stroke="#241E38" stroke-width="2.4"/>
      <circle cx="30" cy="9" r="2" fill="#241E38"/>
      <!-- Checklist Ruled Rows -->
      <line x1="18" y1="21" x2="32" y2="21" stroke="#94A3B8" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="18" y1="29" x2="30" y2="29" stroke="#94A3B8" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="18" y1="37" x2="28" y2="37" stroke="#94A3B8" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Yoshi-Green Checkmarks -->
      <path d="M35 19L38 22L44 16" stroke="#16A34A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M35 27L38 30L44 24" stroke="#16A34A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Big Paper Mario Super Star Gold Badge Stamp! -->
      <g transform="translate(35, 33)">
        <circle cx="12" cy="12" r="11" fill="#FACC15" stroke="#241E38" stroke-width="2.4"/>
        <!-- Star with Paper Mario Cute Eyes -->
        <path d="M12 4.5L14 8.5L18.5 9L15 12.2L16 16.5L12 14.5L8 16.5L9 12.2L5.5 9L10 8.5L12 4.5Z" fill="#FDE047" stroke="#241E38" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="10.8" cy="11.5" rx="0.9" ry="1.6" fill="#241E38"/>
        <ellipse cx="13.2" cy="11.5" rx="0.9" ry="1.6" fill="#241E38"/>
      </g>
    </svg>
  `,

  // 9. งานติดตั้งเฟอร์นิเจอร์ (Built-in Furniture & Cabinetry)
  furniture: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <rect x="8" y="8" width="48" height="48" rx="5" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Wooden Plinth Feet -->
      <rect x="14" y="50" width="7" height="6" rx="2" fill="#78350F" stroke="#241E38" stroke-width="2.4"/>
      <rect x="43" y="50" width="7" height="6" rx="2" fill="#78350F" stroke="#241E38" stroke-width="2.4"/>
      <!-- Cabinet Body (Rich Amber Teak) -->
      <rect x="10" y="10" width="44" height="42" rx="4" fill="#D97706" stroke="#241E38" stroke-width="2.8"/>
      <!-- Left Door (Warm Maple) -->
      <rect x="13" y="13" width="18" height="26" rx="2.5" fill="#FDE68A" stroke="#241E38" stroke-width="2.2"/>
      <!-- Right Door (Warm Maple) -->
      <rect x="33" y="13" width="18" height="26" rx="2.5" fill="#FCD34D" stroke="#241E38" stroke-width="2.2"/>
      <!-- Paper Mario Cute Knobs -->
      <circle cx="27" cy="26" r="2.2" fill="#241E38"/>
      <circle cx="26.3" cy="25.3" r="0.8" fill="#FFFFFF"/>
      <circle cx="37" cy="26" r="2.2" fill="#241E38"/>
      <circle cx="36.3" cy="25.3" r="0.8" fill="#FFFFFF"/>
      <!-- Bottom Wide Storage Drawer -->
      <rect x="13" y="41" width="38" height="8.5" rx="2" fill="#FEF3C7" stroke="#241E38" stroke-width="2.2"/>
      <rect x="28" y="44" width="8" height="2.5" rx="1.2" fill="#241E38"/>
      <!-- Cute Little Star on Door -->
      <path d="M22 19L22.8 17.5L24.5 17.2L23.2 16L23.5 14.2L22 15L20.5 14.2L20.8 16L19.5 17.2L21.2 17.5L22 19Z" fill="#F59E0B"/>
    </svg>
  `,

  // 10. งานปูพื้นไม้ลามิเนต (Laminate Wood Planks)
  laminate: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <rect x="6" y="10" width="52" height="42" rx="6" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Top Staggered Planks -->
      <rect x="8" y="12" width="32" height="11.5" rx="2.5" fill="#D97706" stroke="#241E38" stroke-width="2.6"/>
      <path d="M14 17C18 16 24 18 28 17" stroke="#B45309" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="18" cy="18" r="1.5" fill="#92400E"/>
      <rect x="42" y="12" width="14" height="11.5" rx="2.5" fill="#B45309" stroke="#241E38" stroke-width="2.6"/>
      <!-- Middle Staggered Planks (Golden Honey) -->
      <rect x="8" y="25.5" width="8" height="11.5" rx="2" fill="#D97706" stroke="#241E38" stroke-width="2.6"/>
      <rect x="18" y="25.5" width="38" height="11.5" rx="2.5" fill="#F59E0B" stroke="#241E38" stroke-width="2.6"/>
      <path d="M25 31C31 32 38 30 46 31" stroke="#D97706" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Bottom Staggered Planks -->
      <rect x="8" y="39" width="30" height="11.5" rx="2.5" fill="#B45309" stroke="#241E38" stroke-width="2.6"/>
      <path d="M14 44C20 45 26 43 32 44" stroke="#92400E" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="40" y="39" width="16" height="11.5" rx="2.5" fill="#D97706" stroke="#241E38" stroke-width="2.6"/>
      <!-- Interlocking Gold Joining Star Sparkle -->
      <path d="M40 23L41.5 19.5L45 18L41.5 16.5L40 13L38.5 16.5L35 18L38.5 19.5L40 23Z" fill="#FDE047" stroke="#241E38" stroke-width="1.8"/>
    </svg>
  `,

  // 11. งานติดตั้งประตูไม้ (Wooden Door Installation)
  door: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <rect x="10" y="6" width="44" height="52" rx="5" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Dark Walnut Door Frame -->
      <rect x="12" y="8" width="40" height="48" rx="3.5" fill="#78350F" stroke="#241E38" stroke-width="2.8"/>
      <!-- Warm Teak Wood Door Slab -->
      <rect x="17" y="12" width="30" height="44" fill="#D97706" stroke="#241E38" stroke-width="2.4"/>
      <!-- Upper Shaker Panel -->
      <rect x="22" y="16" width="20" height="16" rx="2" fill="#F59E0B" stroke="#92400E" stroke-width="2"/>
      <!-- Lower Shaker Panel -->
      <rect x="22" y="35" width="20" height="16" rx="2" fill="#F59E0B" stroke="#92400E" stroke-width="2"/>
      <!-- Cute Paper Mario Golden Lever Handle -->
      <circle cx="23.5" cy="33" r="3" fill="#FACC15" stroke="#241E38" stroke-width="2"/>
      <path d="M23.5 33H30C30.8 33 31.5 33.7 31.5 34.5C31.5 35.3 30.8 36 30 36H23.5" fill="#FDE047" stroke="#241E38" stroke-width="1.8"/>
      <!-- Keyhole -->
      <ellipse cx="23.5" cy="37.5" rx="1.2" ry="1.8" fill="#241E38"/>
      <!-- Chrome Hinges -->
      <rect x="45.5" y="18" width="2.8" height="5" rx="1" fill="#E2E8F0" stroke="#241E38" stroke-width="1.2"/>
      <rect x="45.5" y="44" width="2.8" height="5" rx="1" fill="#E2E8F0" stroke="#241E38" stroke-width="1.2"/>
    </svg>
  `,

  // 12. งาน SHOWER SCREEN (Frameless Tempered Glass Shower Enclosure)
  showerScreen: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <rect x="12" y="8" width="40" height="50" rx="5" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Transparent Cyan Paper Glass Pane -->
      <rect x="14" y="10" width="36" height="46" rx="3.5" fill="#BAE6FD" fill-opacity="0.8" stroke="#241E38" stroke-width="2.8"/>
      <!-- Diagonal Paper Reflection Streaks -->
      <path d="M19 50L43 14" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.95"/>
      <path d="M27 52L47 22" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>
      <!-- Heavy Chrome Wall Clamps -->
      <rect x="11" y="16" width="6.5" height="7" rx="2" fill="#CBD5E1" stroke="#241E38" stroke-width="2.2"/>
      <circle cx="14" cy="19.5" r="1.2" fill="#241E38"/>
      <rect x="11" y="41" width="6.5" height="7" rx="2" fill="#CBD5E1" stroke="#241E38" stroke-width="2.2"/>
      <circle cx="14" cy="44.5" r="1.2" fill="#241E38"/>
      <!-- Chrome Shower Door Handle -->
      <rect x="42" y="24" width="3.5" height="18" rx="1.8" fill="#F8FAFC" stroke="#241E38" stroke-width="2"/>
      <!-- Playful Water Droplets sliding down -->
      <ellipse cx="23" cy="24" rx="2" ry="2.8" fill="#0284C7"/>
      <circle cx="22.2" cy="23" r="0.8" fill="#FFFFFF"/>
      <ellipse cx="36" cy="38" rx="2.5" ry="3.2" fill="#0284C7"/>
      <circle cx="35.2" cy="37" r="1" fill="#FFFFFF"/>
    </svg>
  `,

  // 13. งานสี end product (Final Architectural Wall Painting) - paintOnly
  paintOnly: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <path d="M8 14H40C41 14 42 15 42 16V30C38 32 34 28 28 30C22 32 16 29 10 30V16C10 15 9 14 8 14Z" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Fresh Wall Paint Swatch (Princess Peach Pink/Coral) -->
      <path d="M10 14H38C39.5 14 40.5 15 40.5 16.5V29C36 31 32 27 26 29C20 31 15 28 10 29V16.5C10 15 10 14 10 14Z" fill="#F43F5E" stroke="#241E38" stroke-width="2.2"/>
      <!-- Chunky Paper Paint Roller Cylinder -->
      <rect x="17" y="19" width="32" height="13" rx="4.5" fill="#FB7185" stroke="#241E38" stroke-width="2.8"/>
      <!-- Fluffy Texture Lines -->
      <line x1="22" y1="19" x2="22" y2="32" stroke="#E11D48" stroke-width="2.4"/>
      <line x1="44" y1="19" x2="44" y2="32" stroke="#E11D48" stroke-width="2.4"/>
      <!-- Roller Wire Armature -->
      <path d="M49 25.5H55C56.5 25.5 57.5 26.5 57.5 28V37C57.5 38.5 56.5 39.5 55 39.5H34V44" stroke="#241E38" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Cute Blue Ergonomic Handle -->
      <rect x="30" y="43" width="8.5" height="15" rx="3" fill="#3B82F6" stroke="#241E38" stroke-width="2.8"/>
      <circle cx="34" cy="53" r="2" fill="#FFFFFF"/>
      <!-- Fresh Paint Splash Drops -->
      <circle cx="15" cy="35" r="2.5" fill="#F43F5E" stroke="#241E38" stroke-width="1.8"/>
      <circle cx="21" cy="41" r="1.8" fill="#F43F5E" stroke="#241E38" stroke-width="1.5"/>
      <!-- Gold Shine Star -->
      <path d="M48 12L49 9.5L51.5 8.5L49 7.5L48 5L47 7.5L44.5 8.5L47 9.5L48 12Z" fill="#FDE047" stroke="#241E38" stroke-width="1.5"/>
    </svg>
  `,

  // 14. งานเก็บสีอลูมิเนียม (Aluminum Frame Color Touch-up) - aluminumPaint
  aluminumPaint: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <path d="M10 10H36V24H24V50H10V10Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
      <!-- Aluminum Corner Extrusion Profile -->
      <path d="M12 12H34V24H24V48H12V12Z" fill="#334155" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M18 18H28V24H18V18Z" fill="#475569"/>
      <!-- Cute Touch-up Precision Pen / Brush -->
      <g transform="translate(20, 12) rotate(24)">
        <rect x="18" y="2" width="8" height="25" rx="3" fill="#F59E0B" stroke="#241E38" stroke-width="2.4"/>
        <path d="M18 27L22 35L26 27H18Z" fill="#38BDF8" stroke="#241E38" stroke-width="2" stroke-linejoin="round"/>
      </g>
      <!-- Radiant Paper Mario Gold Touch-up Star Burst! -->
      <g transform="translate(32, 33)">
        <path d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5L0 -9Z" fill="#FACC15" stroke="#241E38" stroke-width="2"/>
        <circle cx="0" cy="0" r="2.5" fill="#FFFFFF"/>
      </g>
    </svg>
  `,

  // 15. งานทำความสะอาด (Deep Cleaning & Sparkle Handover) - cleaning
  cleaning: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <circle cx="32" cy="32" r="26" stroke="#FFFFFF" stroke-width="5"/>
      <!-- Window Squeegee -->
      <g transform="rotate(-20 28 28)">
        <rect x="10" y="11" width="30" height="6" rx="2.5" fill="#0D9488" stroke="#241E38" stroke-width="2.4"/>
        <line x1="8" y1="17" x2="42" y2="17" stroke="#241E38" stroke-width="3" stroke-linecap="round"/>
        <path d="M25 17V33" stroke="#241E38" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="22" y="24" width="6" height="13" rx="2.5" fill="#FACC15" stroke="#241E38" stroke-width="2.4"/>
      </g>
      <!-- Cute Spray Bottle -->
      <g transform="translate(34, 23)">
        <path d="M6 14H18C19.5 14 20.5 15 20.5 16.5V29C20.5 30.5 19.5 31.5 18 31.5H6C4.5 31.5 3.5 30.5 3.5 29V16.5C3.5 15 4.5 14 6 14Z" fill="#38BDF8" stroke="#241E38" stroke-width="2.4"/>
        <path d="M9 14V8H15V14" fill="#E2E8F0" stroke="#241E38" stroke-width="2"/>
        <path d="M7 8H2V12L7 10" fill="#EF4444" stroke="#241E38" stroke-width="2"/>
      </g>
      <!-- Big Twinkling Paper Mario Sparkle Stars! -->
      <path d="M15 12L17 6L19 12L25 14L19 16L17 22L15 16L9 14L15 12Z" fill="#FACC15" stroke="#241E38" stroke-width="1.8"/>
      <path d="M49 14L50.5 9.5L52 14L56.5 15.5L52 17L50.5 21.5L49 17L44.5 15.5L49 14Z" fill="#FDE047" stroke="#241E38" stroke-width="1.6"/>
      <!-- Cute Soap Bubble -->
      <circle cx="28" cy="18" r="3.5" fill="#CCFBF1" stroke="#241E38" stroke-width="1.8"/>
      <circle cx="27" cy="16.5" r="1" fill="#FFFFFF"/>
    </svg>
  `,

  // 16. คะแนน END PRODUCT (Final Handover Quality Score & Royal Shield) - endProduct
  endProduct: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Die-cut Crest Outline -->
      <path d="M32 5L52 11.5V28C52 42.5 43.5 51 32 57C20.5 51 12 42.5 12 28V11.5L32 5Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
      <!-- Royal Emerald Crest Shield -->
      <path d="M32 7L50 13V28C50 41.5 42.5 49.5 32 55C21.5 49.5 14 41.5 14 28V13L32 7Z" fill="#10B981" stroke="#241E38" stroke-width="3" stroke-linejoin="round"/>
      <!-- Inner Gold Inset Border -->
      <path d="M32 12L45 16.5V28C45 38.5 39 45 32 49.5C25 45 19 38.5 19 28V16.5L32 12Z" fill="#047857" stroke="#FACC15" stroke-width="2"/>
      <!-- Radiant Paper Mario Super Star Mascot in Center! -->
      <path d="M32 18L35.8 25.5L44 26.7L38 32.5L39.4 40.7L32 36.8L24.6 40.7L26 32.5L20 26.7L28.2 25.5L32 18Z" fill="#FACC15" stroke="#241E38" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Star Paper Mario Cute Vertical Black Eyes! -->
      <ellipse cx="30" cy="28.5" rx="1.2" ry="2.4" fill="#241E38"/>
      <ellipse cx="34" cy="28.5" rx="1.2" ry="2.4" fill="#241E38"/>
      <circle cx="32" cy="23" r="1.5" fill="#FFFFFF"/>
    </svg>
  `,

  // 17. พื้นที่ส่วนกลาง (Common Area & Clubhouse) - common
  common: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- White Sticker Outline -->
      <path d="M18 12H46V49H18V12Z" stroke="#FFFFFF" stroke-width="6"/>
      <ellipse cx="32" cy="51" rx="25" ry="6" stroke="#FFFFFF" stroke-width="6"/>
      <!-- Green Landscaped Paper Hill Pad -->
      <ellipse cx="32" cy="51" rx="24" ry="5.5" fill="#86EFAC" stroke="#241E38" stroke-width="2.6"/>
      <!-- Main Clubhouse Tower (Royal Indigo) -->
      <rect x="20" y="14" width="24" height="36" rx="3.5" fill="#6366F1" stroke="#241E38" stroke-width="2.8"/>
      <!-- Paper Mario Colorful Roof Eaves -->
      <path d="M17 16L32 6L47 16H17Z" fill="#EF4444" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- Warm Glowing Arched Windows -->
      <rect x="24" y="20" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#241E38" stroke-width="1.8"/>
      <rect x="34" y="20" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#241E38" stroke-width="1.8"/>
      <rect x="24" y="28" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#241E38" stroke-width="1.8"/>
      <rect x="34" y="28" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#241E38" stroke-width="1.8"/>
      <!-- Lobby Glass Arched Entrance -->
      <path d="M27 50V38C27 36.5 28.5 35 32 35C35.5 35 37 36.5 37 38V50H27Z" fill="#BAE6FD" stroke="#241E38" stroke-width="2.2"/>
      <!-- Puffy Green Paper Mario Trees -->
      <g transform="translate(10, 36)">
        <circle cx="4" cy="4" r="5.5" fill="#22C55E" stroke="#241E38" stroke-width="2.2"/>
        <line x1="4" y1="9.5" x2="4" y2="15" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <g transform="translate(46, 37)">
        <circle cx="4" cy="4" r="5.5" fill="#16A34A" stroke="#241E38" stroke-width="2.2"/>
        <line x1="4" y1="9.5" x2="4" y2="14" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </svg>
  `,

  // 18. Electrical (Auxiliary)
  electrical: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" fill="#FEF08A" stroke="#241E38" stroke-width="2.8"/>
      <path d="M35 12L20 34H33L29 52L46 28H32L35 12Z" fill="#FACC15" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
    </svg>
  `,

  // 19. Plumbing (Auxiliary)
  plumbing: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 20H28V36H50V50H14V20Z" fill="#38BDF8" stroke="#241E38" stroke-width="2.8" stroke-linejoin="round"/>
      <circle cx="44" cy="24" r="4" fill="#0284C7" stroke="#241E38" stroke-width="2"/>
    </svg>
  `,

  // 20. AirCon (Auxiliary)
  airCon: `
    <svg viewBox="0 0 64 64" class="nintendo-work-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="44" height="24" rx="4" fill="#E0F2FE" stroke="#241E38" stroke-width="2.8"/>
      <line x1="16" y1="36" x2="48" y2="36" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M22 46C24 49 28 49 30 46M34 46C36 49 40 49 42 46" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
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
