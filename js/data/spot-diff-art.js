/* =========================================================================
   SPOT THE DIFFERENCE ILLUSTRATED DIORAMA ENGINE (茶餐廳與港溫搵錯處 · 300 Unique Puzzles)
   12 Rich HK × Vancouver × Cozy Tea-House Worlds × 5 Editions × Curated Hotspots
   Zero external assets, 100% browser-rendered SVG, strict ES2019 compatibility.
   ========================================================================= */

const EDITIONS = [
  { skyA: '#BCE6FF', skyB: '#FFF6DC', wallA: '#FFF7E5', wallB: '#F2DFBE', waterA: '#3BAFDA', waterB: '#1D7FA8', trim: '#C8372D', zh: '晨光版', en: 'Morning Edition' },
  { skyA: '#FFD1A8', skyB: '#FFF0C9', wallA: '#FDEBD6', wallB: '#ECCBA8', waterA: '#4BB3C9', waterB: '#226E8C', trim: '#D96B27', zh: '晚霞版', en: 'Sunset Edition' },
  { skyA: '#C7F2E3', skyB: '#F7FFF9', wallA: '#EEF9F3', wallB: '#D2EBDD', waterA: '#2FA89B', waterB: '#196E67', trim: '#1D6F58', zh: '清風版', en: 'Breeze Edition' },
  { skyA: '#FFE0E6', skyB: '#FFF8E6', wallA: '#FFF1F0', wallB: '#F5D5CF', waterA: '#4C9ED9', waterB: '#286494', trim: '#B52B38', zh: '喜慶版', en: 'Festive Edition' },
  { skyA: '#C9D6FF', skyB: '#F3E7FF', wallA: '#F4F1FA', wallB: '#DDD4EC', waterA: '#4A7BC7', waterB: '#274B8A', trim: '#6C3FA8', zh: '柔夜版', en: 'Twilight Edition' }
];

export const SPOT_WORLDS = [
  {
    id: 'yumcha',
    region: 'hk',
    title: { zh: '🫖 傳統茶樓早茶枱', en: '🫖 Cantonese Dim Sum Table' },
    hotspots: [
      { x: 58, y: 44, r: 28, zh: '宮燈流蘇', en: 'Palace Lantern' },
      { x: 144, y: 42, r: 28, zh: '滿洲窗花', en: 'Stained-Glass Window' },
      { x: 230, y: 44, r: 28, zh: '茶樓掛鐘', en: 'Tea-House Wall Clock' },
      { x: 306, y: 48, r: 28, zh: '招財貓擺設', en: 'Lucky Cat Figurine' },
      { x: 62, y: 148, r: 30, zh: '茗茶瓷壺', en: 'Porcelain Teapot' },
      { x: 148, y: 140, r: 30, zh: '蝦餃竹籠', en: 'Shrimp Dumpling Steamer' },
      { x: 232, y: 148, r: 28, zh: '酥皮蛋撻', en: 'Golden Egg Tarts' },
      { x: 304, y: 160, r: 28, zh: '茶杯與筷子', en: 'Teacups & Chopsticks' }
    ]
  },
  {
    id: 'bing_sutt',
    region: 'hk',
    title: { zh: '🧋 懷舊冰室茶餐廳', en: '🧋 Retro HK Cha Chaan Teng' },
    hotspots: [
      { x: 60, y: 44, r: 28, zh: '冰室霓虹燈', en: 'Cafe Neon Sign' },
      { x: 148, y: 40, r: 28, zh: '復古吊扇', en: 'Ceiling Fan' },
      { x: 234, y: 46, r: 28, zh: '是日餐牌', en: 'Daily Menu Board' },
      { x: 306, y: 48, r: 28, zh: '懷舊日曆', en: 'Wall Tear Calendar' },
      { x: 64, y: 148, r: 30, zh: '凍檸茶', en: 'Iced Lemon Tea' },
      { x: 150, y: 152, r: 30, zh: '鮮油菠蘿包', en: 'Pineapple Butter Bun' },
      { x: 236, y: 148, r: 28, zh: '港式奶茶杯', en: 'Milk Tea Cup' },
      { x: 306, y: 162, r: 28, zh: '冰室貓店長', en: 'Shopkeeper Cat' }
    ]
  },
  {
    id: 'hk_tram',
    region: 'hk',
    title: { zh: '🚋 港島叮叮電車街景', en: '🚋 HK Ding-Ding Tram Street' },
    hotspots: [
      { x: 56, y: 40, r: 28, zh: '晴空太陽與飛鳥', en: 'Sun & Sky Bird' },
      { x: 144, y: 46, r: 28, zh: '老字號霓虹招牌', en: 'Shophouse Signboard' },
      { x: 232, y: 44, r: 28, zh: '唐樓露台花盆', en: 'Balcony Flower Pot' },
      { x: 306, y: 48, r: 28, zh: '洋紫荊樹', en: 'Bauhinia Street Tree' },
      { x: 56, y: 154, r: 28, zh: '行人紅綠燈', en: 'Traffic Signal' },
      { x: 150, y: 136, r: 32, zh: '雙層叮叮電車', en: 'Double-Decker Tram' },
      { x: 242, y: 158, r: 28, zh: '街角郵筒', en: 'Street Postbox' },
      { x: 306, y: 166, r: 28, zh: '香港的士', en: 'HK Urban Taxi' }
    ]
  },
  {
    id: 'harbour',
    region: 'hk',
    title: { zh: '⛴️ 維港天星與紅帆船', en: '⛴️ Victoria Harbour & Star Ferry' },
    hotspots: [
      { x: 58, y: 42, r: 28, zh: '海鷗飛翔', en: 'Harbour Seagulls' },
      { x: 140, y: 50, r: 28, zh: '尖沙咀鐘樓', en: 'Clock Tower' },
      { x: 226, y: 48, r: 28, zh: '摩天大廈頂燈', en: 'Skyscraper Spire' },
      { x: 306, y: 42, r: 28, zh: '太平山日與雲', en: 'Harbour Sun & Cloud' },
      { x: 60, y: 156, r: 28, zh: '碼頭救生圈', en: 'Pier Lifebuoy' },
      { x: 148, y: 144, r: 30, zh: '天星小輪', en: 'Star Ferry' },
      { x: 240, y: 138, r: 30, zh: '傳統紅帆船', en: 'Red-Sail Junk Boat' },
      { x: 306, y: 168, r: 28, zh: '海面浮標與躍魚', en: 'Harbour Buoy & Fish' }
    ]
  },
  {
    id: 'stanley_park',
    region: 'yvr',
    title: { zh: '🌲 溫哥華史丹利公園海堤', en: '🌲 Stanley Park Seawall' },
    hotspots: [
      { x: 58, y: 42, r: 28, zh: '水上飛機', en: 'Harbour Floatplane' },
      { x: 148, y: 44, r: 28, zh: '北溫雪山峰', en: 'Snowy Mountain Peak' },
      { x: 236, y: 52, r: 28, zh: '獅門大橋塔頂', en: 'Lions Gate Bridge' },
      { x: 306, y: 48, r: 28, zh: '紅松樹與飛鷹', en: 'Cedar Tree & Eagle' },
      { x: 60, y: 158, r: 28, zh: '海堤木長椅', en: 'Seawall Park Bench' },
      { x: 148, y: 136, r: 30, zh: '海灣帆船', en: 'Inlet Sailboat' },
      { x: 234, y: 162, r: 28, zh: '加拿大雁家庭', en: 'Canada Goose Family' },
      { x: 306, y: 162, r: 28, zh: '單車與花籃', en: 'Seawall Bicycle' }
    ]
  },
  {
    id: 'gastown',
    region: 'yvr',
    title: { zh: '🕰️ 煤氣鎮蒸汽鐘廣場', en: '🕰️ Gastown Steam Clock Plaza' },
    hotspots: [
      { x: 56, y: 46, r: 28, zh: '復古五燈街燈', en: 'Victorian Streetlamp' },
      { x: 144, y: 38, r: 28, zh: '蒸汽白煙團', en: 'Clock Steam Puffs' },
      { x: 232, y: 48, r: 28, zh: '紅磚拱窗', en: 'Heritage Brick Window' },
      { x: 306, y: 48, r: 28, zh: '加拿大紅楓樹', en: 'Autumn Maple Tree' },
      { x: 60, y: 154, r: 28, zh: '露天咖啡座遮陽傘', en: 'Cafe Patio Umbrella' },
      { x: 144, y: 134, r: 30, zh: '蒸汽鐘鐘面', en: 'Steam Clock Dial' },
      { x: 232, y: 160, r: 28, zh: '木桶鮮花', en: 'Wooden Flower Barrel' },
      { x: 304, y: 162, r: 28, zh: '復古甲蟲車', en: 'Classic Vintage Car' }
    ]
  },
  {
    id: 'wet_market',
    region: 'both',
    title: { zh: '🥬 街市生果鮮花檔', en: '🥬 Bustling Fruit & Flower Stall' },
    hotspots: [
      { x: 58, y: 44, r: 28, zh: '街市紅燈罩', en: 'Market Lampshade' },
      { x: 146, y: 38, r: 28, zh: '檔口帆布篷', en: 'Striped Stall Awning' },
      { x: 232, y: 46, r: 28, zh: '手寫價錢牌', en: 'Price Sign Card' },
      { x: 306, y: 46, r: 28, zh: '吊掛大梳香蕉', en: 'Hanging Bananas' },
      { x: 60, y: 152, r: 30, zh: '金字塔甜橙', en: 'Orange Pyramid' },
      { x: 146, y: 150, r: 30, zh: '火龍果與鮮果箱', en: 'Dragonfruit Crate' },
      { x: 232, y: 150, r: 28, zh: '傳統銅秤', en: 'Brass Market Scale' },
      { x: 306, y: 158, r: 28, zh: '鮮花水桶', en: 'Fresh Flower Bucket' }
    ]
  },
  {
    id: 'dragon_boat',
    region: 'both',
    title: { zh: '🚣 端午龍舟競渡', en: '🚣 Dragon Boat Festival Race' },
    hotspots: [
      { x: 56, y: 42, r: 28, zh: '彩氣球', en: 'Festival Balloon' },
      { x: 144, y: 46, r: 28, zh: '岸邊觀禮亭', en: 'Shoreline Pavilion' },
      { x: 232, y: 42, r: 28, zh: '彩色三角旗', en: 'Festival Bunting Flags' },
      { x: 306, y: 42, r: 28, zh: '夏日驕陽', en: 'Summer Sun' },
      { x: 66, y: 140, r: 30, zh: '威武龍舟頭', en: 'Carved Dragon Head' },
      { x: 148, y: 136, r: 30, zh: '船頭大鼓與鼓手', en: 'Drummer & Big Drum' },
      { x: 236, y: 146, r: 30, zh: '健兒划槳', en: 'Synchronized Paddles' },
      { x: 306, y: 164, r: 28, zh: '終點浮標旗', en: 'Finish Buoy Flag' }
    ]
  },
  {
    id: 'living_room',
    region: 'both',
    title: { zh: '🏡 溫馨客廳貓咪午後', en: '🏡 Cozy Cat Living Room' },
    hotspots: [
      { x: 58, y: 46, r: 28, zh: '牆上風景畫', en: 'Framed Wall Art' },
      { x: 148, y: 48, r: 28, zh: '陽光窗簾', en: 'Sunny Window Curtain' },
      { x: 236, y: 48, r: 28, zh: '書櫃獎盃與書本', en: 'Bookshelf Trophy' },
      { x: 306, y: 52, r: 28, zh: '客廳落地燈', en: 'Standing Floor Lamp' },
      { x: 60, y: 154, r: 28, zh: '室內盆栽', en: 'Potted House Plant' },
      { x: 148, y: 156, r: 28, zh: '茶几茶點盤', en: 'Coffee Table Tea Tray' },
      { x: 238, y: 146, r: 30, zh: '扶手椅與三色貓', en: 'Armchair & Calico Cat' },
      { x: 306, y: 168, r: 28, zh: '毛冷球', en: 'Cozy Yarn Ball' }
    ]
  },
  {
    id: 'flower_market',
    region: 'hk',
    title: { zh: '🌸 維園新春年宵花市', en: '🌸 Lunar New Year Flower Market' },
    hotspots: [
      { x: 58, y: 44, r: 28, zh: '新春紅燈籠串', en: 'Red Lantern String' },
      { x: 150, y: 42, r: 28, zh: '花市牌樓橫額', en: 'Market Archway Plaque' },
      { x: 240, y: 44, r: 28, zh: '轉運風車', en: 'Lucky Pinwheel' },
      { x: 306, y: 46, r: 28, zh: '賀年大氣球', en: 'Festive Balloon' },
      { x: 62, y: 150, r: 30, zh: '大吉年桔盆栽', en: 'Kumquat Tree & Lai-See' },
      { x: 150, y: 146, r: 30, zh: '桃花瓷瓶', en: 'Peach Blossom Vase' },
      { x: 236, y: 154, r: 28, zh: '水仙花盆', en: 'Narcissus Bowl' },
      { x: 306, y: 160, r: 28, zh: '賀年全盒', en: 'Festive Candy Box' }
    ]
  },
  {
    id: 'skytrain',
    region: 'yvr',
    title: { zh: '🚆 溫哥華天車與海上巴士', en: '🚆 SkyTrain & SeaBus Harbour' },
    hotspots: [
      { x: 58, y: 40, r: 28, zh: '海灣白雲與飛鳥', en: 'Clouds & Gull' },
      { x: 148, y: 44, r: 28, zh: '山脈雪頂纜車', en: 'Mountain Peak' },
      { x: 238, y: 46, r: 28, zh: '港口貨櫃吊機', en: 'Harbour Port Crane' },
      { x: 306, y: 46, r: 28, zh: '車站標誌牌', en: 'Transit Station Sign' },
      { x: 68, y: 108, r: 30, zh: '高架天車列車', en: 'Elevated SkyTrain' },
      { x: 154, y: 156, r: 30, zh: '海上巴士渡輪', en: 'SeaBus Catamaran' },
      { x: 240, y: 160, r: 28, zh: '海濱楓樹', en: 'Waterfront Maple' },
      { x: 306, y: 166, r: 28, zh: '碼頭木樁海鷗', en: 'Pier Gull on Bollard' }
    ]
  },
  {
    id: 'koi_garden',
    region: 'both',
    title: { zh: '🏞️ 鯉魚池茶亭花園', en: '🏞️ Classical Koi & Lotus Garden' },
    hotspots: [
      { x: 58, y: 44, r: 28, zh: '翠竹與翠鳥', en: 'Bamboo & Songbird' },
      { x: 148, y: 42, r: 28, zh: '茶亭飛簷頂飾', en: 'Tea Pavilion Roof' },
      { x: 238, y: 44, r: 28, zh: '紅梅花枝', en: 'Blossom Branch' },
      { x: 306, y: 48, r: 28, zh: '石燈籠燭光', en: 'Stone Garden Lantern' },
      { x: 64, y: 150, r: 30, zh: '荷葉與蓮花', en: 'Lotus Pad & Bloom' },
      { x: 150, y: 124, r: 30, zh: '朱紅拱橋', en: 'Crimson Moon Bridge' },
      { x: 232, y: 164, r: 30, zh: '池中錦鯉', en: 'Swimming Koi Fish' },
      { x: 306, y: 160, r: 28, zh: '湖石與蜻蜓', en: 'Garden Rock & Dragonfly' }
    ]
  }
];

function getWorldMap() {
  const m = {};
  for (let i = 0; i < SPOT_WORLDS.length; i++) {
    m[SPOT_WORLDS[i].id] = SPOT_WORLDS[i];
  }
  return m;
}
const WORLD_BY_ID = getWorldMap();

export function getSpotWorldMeta(worldId) {
  return WORLD_BY_ID[worldId] || SPOT_WORLDS[0];
}

// Helper: returns null if slot not mutated, otherwise 0 or 1 (mutation mode)
function dm(diffMap, slot) {
  return Object.prototype.hasOwnProperty.call(diffMap, slot) ? diffMap[slot] : -1;
}

/* =========================================================================
   12 RICH DIORAMA RENDERERS (360 x 230 SVG)
   ========================================================================= */

function renderYumCha(ed, seed, d, uid) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  const cloth = seed % 2 === 0 ? '#FFF9EE' : '#FFF1EE';
  const clothTrim = seed % 2 === 0 ? '#C8372D' : '#D98A2B';
  return [
    '<defs><linearGradient id="w_' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + ed.wallA + '"/><stop offset="100%" stop-color="' + ed.wallB + '"/></linearGradient></defs>',
    '<rect width="360" height="230" fill="url(#w_' + uid + ')"/>',
    '<rect x="0" y="92" width="360" height="8" fill="#8B4513" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="180" cy="186" rx="176" ry="76" fill="' + clothTrim + '" stroke="#2B2118" stroke-width="2.5"/>',
    '<ellipse cx="180" cy="182" rx="166" ry="68" fill="' + cloth + '" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="180" cy="158" rx="92" ry="30" fill="#F4E3C3" stroke="#C9A66B" stroke-width="2"/>',
    // Slot 0: Palace Lantern (58, 44)
    '<line x1="58" y1="0" x2="58" y2="22" stroke="#2B2118" stroke-width="2.5"/>',
    '<ellipse cx="58" cy="40" rx="22" ry="17" fill="' + (s0 === 0 ? '#F5A623' : '#E03131') + '" stroke="#2B2118" stroke-width="2.4"/>',
    '<rect x="48" y="21" width="20" height="5" rx="2" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    '<rect x="48" y="55" width="20" height="5" rx="2" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    s0 === 1
      ? '<circle cx="58" cy="40" r="6" fill="#FFD43B"/><line x1="52" y1="60" x2="52" y2="74" stroke="#12B886" stroke-width="3"/><line x1="64" y1="60" x2="64" y2="74" stroke="#12B886" stroke-width="3"/>'
      : '<line x1="58" y1="60" x2="58" y2="75" stroke="#FFD43B" stroke-width="3.5"/>',
    // Slot 1: Canton Window (144, 42)
    '<rect x="116" y="16" width="56" height="52" rx="8" fill="#FFFDF9" stroke="#5C3A21" stroke-width="3"/>',
    '<line x1="144" y1="16" x2="144" y2="68" stroke="#5C3A21" stroke-width="2"/><line x1="116" y1="42" x2="172" y2="42" stroke="#5C3A21" stroke-width="2"/>',
    s1 === 0
      ? '<circle cx="144" cy="42" r="13" fill="#FF6B6B" stroke="#2B2118" stroke-width="2"/>'
      : '<polygon points="144,26 158,42 144,58 130,42" fill="' + (s1 === 1 ? '#339AF0' : '#20C997') + '" stroke="#2B2118" stroke-width="2"/>',
    // Slot 2: Wall Clock (230, 44)
    '<circle cx="230" cy="44" r="22" fill="' + (s2 === 0 ? '#FFE8CC' : '#FFFFFF') + '" stroke="' + (s2 === 0 ? '#1D6F58' : '#C8372D') + '" stroke-width="4"/>',
    '<circle cx="230" cy="44" r="2.5" fill="#2B2118"/>',
    s2 === 1
      ? '<line x1="230" y1="44" x2="242" y2="44" stroke="#2B2118" stroke-width="2.8" stroke-linecap="round"/><line x1="230" y1="44" x2="230" y2="57" stroke="#E03131" stroke-width="2.4" stroke-linecap="round"/>'
      : '<line x1="230" y1="44" x2="218" y2="44" stroke="#2B2118" stroke-width="2.8" stroke-linecap="round"/><line x1="230" y1="44" x2="230" y2="29" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>',
    // Slot 3: Shelf Lucky Cat (306, 48)
    '<rect x="280" y="64" width="52" height="6" rx="3" fill="#8B4513" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="293,38 290,25 301,32" fill="#33241F" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="319,38 322,25 311,32" fill="#FA9832" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="306" cy="47" rx="16" ry="15" fill="' + (s3 === 0 ? '#FFD43B' : '#FFFDF7') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="301" cy="45" r="2.2" fill="#186A4B"/><circle cx="311" cy="45" r="2.2" fill="#186A4B"/>',
    s3 === 1
      ? '<ellipse cx="323" cy="42" rx="5" ry="8" fill="#FFFDF7" stroke="#2B2118" stroke-width="2"/>'
      : '<ellipse cx="289" cy="42" rx="5" ry="8" fill="#FFFDF7" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="306" cy="56" r="4" fill="' + (s3 === 0 ? '#20C997' : '#E03131') + '" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 4: Teapot (62, 148)
    '<path d="M36,146 Q26,136 36,128" fill="none" stroke="' + (s4 === 0 ? '#F59F00' : '#20C997') + '" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M84,136 Q98,136 92,154 Q88,160 82,156" fill="none" stroke="' + (s4 === 0 ? '#F59F00' : '#20C997') + '" stroke-width="4.5"/>',
    '<ellipse cx="62" cy="150" rx="23" ry="18" fill="' + (s4 === 0 ? '#FFD43B' : '#38D9A9') + '" stroke="#2B2118" stroke-width="2.4"/>',
    '<ellipse cx="62" cy="132" rx="13" ry="5" fill="#FFF9DB" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="62" cy="126" r="4.5" fill="#E03131" stroke="#2B2118" stroke-width="1.8"/>',
    s4 === 1 ? '' : '<path d="M28,118 Q24,108 31,102" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
    // Slot 5: Bamboo Steamer (148, 140)
    '<ellipse cx="148" cy="148" rx="34" ry="18" fill="#DDA15E" stroke="#2B2118" stroke-width="2.4"/>',
    '<ellipse cx="148" cy="138" rx="34" ry="16" fill="#F4D5A6" stroke="#2B2118" stroke-width="2.4"/>',
    '<circle cx="137" cy="136" r="8.5" fill="' + (s5 === 0 ? '#FFD43B' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="159" cy="136" r="8.5" fill="' + (s5 === 0 ? '#FFD43B' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="148" cy="144" r="8.5" fill="' + (s5 === 0 ? '#FFD43B' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '<circle cx="148" cy="128" r="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/><circle cx="148" cy="127" r="2.5" fill="#FA5252"/>' : '<circle cx="148" cy="142" r="2.5" fill="#FA5252"/>',
    // Slot 6: Egg Tarts (232, 148)
    '<ellipse cx="232" cy="152" rx="28" ry="14" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>',
    '<ellipse cx="221" cy="148" rx="10" ry="6.5" fill="#F4A261" stroke="#2B2118" stroke-width="1.8"/><ellipse cx="221" cy="147" rx="7" ry="4" fill="' + (s6 === 0 ? '#FF6B6B' : '#FFD43B') + '"/>',
    '<ellipse cx="243" cy="148" rx="10" ry="6.5" fill="#F4A261" stroke="#2B2118" stroke-width="1.8"/><ellipse cx="243" cy="147" rx="7" ry="4" fill="' + (s6 === 0 ? '#FF6B6B' : '#FFD43B') + '"/>',
    s6 === 1 ? '<ellipse cx="232" cy="140" rx="10" ry="6.5" fill="#F4A261" stroke="#2B2118" stroke-width="1.8"/><ellipse cx="232" cy="139" rx="7" ry="4" fill="#FFD43B"/>' : '',
    // Slot 7: Teacups & Chopsticks (304, 160)
    '<ellipse cx="294" cy="158" rx="10" ry="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/><ellipse cx="294" cy="155" rx="7" ry="3.5" fill="#B2F2BB"/>',
    s7 === 1 ? '' : '<ellipse cx="315" cy="154" rx="10" ry="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/><ellipse cx="315" cy="151" rx="7" ry="3.5" fill="#B2F2BB"/>',
    '<line x1="284" y1="173" x2="326" y2="169" stroke="' + (s7 === 0 ? '#E03131' : '#8B5A2B') + '" stroke-width="3.2" stroke-linecap="round"/>',
    '<line x1="284" y1="178" x2="326" y2="174" stroke="' + (s7 === 0 ? '#E03131' : '#8B5A2B') + '" stroke-width="3.2" stroke-linecap="round"/>'
  ].join('');
}

function renderBingSutt(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  const tileBg = seed % 2 === 0 ? '#D8F3DC' : '#E3F2FD';
  return [
    '<rect width="360" height="230" fill="' + tileBg + '"/>',
    '<line x1="0" y1="45" x2="360" y2="45" stroke="#B7E4C7" stroke-width="1.5"/><line x1="0" y1="90" x2="360" y2="90" stroke="#95D5B2" stroke-width="2"/>',
    '<rect x="0" y="102" width="360" height="58" rx="6" fill="#C8372D" stroke="#2B2118" stroke-width="2.5"/>',
    '<rect x="0" y="132" width="360" height="98" fill="#FAF0CA" stroke="#2B2118" stroke-width="2.5"/>',
    // Slot 0: Neon Sign (60, 44)
    '<rect x="26" y="24" width="68" height="38" rx="10" fill="#2B2118" stroke="' + (s0 === 0 ? '#4DABF7' : '#FF6B9D') + '" stroke-width="3.5"/>',
    '<circle cx="44" cy="43" r="8" fill="' + (s0 === 0 ? '#4DABF7' : '#FFD43B') + '"/>',
    s0 === 1
      ? '<polygon points="72,33 76,49 62,39 79,39 65,49" fill="#FF6B9D"/>'
      : '<rect x="60" y="36" width="22" height="14" rx="4" fill="#FF6B9D"/>',
    // Slot 1: Ceiling Fan (148, 40)
    '<line x1="148" y1="0" x2="148" y2="34" stroke="#2B2118" stroke-width="3"/>',
    '<ellipse cx="124" cy="38" rx="18" ry="5" fill="#8D5524" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="172" cy="38" rx="18" ry="5" fill="#8D5524" stroke="#2B2118" stroke-width="2"/>',
    s1 === 1 ? '<ellipse cx="148" cy="54" rx="5" ry="14" fill="#8D5524" stroke="#2B2118" stroke-width="2"/>' : '',
    '<circle cx="148" cy="38" r="7" fill="' + (s1 === 0 ? '#E03131' : '#FFD43B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    // Slot 2: Menu Board (234, 46)
    '<rect x="202" y="20" width="64" height="48" rx="6" fill="#264653" stroke="#8B5A2B" stroke-width="3.5"/>',
    '<line x1="212" y1="34" x2="254" y2="34" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
    '<line x1="212" y1="45" x2="244" y2="45" stroke="' + (s2 === 0 ? '#FF6B6B' : '#FFD43B') + '" stroke-width="3" stroke-linecap="round"/>',
    s2 === 1 ? '<circle cx="252" cy="54" r="6" fill="#FFD43B"/>' : '<circle cx="218" cy="56" r="4.5" fill="#51CF66"/>',
    // Slot 3: Tear Calendar (306, 48)
    '<rect x="284" y="22" width="44" height="50" rx="5" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.4"/>',
    '<rect x="284" y="22" width="44" height="14" rx="4" fill="' + (s3 === 0 ? '#1D6F58' : '#E03131') + '" stroke="#2B2118" stroke-width="2"/>',
    s3 === 1
      ? '<circle cx="306" cy="52" r="9" fill="#FFD43B" stroke="#2B2118" stroke-width="2"/>'
      : '<rect x="296" y="43" width="20" height="18" rx="3" fill="#FFE3E3" stroke="#E03131" stroke-width="2"/>',
    // Slot 4: Iced Lemon Tea (64, 148)
    '<polygon points="48,124 80,124 75,174 53,174" fill="#D97706" stroke="#2B2118" stroke-width="2.4"/>',
    '<line x1="70" y1="108" x2="62" y2="150" stroke="' + (s4 === 0 ? '#20C997' : '#E03131') + '" stroke-width="4" stroke-linecap="round"/>',
    '<circle cx="58" cy="138" r="7" fill="#FFD43B" stroke="#FFF9DB" stroke-width="2"/>',
    s4 === 1 ? '' : '<circle cx="67" cy="154" r="7" fill="#FFD43B" stroke="#FFF9DB" stroke-width="2"/>',
    // Slot 5: Pineapple Bun w/ Butter (150, 152)
    '<ellipse cx="150" cy="164" rx="32" ry="12" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>',
    '<path d="M126,156 Q150,124 174,156 Z" fill="#F59F00" stroke="#2B2118" stroke-width="2.4"/>',
    '<line x1="136" y1="142" x2="164" y2="142" stroke="#B45309" stroke-width="2"/><line x1="142" y1="136" x2="142" y2="154" stroke="#B45309" stroke-width="2"/><line x1="158" y1="136" x2="158" y2="154" stroke="#B45309" stroke-width="2"/>',
    s5 === 0 ? '' : '<rect x="132" y="152" width="36" height="7" rx="2" fill="#FFF3BF" stroke="#2B2118" stroke-width="1.8"/>',
    s5 === 1 ? '<circle cx="150" cy="133" r="5" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 6: HK Milk Tea Cup (236, 148)
    '<ellipse cx="236" cy="164" rx="25" ry="9" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/>',
    '<path d="M218,136 L254,136 L249,162 L223,162 Z" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="220" y="143" width="32" height="7" fill="' + (s6 === 0 ? '#228BE6' : '#E03131') + '"/>',
    '<ellipse cx="236" cy="136" rx="18" ry="5" fill="#B07D52" stroke="#2B2118" stroke-width="1.8"/>',
    s6 === 1 ? '<path d="M254,142 Q266,142 262,154 Q259,158 251,156" fill="none" stroke="#FFD43B" stroke-width="3.5"/>' : '<path d="M254,142 Q265,142 261,154 Q258,158 251,156" fill="none" stroke="#2B2118" stroke-width="2.5"/>',
    // Slot 7: Shop Cat (306, 162)
    '<ellipse cx="306" cy="166" rx="20" ry="13" fill="' + (s7 === 0 ? '#ADB5BD' : '#FA9832') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="294" cy="156" r="11" fill="' + (s7 === 0 ? '#ADB5BD' : '#FA9832') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<polygon points="286,149 284,139 293,145" fill="#2B2118"/><polygon points="302,149 304,139 295,145" fill="#FA9832" stroke="#2B2118" stroke-width="1.5"/>',
    s7 === 1
      ? '<path d="M324,164 Q336,140 326,134" fill="none" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M324,168 Q335,172 328,178" fill="none" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/>'
  ].join('');
}

function renderHkTram(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  const bldg1 = seed % 2 === 0 ? '#FFE8CC' : '#FFD8A8';
  return [
    '<rect width="360" height="168" fill="' + ed.skyA + '"/>',
    '<rect x="96" y="34" width="84" height="134" fill="' + bldg1 + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="184" y="28" width="86" height="140" fill="#FFF3BF" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="0" y="168" width="360" height="62" fill="#495057" stroke="#2B2118" stroke-width="2.2"/>',
    '<line x1="16" y1="198" x2="344" y2="198" stroke="#FFD43B" stroke-width="3" stroke-dasharray="16 12"/>',
    '<line x1="150" y1="8" x2="150" y2="82" stroke="#2B2118" stroke-width="2"/><line x1="0" y1="10" x2="360" y2="10" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 0: Sun & Sky Bird (56, 40)
    '<circle cx="48" cy="38" r="15" fill="' + (s0 === 0 ? '#FF922B' : '#FFD43B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s0 === 1 ? '' : '<path d="M72,34 Q78,26 84,34 Q90,26 96,34" fill="none" stroke="#2B2118" stroke-width="2.5" stroke-linecap="round"/>',
    // Slot 1: Shophouse Signboard (144, 46)
    '<rect x="112" y="34" width="60" height="24" rx="5" fill="' + (s1 === 0 ? '#1864AB' : '#C8372D') + '" stroke="#FFD43B" stroke-width="2.8"/>',
    s1 === 1
      ? '<circle cx="142" cy="46" r="7" fill="#FFD43B"/><circle cx="126" cy="46" r="3.5" fill="#FFFFFF"/><circle cx="158" cy="46" r="3.5" fill="#FFFFFF"/>'
      : '<rect x="124" y="41" width="36" height="10" rx="3" fill="#FFD43B"/>',
    // Slot 2: Balcony Flower Pot (232, 44)
    '<rect x="206" y="48" width="52" height="12" fill="#ADB5BD" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="222,48 242,48 238,60 226,60" fill="#D9480F" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="226" cy="40" r="6.5" fill="' + (s2 === 0 ? '#FFD43B' : '#FF6B6B') + '" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="238" cy="40" r="6.5" fill="' + (s2 === 0 ? '#FFD43B' : '#FF6B6B') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s2 === 1 ? '<circle cx="232" cy="31" r="6.5" fill="#FF6B6B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 3: Bauhinia Tree (306, 48)
    '<rect x="301" y="64" width="10" height="104" fill="#6F4E37" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="306" cy="48" r="24" fill="' + (s3 === 0 ? '#F59F00' : '#40C057') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '' : '<circle cx="296" cy="42" r="5" fill="#F783AC"/><circle cx="315" cy="46" r="5" fill="#F783AC"/><circle cx="304" cy="56" r="5" fill="#F783AC"/>',
    // Slot 4: Traffic Light (56, 154)
    '<line x1="56" y1="158" x2="56" y2="192" stroke="#2B2118" stroke-width="4"/>',
    '<rect x="45" y="126" width="22" height="38" rx="6" fill="#212529" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="56" cy="136" r="5.5" fill="' + (s4 === 0 ? '#FF6B6B' : '#495057') + '"/>',
    '<circle cx="56" cy="153" r="5.5" fill="' + (s4 === 0 ? '#495057' : '#51CF66') + '"/>',
    s4 === 1 ? '<polygon points="44,122 68,122 56,112" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 5: Double-Decker Ding-Ding Tram (150, 136)
    '<rect x="108" y="82" width="84" height="92" rx="8" fill="' + (s5 === 0 ? '#E03131' : '#1D6F58') + '" stroke="#2B2118" stroke-width="2.6"/>',
    '<rect x="114" y="90" width="72" height="22" rx="4" fill="#FFF9DB" stroke="#2B2118" stroke-width="1.8"/>',
    '<rect x="114" y="132" width="72" height="20" rx="4" fill="#FFF9DB" stroke="#2B2118" stroke-width="1.8"/>',
    '<rect x="134" y="116" width="32" height="12" rx="3" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>',
    s5 === 1 ? '<circle cx="150" cy="163" r="6" fill="#74C0FC" stroke="#2B2118" stroke-width="1.8"/>' : '<circle cx="150" cy="163" r="6" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="126" cy="176" r="8" fill="#212529"/><circle cx="174" cy="176" r="8" fill="#212529"/>',
    // Slot 6: Postbox (242, 158)
    '<rect x="230" y="138" width="24" height="38" rx="6" fill="' + (s6 === 0 ? '#C8372D' : '#2B8A3E') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="234" y="146" width="16" height="5" fill="#FFFFFF"/>',
    s6 === 1 ? '<circle cx="242" cy="162" r="5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Slot 7: HK Taxi (306, 166)
    '<path d="M278,176 L286,156 L324,156 L334,176 Z" fill="' + (s7 === 0 ? '#228BE6' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="274" y="172" width="64" height="14" rx="5" fill="' + (s7 === 0 ? '#228BE6' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="290" y="160" width="30" height="10" rx="2" fill="#E7F5FF" stroke="#2B2118" stroke-width="1.6"/>',
    s7 === 1 ? '' : '<rect x="298" y="149" width="14" height="7" rx="2" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>',
    '<circle cx="288" cy="186" r="7" fill="#212529"/><circle cx="322" cy="186" r="7" fill="#212529"/>'
  ].join('');
}

function renderHarbour(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="118" fill="' + ed.skyA + '"/>',
    '<polygon points="0,118 65,78 140,104 225,68 310,98 360,82 360,118" fill="#74B896" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="0" y="118" width="360" height="112" fill="' + ed.waterA + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="0" y="140" width="88" height="90" fill="#D8C3A5" stroke="#2B2118" stroke-width="2.2"/>',
    // Slot 0: Seagulls (58, 42)
    '<path d="M40,42 Q48,32 56,42 Q64,32 72,42" fill="none" stroke="#2B2118" stroke-width="2.6" stroke-linecap="round"/>',
    s0 === 0 ? '' : '<path d="M56,54 Q62,47 68,54 Q74,47 80,54" fill="none" stroke="#2B2118" stroke-width="2.4" stroke-linecap="round"/>',
    s0 === 1 ? '<circle cx="48" cy="26" r="7" fill="#FF6B6B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 1: Clock Tower (140, 50)
    '<rect x="128" y="42" width="24" height="76" fill="#C85A32" stroke="#2B2118" stroke-width="2.2"/>',
    '<polygon points="126,42 154,42 140,22" fill="#FFFDF9" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="140" cy="58" r="7" fill="' + (s1 === 0 ? '#74C0FC' : '#FFD43B') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s1 === 1 ? '<polygon points="140,22 140,10 154,15 140,20" fill="#E03131" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Slot 2: Skyscraper Spire (226, 48)
    '<rect x="208" y="40" width="36" height="78" fill="#A5D8FF" stroke="#2B2118" stroke-width="2.2"/>',
    '<line x1="208" y1="40" x2="244" y2="118" stroke="#1971C2" stroke-width="2"/><line x1="244" y1="40" x2="208" y2="118" stroke="#1971C2" stroke-width="2"/>',
    s2 === 0
      ? '<circle cx="226" cy="28" r="7" fill="#FFD43B" stroke="#2B2118" stroke-width="2"/>'
      : '<line x1="220" y1="20" x2="220" y2="40" stroke="#2B2118" stroke-width="2.5"/><line x1="232" y1="24" x2="232" y2="40" stroke="' + (s2 === 1 ? '#E03131' : '#2B2118') + '" stroke-width="2.5"/>',
    // Slot 3: Sun / Cloud (306, 42)
    s3 === 0
      ? '<path d="M298,28 A15,15 0 1,0 318,48 A11,11 0 1,1 298,28 Z" fill="#FFD43B" stroke="#2B2118" stroke-width="2.2"/>'
      : '<circle cx="306" cy="38" r="15" fill="#FFD43B" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '<ellipse cx="294" cy="50" rx="16" ry="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 4: Pier Lifebuoy (60, 156)
    '<circle cx="54" cy="164" r="16" fill="#FFFFFF" stroke="' + (s4 === 0 ? '#228BE6' : '#E03131') + '" stroke-width="6"/>',
    '<circle cx="54" cy="164" r="19" fill="none" stroke="#2B2118" stroke-width="2"/>',
    s4 === 1 ? '<circle cx="54" cy="164" r="5" fill="#FFD43B"/>' : '',
    // Slot 5: Star Ferry (148, 144)
    '<polygon points="106,154 190,154 180,170 116,170" fill="' + (s5 === 0 ? '#E03131' : '#1D6F58') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="116" y="136" width="64" height="18" rx="3" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="142" y="122" width="12" height="14" fill="#F59F00" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '' : '<polygon points="148,140 151,148 143,143 153,143 145,148" fill="#FFD43B"/>',
    // Slot 6: Red-Sail Junk Boat (240, 138)
    '<polygon points="214,158 268,158 258,172 224,172" fill="#8B4513" stroke="#2B2118" stroke-width="2.2"/>',
    '<polygon points="240,108 240,156 216,150" fill="' + (s6 === 0 ? '#F59F00' : '#D93B30') + '" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="244,114 244,156 268,152" fill="' + (s6 === 0 ? '#F59F00' : '#D93B30') + '" stroke="#2B2118" stroke-width="2"/>',
    s6 === 1 ? '<polygon points="240,108 254,103 240,98" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 7: Buoy & Fish (306, 168)
    s7 === 0
      ? '<ellipse cx="306" cy="166" rx="13" ry="7" fill="#FF922B" stroke="#2B2118" stroke-width="2"/><polygon points="318,166 327,159 327,173" fill="#FF922B" stroke="#2B2118" stroke-width="1.8"/>'
      : '<polygon points="296,174 316,174 306,150" fill="' + (s7 === 1 ? '#51CF66' : '#FFD43B') + '" stroke="#2B2118" stroke-width="2.2"/>'
  ].join('');
}

function renderStanleyPark(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="112" fill="' + ed.skyA + '"/>',
    // Slot 1: Snowy Mountain Peak (148, 44)
    '<polygon points="74,112 148,30 218,112" fill="#5C7CFA" stroke="#2B2118" stroke-width="2.2"/>',
    '<polygon points="126,55 148,30 170,55 158,60 148,50 138,60" fill="' + (s1 === 0 ? '#FFD8A8' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s1 === 1 ? '<circle cx="174" cy="38" r="9" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    '<rect x="0" y="112" width="360" height="58" fill="' + ed.waterA + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="0" y="166" width="360" height="64" fill="#74C69D" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="0" y="166" width="360" height="14" fill="#E9ECEF" stroke="#2B2118" stroke-width="2"/>',
    // Slot 0: Floatplane (58, 42)
    '<ellipse cx="58" cy="44" rx="18" ry="7" fill="' + (s0 === 0 ? '#FFD43B' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="44" y="34" width="28" height="5" rx="2" fill="' + (s0 === 0 ? '#228BE6' : '#E03131') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s0 === 1 ? '' : '<ellipse cx="58" cy="55" rx="14" ry="3.5" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 2: Lions Gate Bridge (236, 52)
    '<line x1="196" y1="84" x2="278" y2="84" stroke="#2B8A3E" stroke-width="4"/>',
    '<rect x="216" y="46" width="7" height="66" fill="#2B8A3E" stroke="#2B2118" stroke-width="1.8"/>',
    '<rect x="252" y="46" width="7" height="66" fill="#2B8A3E" stroke="#2B2118" stroke-width="1.8"/>',
    '<path d="M198,82 Q237,56 276,82" fill="none" stroke="#2B2118" stroke-width="2"/>',
    s2 === 0
      ? '<circle cx="219.5" cy="41" r="5" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/><circle cx="255.5" cy="41" r="5" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>'
      : s2 === 1
      ? '<polygon points="219,46 219,32 232,38" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>'
      : '',
    // Slot 3: Cedar Tree (306, 48)
    '<rect x="301" y="76" width="10" height="90" fill="#6F4E37" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="306,18 280,56 332,56" fill="' + (s3 === 0 ? '#E8590C' : '#1B4332') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<polygon points="306,40 276,82 336,82" fill="' + (s3 === 0 ? '#F76707' : '#2D6A4F') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '<circle cx="306" cy="28" r="6" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 4: Seawall Bench (60, 158)
    '<rect x="36" y="152" width="48" height="10" rx="2" fill="' + (s4 === 0 ? '#228BE6' : '#BC6C25') + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="36" y="162" width="48" height="6" fill="#8B4513" stroke="#2B2118" stroke-width="1.8"/>',
    '<line x1="42" y1="168" x2="42" y2="178" stroke="#2B2118" stroke-width="3"/><line x1="78" y1="168" x2="78" y2="178" stroke="#2B2118" stroke-width="3"/>',
    s4 === 1 ? '<rect x="55" y="140" width="10" height="13" rx="2" fill="#E03131" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 5: Sailboat (148, 136)
    '<polygon points="128,148 168,148 160,158 136,158" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="148,112 148,146 128,144" fill="' + (s5 === 0 ? '#FFD43B' : '#FF6B6B') + '" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '' : '<polygon points="151,118 151,146 167,144" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 6: Canada Goose & Goslings (234, 162)
    '<ellipse cx="224" cy="166" rx="13" ry="8" fill="#8D6E63" stroke="#2B2118" stroke-width="2"/>',
    '<path d="M214,162 L214,148" stroke="#212529" stroke-width="5" stroke-linecap="round"/>',
    '<circle cx="213" cy="147" r="4.5" fill="#212529"/><circle cx="212" cy="148" r="2" fill="#FFFFFF"/>',
    '<circle cx="244" cy="168" r="5.5" fill="' + (s6 === 0 ? '#FFFFFF' : '#FFD43B') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s6 === 1 ? '' : '<circle cx="257" cy="169" r="5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 7: Bicycle (306, 162)
    '<circle cx="292" cy="168" r="10" fill="none" stroke="#2B2118" stroke-width="2.6"/>',
    '<circle cx="320" cy="168" r="10" fill="none" stroke="#2B2118" stroke-width="2.6"/>',
    '<polyline points="292,168 304,154 320,168 312,152" fill="none" stroke="' + (s7 === 0 ? '#228BE6' : '#E03131') + '" stroke-width="3"/>',
    s7 === 1 ? '' : '<rect x="311" y="144" width="11" height="9" rx="2" fill="#F4A261" stroke="#2B2118" stroke-width="1.6"/><circle cx="316" cy="142" r="4" fill="#FF6B9D"/>'
  ].join('');
}

function renderGastown(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="168" fill="' + ed.skyA + '"/>',
    '<rect x="188" y="20" width="90" height="148" fill="#B54834" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="0" y="168" width="360" height="62" fill="#8D99AE" stroke="#2B2118" stroke-width="2.2"/>',
    // Slot 0: Streetlamp (56, 46)
    '<line x1="56" y1="54" x2="56" y2="168" stroke="#212529" stroke-width="4"/>',
    '<line x1="42" y1="54" x2="70" y2="54" stroke="#212529" stroke-width="3"/>',
    '<circle cx="42" cy="46" r="7" fill="' + (s0 === 0 ? '#74C0FC' : '#FFF3BF') + '" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="70" cy="46" r="7" fill="' + (s0 === 0 ? '#74C0FC' : '#FFF3BF') + '" stroke="#2B2118" stroke-width="2"/>',
    s0 === 1 ? '' : '<circle cx="56" cy="36" r="8" fill="#FFF3BF" stroke="#2B2118" stroke-width="2"/>',
    // Slot 1: Steam Puffs (144, 38)
    '<circle cx="144" cy="46" r="10" fill="' + (s1 === 0 ? '#FFD8A8' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s1 === 1
      ? ''
      : '<circle cx="134" cy="33" r="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/><circle cx="154" cy="30" r="9" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 2: Brick Arch Window (232, 48)
    '<rect x="214" y="30" width="36" height="44" rx="18" fill="' + (s2 === 0 ? '#FFD43B' : '#A5D8FF') + '" stroke="#FFFDF9" stroke-width="3"/>',
    '<line x1="232" y1="30" x2="232" y2="74" stroke="#2B2118" stroke-width="2"/><line x1="214" y1="52" x2="250" y2="52" stroke="#2B2118" stroke-width="2"/>',
    s2 === 1 ? '<circle cx="232" cy="64" r="6" fill="#FA9832" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 3: Autumn Maple Tree (306, 48)
    '<rect x="301" y="68" width="10" height="100" fill="#5C3A21" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="306" cy="48" r="25" fill="' + (s3 === 0 ? '#F59F00' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '<circle cx="294" cy="42" r="5" fill="#FFD43B"/><circle cx="316" cy="52" r="5" fill="#FFD43B"/>' : '',
    // Slot 4: Cafe Patio Umbrella (60, 154)
    '<line x1="60" y1="138" x2="60" y2="178" stroke="#2B2118" stroke-width="3"/>',
    '<path d="M32,144 Q60,114 88,144 Z" fill="' + (s4 === 0 ? '#20C997' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="42" y="166" width="36" height="6" rx="2" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    s4 === 1 ? '<circle cx="60" cy="161" r="4.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Slot 5: Steam Clock Tower & Dial (144, 134)
    '<rect x="122" y="62" width="44" height="108" rx="4" fill="#5C3A21" stroke="#2B2118" stroke-width="2.5"/>',
    '<rect x="128" y="68" width="32" height="36" fill="#D4AF37" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="144" cy="128" r="16" fill="' + (s5 === 0 ? '#D8F5A2' : '#FFF9DB') + '" stroke="#D4AF37" stroke-width="3"/>',
    s5 === 1
      ? '<line x1="144" y1="128" x2="154" y2="134" stroke="#2B2118" stroke-width="2.6"/><line x1="144" y1="128" x2="144" y2="117" stroke="#E03131" stroke-width="2.4"/>'
      : '<line x1="144" y1="128" x2="134" y2="128" stroke="#2B2118" stroke-width="2.6"/><line x1="144" y1="128" x2="144" y2="117" stroke="#2B2118" stroke-width="2.4"/>',
    // Slot 6: Flower Barrel (232, 160)
    '<polygon points="218,154 246,154 242,176 222,176" fill="#8B5A2B" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="224" cy="148" r="6.5" fill="' + (s6 === 0 ? '#FFD43B' : '#AE3EC9') + '" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="240" cy="148" r="6.5" fill="' + (s6 === 0 ? '#FFD43B' : '#AE3EC9') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s6 === 1 ? '' : '<circle cx="232" cy="142" r="7" fill="#FF6B9D" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 7: Vintage Car (304, 162)
    '<path d="M276,170 Q284,146 306,146 Q326,146 332,170 Z" fill="' + (s7 === 0 ? '#E03131' : '#339AF0') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="272" y="166" width="64" height="12" rx="5" fill="' + (s7 === 0 ? '#E03131' : '#339AF0') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s7 === 1 ? '<circle cx="274" cy="170" r="4.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : '',
    '<circle cx="286" cy="180" r="7.5" fill="#212529"/><circle cx="320" cy="180" r="7.5" fill="#212529"/>'
  ].join('');
}

function renderWetMarket(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="230" fill="' + ed.wallA + '"/>',
    '<rect x="18" y="156" width="256" height="62" rx="4" fill="#BC6C25" stroke="#2B2118" stroke-width="2.4"/>',
    // Slot 1: Striped Awning (146, 38)
    '<rect x="16" y="14" width="260" height="26" rx="4" fill="' + (s1 === 0 ? '#1D6F58' : '#C8372D') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="56" y="14" width="32" height="26" fill="#FFFFFF"/><rect x="128" y="14" width="32" height="26" fill="#FFFFFF"/><rect x="200" y="14" width="32" height="26" fill="#FFFFFF"/>',
    s1 === 1 ? '<circle cx="144" cy="27" r="7" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 0: Market Lampshade (58, 44)
    '<line x1="58" y1="40" x2="58" y2="52" stroke="#2B2118" stroke-width="2.5"/>',
    '<polygon points="38,64 78,64 58,48" fill="' + (s0 === 0 ? '#20C997' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s0 === 1 ? '' : '<circle cx="58" cy="67" r="5.5" fill="#FFF3BF" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 2: Price Sign (232, 46)
    '<rect x="208" y="44" width="48" height="30" rx="4" fill="' + (s2 === 0 ? '#FFF3BF' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<line x1="216" y1="55" x2="248" y2="55" stroke="#E03131" stroke-width="3.5" stroke-linecap="round"/>',
    s2 === 1 ? '<polygon points="232,60 236,70 227,64 237,64 228,70" fill="#E03131"/>' : '<line x1="220" y1="65" x2="244" y2="65" stroke="#2B2118" stroke-width="2.5"/>',
    // Slot 3: Hanging Bananas (306, 46)
    '<line x1="306" y1="14" x2="306" y2="34" stroke="#2B2118" stroke-width="2.5"/>',
    '<path d="M292,36 Q286,56 302,64" fill="none" stroke="' + (s3 === 0 ? '#74B816' : '#FFD43B') + '" stroke-width="7" stroke-linecap="round"/>',
    '<path d="M304,36 Q302,58 314,66" fill="none" stroke="' + (s3 === 0 ? '#74B816' : '#FFD43B') + '" stroke-width="7" stroke-linecap="round"/>',
    s3 === 1 ? '' : '<path d="M316,36 Q318,56 326,62" fill="none" stroke="' + (s3 === 0 ? '#74B816' : '#FFD43B') + '" stroke-width="7" stroke-linecap="round"/>',
    // Slot 4: Orange Pyramid (60, 152)
    '<circle cx="44" cy="150" r="9" fill="#FF922B" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="62" cy="150" r="9" fill="#FF922B" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="80" cy="150" r="9" fill="#FF922B" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="53" cy="136" r="9" fill="#FF922B" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="71" cy="136" r="9" fill="#FF922B" stroke="#2B2118" stroke-width="2"/>',
    s4 === 1 ? '' : '<circle cx="62" cy="122" r="9" fill="' + (s4 === 0 ? '#51CF66' : '#FF922B') + '" stroke="#2B2118" stroke-width="2"/>',
    // Slot 5: Dragonfruit Crate (146, 150)
    '<rect x="118" y="138" width="56" height="22" rx="3" fill="#DDA15E" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="134" cy="132" rx="10" ry="8" fill="' + (s5 === 0 ? '#FFD43B' : '#E64980') + '" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="158" cy="132" rx="10" ry="8" fill="' + (s5 === 0 ? '#FFD43B' : '#E64980') + '" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '<ellipse cx="146" cy="122" rx="9" ry="7" fill="#51CF66" stroke="#2B2118" stroke-width="2"/>' : '',
    // Slot 6: Brass Scale (232, 150)
    '<rect x="218" y="142" width="28" height="20" rx="4" fill="#D4AF37" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="232" cy="152" r="7" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    s6 === 0
      ? '<line x1="232" y1="152" x2="237" y2="149" stroke="#E03131" stroke-width="2.2"/>'
      : '<line x1="232" y1="152" x2="227" y2="149" stroke="#2B2118" stroke-width="2.2"/>',
    '<ellipse cx="232" cy="136" rx="18" ry="5" fill="#FFD43B" stroke="#2B2118" stroke-width="2"/>',
    s6 === 1 ? '<circle cx="232" cy="131" r="6" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 7: Flower Bucket (306, 158)
    '<polygon points="290,152 322,152 317,190 295,190" fill="' + (s7 === 0 ? '#339AF0' : '#ADB5BD') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="297" cy="142" r="7" fill="' + (s7 === 0 ? '#FFD43B' : '#FF6B9D') + '" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="315" cy="142" r="7" fill="' + (s7 === 0 ? '#FFD43B' : '#FF6B9D') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s7 === 1 ? '' : '<circle cx="306" cy="133" r="7.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>'
  ].join('');
}

function renderDragonBoat(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="106" fill="' + ed.skyA + '"/>',
    '<polygon points="0,106 82,66 176,98 272,64 360,96 360,106" fill="#52B788" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="0" y="106" width="360" height="124" fill="' + ed.waterA + '" stroke="#2B2118" stroke-width="2"/>',
    // Slot 0: Festival Balloon (56, 42)
    '<line x1="56" y1="54" x2="56" y2="76" stroke="#2B2118" stroke-width="1.8"/>',
    '<ellipse cx="56" cy="40" rx="13" ry="16" fill="' + (s0 === 0 ? '#339AF0' : '#FF6B6B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s0 === 1 ? '<circle cx="56" cy="40" r="5" fill="#FFD43B"/>' : '',
    // Slot 1: Shoreline Pavilion (144, 46)
    '<polygon points="116,54 172,54 144,32" fill="' + (s1 === 0 ? '#20C997' : '#F59F00') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<line x1="126" y1="54" x2="126" y2="82" stroke="#8B4513" stroke-width="3.5"/><line x1="162" y1="54" x2="162" y2="82" stroke="#8B4513" stroke-width="3.5"/>',
    s1 === 1 ? '<circle cx="144" cy="27" r="5" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 2: Bunting Flags (232, 42)
    '<line x1="196" y1="34" x2="268" y2="34" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="202,34 216,34 209,50" fill="' + (s2 === 0 ? '#AE3EC9' : '#E03131') + '" stroke="#2B2118" stroke-width="1.6"/>',
    '<polygon points="224,34 238,34 231,50" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>',
    s2 === 1 ? '' : '<polygon points="246,34 260,34 253,50" fill="#20C997" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 3: Summer Sun (306, 42)
    '<circle cx="306" cy="40" r="15" fill="' + (s3 === 0 ? '#FF922B' : '#FFD43B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '' : '<circle cx="306" cy="40" r="21" fill="none" stroke="#FFD43B" stroke-width="2.5" stroke-dasharray="5 5"/>',
    // Boat Hull
    '<path d="M56,154 L274,154 L256,172 L76,172 Z" fill="#D93B30" stroke="#2B2118" stroke-width="2.5"/>',
    '<line x1="80" y1="162" x2="254" y2="162" stroke="#FFD43B" stroke-width="3"/>',
    // Slot 4: Carved Dragon Head (66, 140)
    '<path d="M68,156 Q48,136 62,120 L82,130 L74,154 Z" fill="' + (s4 === 0 ? '#20C997' : '#FFD43B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="66" cy="130" r="3" fill="#E03131"/>',
    s4 === 1 ? '' : '<circle cx="52" cy="136" r="5.5" fill="#FFF3BF" stroke="#E03131" stroke-width="1.8"/>',
    // Slot 5: Drummer & Drum (148, 136)
    '<rect x="134" y="134" width="24" height="20" rx="4" fill="' + (s5 === 0 ? '#228BE6' : '#F59F00') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="146" cy="122" r="8" fill="#FFD8A8" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1
      ? '<line x1="154" y1="126" x2="168" y2="136" stroke="#2B2118" stroke-width="3" stroke-linecap="round"/>'
      : '<line x1="154" y1="124" x2="166" y2="110" stroke="#2B2118" stroke-width="3" stroke-linecap="round"/>',
    // Slot 6: Paddlers & Oars (236, 146)
    '<circle cx="216" cy="134" r="7.5" fill="#FFD8A8" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="246" cy="134" r="7.5" fill="#FFD8A8" stroke="#2B2118" stroke-width="2"/>',
    '<line x1="216" y1="142" x2="206" y2="178" stroke="' + (s6 === 0 ? '#FFFFFF' : '#FFD43B') + '" stroke-width="4.5" stroke-linecap="round"/>',
    s6 === 1 ? '' : '<line x1="246" y1="142" x2="236" y2="178" stroke="' + (s6 === 0 ? '#FFFFFF' : '#FFD43B') + '" stroke-width="4.5" stroke-linecap="round"/>',
    // Slot 7: Finish Buoy Flag (306, 164)
    '<ellipse cx="306" cy="176" rx="14" ry="6" fill="#FFD43B" stroke="#2B2118" stroke-width="2"/>',
    '<line x1="306" y1="144" x2="306" y2="174" stroke="#2B2118" stroke-width="2.5"/>',
    '<polygon points="306,144 330,152 306,160" fill="' + (s7 === 0 ? '#20C997' : '#E03131') + '" stroke="#2B2118" stroke-width="2"/>',
    s7 === 1 ? '<circle cx="306" cy="141" r="4" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : ''
  ].join('');
}

function renderLivingRoom(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="154" fill="' + ed.wallA + '"/>',
    '<rect x="0" y="154" width="360" height="76" fill="#DDA15E" stroke="#2B2118" stroke-width="2.2"/>',
    '<ellipse cx="180" cy="192" rx="134" ry="26" fill="#FFF3BF" stroke="#D97706" stroke-width="2.5"/>',
    // Slot 0: Framed Wall Art (58, 46)
    '<rect x="34" y="24" width="48" height="42" rx="4" fill="#A5D8FF" stroke="#8B4513" stroke-width="3.5"/>',
    s0 === 0
      ? '<circle cx="58" cy="40" r="8" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>'
      : '<polygon points="40,62 58,38 76,62" fill="' + (s0 === 1 ? '#FA5252' : '#40C057') + '" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 1: Window & Curtains (148, 48)
    '<rect x="116" y="20" width="64" height="58" rx="4" fill="#E7F5FF" stroke="#2B2118" stroke-width="2.4"/>',
    '<rect x="114" y="20" width="14" height="58" fill="' + (s1 === 0 ? '#20C997' : '#FF8787') + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="168" y="20" width="14" height="58" fill="' + (s1 === 0 ? '#20C997' : '#FF8787') + '" stroke="#2B2118" stroke-width="2"/>',
    s1 === 1 ? '<circle cx="148" cy="44" r="7" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 2: Bookshelf Trophy (236, 48)
    '<rect x="208" y="34" width="56" height="44" fill="#BC6C25" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="214" y="48" width="9" height="26" fill="#E03131" stroke="#2B2118" stroke-width="1.6"/>',
    '<rect x="225" y="52" width="9" height="22" fill="#228BE6" stroke="#2B2118" stroke-width="1.6"/>',
    s2 === 0
      ? '<circle cx="248" cy="58" r="9" fill="#40C057" stroke="#2B2118" stroke-width="2"/>'
      : s2 === 1
      ? ''
      : '<polygon points="240,46 256,46 252,62 244,62" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/><rect x="244" y="62" width="8" height="12" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 3: Standing Floor Lamp (306, 52)
    '<line x1="306" y1="64" x2="306" y2="154" stroke="#2B2118" stroke-width="3.5"/>',
    '<polygon points="290,64 322,64 315,38 297,38" fill="' + (s3 === 0 ? '#FF922B' : '#FFF3BF') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '' : '<circle cx="306" cy="70" r="5" fill="#FFD43B"/>',
    // Slot 4: Potted Plant (60, 154)
    '<polygon points="46,150 74,150 70,178 50,178" fill="' + (s4 === 0 ? '#228BE6' : '#D9480F') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<ellipse cx="52" cy="136" rx="9" ry="14" fill="#2B8A3E" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="68" cy="136" rx="9" ry="14" fill="#40C057" stroke="#2B2118" stroke-width="2"/>',
    s4 === 1 ? '<circle cx="60" cy="124" r="6" fill="#FF6B9D" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 5: Coffee Table Tea Tray (148, 156)
    '<rect x="116" y="160" width="64" height="10" rx="3" fill="#8B4513" stroke="#2B2118" stroke-width="2"/>',
    '<line x1="124" y1="170" x2="124" y2="186" stroke="#2B2118" stroke-width="3"/><line x1="172" y1="170" x2="172" y2="186" stroke="#2B2118" stroke-width="3"/>',
    '<ellipse cx="138" cy="152" rx="11" ry="8" fill="' + (s5 === 0 ? '#FFD43B' : '#38D9A9') + '" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '' : '<circle cx="160" cy="154" r="6" fill="#F4A261" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 6: Armchair & Calico Cat (238, 146)
    '<rect x="208" y="120" width="60" height="52" rx="12" fill="' + (s6 === 0 ? '#20C997' : '#E8590C') + '" stroke="#2B2118" stroke-width="2.4"/>',
    '<ellipse cx="238" cy="148" rx="16" ry="11" fill="#FFFDF7" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="227,140 225,131 233,136" fill="#33241F"/><polygon points="249,140 251,131 243,136" fill="#FA9832"/>',
    s6 === 1 ? '<circle cx="238" cy="156" r="4.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Slot 7: Cozy Yarn Ball (306, 168)
    '<circle cx="306" cy="172" r="12" fill="' + (s7 === 0 ? '#339AF0' : '#F06595') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s7 === 1 ? '' : '<path d="M318,176 Q330,180 334,172" fill="none" stroke="' + (s7 === 0 ? '#339AF0' : '#F06595') + '" stroke-width="3" stroke-linecap="round"/>'
  ].join('');
}

function renderFlowerMarket(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="162" fill="' + ed.skyA + '"/>',
    '<rect x="0" y="162" width="360" height="68" fill="#F3D9B1" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="102" y="54" width="10" height="108" fill="#C8372D" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="188" y="54" width="10" height="108" fill="#C8372D" stroke="#2B2118" stroke-width="2"/>',
    // Slot 0: Lantern String (58, 44)
    '<line x1="20" y1="24" x2="96" y2="34" stroke="#2B2118" stroke-width="2"/>',
    '<circle cx="44" cy="42" r="11" fill="' + (s0 === 0 ? '#FFD43B' : '#E03131') + '" stroke="#2B2118" stroke-width="2"/>',
    s0 === 1 ? '' : '<circle cx="72" cy="46" r="11" fill="' + (s0 === 0 ? '#FFD43B' : '#E03131') + '" stroke="#2B2118" stroke-width="2"/>',
    // Slot 1: Market Archway Plaque (150, 42)
    '<rect x="94" y="24" width="112" height="30" rx="6" fill="' + (s1 === 0 ? '#1D6F58' : '#C8372D') + '" stroke="#FFD43B" stroke-width="3"/>',
    '<circle cx="150" cy="39" r="9" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    s1 === 1 ? '<circle cx="150" cy="17" r="6" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 2: Lucky Pinwheel (240, 44)
    '<line x1="240" y1="44" x2="240" y2="86" stroke="#8B4513" stroke-width="3"/>',
    '<circle cx="240" cy="44" r="16" fill="' + (s2 === 0 ? '#FFD43B' : '#FF6B9D') + '" stroke="#2B2118" stroke-width="2"/>',
    '<line x1="226" y1="44" x2="254" y2="44" stroke="#2B2118" stroke-width="2"/><line x1="240" y1="30" x2="240" y2="58" stroke="#2B2118" stroke-width="2"/>',
    s2 === 1 ? '<circle cx="240" cy="44" r="6" fill="#20C997" stroke="#2B2118" stroke-width="1.6"/>' : '<circle cx="240" cy="44" r="4" fill="#FFFFFF"/>',
    // Slot 3: Festive Balloon (306, 46)
    '<line x1="306" y1="60" x2="306" y2="92" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="306" cy="44" r="15" fill="' + (s3 === 0 ? '#F06595' : '#FF922B') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s3 === 1 ? '' : '<ellipse cx="306" cy="27" rx="6" ry="3.5" fill="#51CF66" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 4: Kumquat Tree (62, 150)
    '<polygon points="44,158 80,158 75,186 49,186" fill="#C85A32" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="62" cy="136" r="22" fill="#2B8A3E" stroke="#2B2118" stroke-width="2.2"/>',
    '<circle cx="52" cy="132" r="4.5" fill="#FF922B"/><circle cx="72" cy="134" r="4.5" fill="#FF922B"/><circle cx="62" cy="122" r="4.5" fill="#FF922B"/>',
    s4 === 0 ? '' : '<rect x="57" y="138" width="10" height="14" rx="1.5" fill="' + (s4 === 1 ? '#FFD43B' : '#E03131') + '" stroke="#2B2118" stroke-width="1.5"/>',
    // Slot 5: Peach Blossom Vase (150, 146)
    '<ellipse cx="150" cy="166" rx="16" ry="18" fill="' + (s5 === 0 ? '#E03131' : '#339AF0') + '" stroke="#2B2118" stroke-width="2.2"/>',
    '<path d="M150,148 L138,118 M150,148 L164,120" stroke="#5C3A21" stroke-width="3" stroke-linecap="round"/>',
    '<circle cx="138" cy="118" r="6" fill="#FF85A1" stroke="#2B2118" stroke-width="1.6"/>',
    '<circle cx="164" cy="120" r="6" fill="#FF85A1" stroke="#2B2118" stroke-width="1.6"/>',
    s5 === 1 ? '' : '<circle cx="150" cy="126" r="6.5" fill="#FF85A1" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 6: Narcissus Bowl (236, 154)
    '<ellipse cx="236" cy="168" rx="22" ry="10" fill="#FFFFFF" stroke="#1971C2" stroke-width="2.4"/>',
    '<line x1="228" y1="164" x2="226" y2="142" stroke="#40C057" stroke-width="3.5"/><line x1="244" y1="164" x2="246" y2="142" stroke="#40C057" stroke-width="3.5"/>',
    '<circle cx="226" cy="140" r="6.5" fill="' + (s6 === 0 ? '#FF85A1' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="1.6"/>',
    '<circle cx="246" cy="140" r="6.5" fill="' + (s6 === 0 ? '#FF85A1' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="1.6"/>',
    s6 === 1 ? '<circle cx="236" cy="148" r="6.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 7: Candy Box (306, 160)
    '<ellipse cx="306" cy="166" rx="22" ry="14" fill="' + (s7 === 0 ? '#FFD43B' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s7 === 1
      ? '<circle cx="299" cy="164" r="4.5" fill="#51CF66"/><circle cx="313" cy="164" r="4.5" fill="#FFF3BF"/>'
      : '<circle cx="306" cy="160" r="5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>'
  ].join('');
}

function renderSkyTrain(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="126" fill="' + ed.skyA + '"/>',
    // Slot 1: Mountain Peak (148, 44)
    '<polygon points="90,126 148,32 208,126" fill="#5C7CFA" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="130,60 148,32 166,60" fill="' + (s1 === 0 ? '#FFD8A8' : '#FFFFFF') + '" stroke="#2B2118" stroke-width="1.6"/>',
    s1 === 1 ? '<circle cx="148" cy="22" r="5.5" fill="#E03131" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Guideway
    '<rect x="0" y="114" width="210" height="10" fill="#ADB5BD" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="44" y="124" width="10" height="24" fill="#868E96" stroke="#2B2118" stroke-width="1.8"/><rect x="134" y="124" width="10" height="24" fill="#868E96" stroke="#2B2118" stroke-width="1.8"/>',
    '<rect x="0" y="136" width="360" height="94" fill="' + ed.waterA + '" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="218" y="176" width="142" height="54" fill="#CED4DA" stroke="#2B2118" stroke-width="2.2"/>',
    // Slot 0: Clouds & Gull (58, 40)
    '<ellipse cx="52" cy="40" rx="20" ry="10" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    s0 === 0 ? '<circle cx="72" cy="34" r="8" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    s0 === 1 ? '' : '<path d="M68,50 Q74,42 80,50 Q86,42 92,50" fill="none" stroke="#2B2118" stroke-width="2.2" stroke-linecap="round"/>',
    // Slot 2: Port Crane (238, 46)
    '<line x1="230" y1="136" x2="238" y2="42" stroke="' + (s2 === 0 ? '#228BE6' : '#F76707') + '" stroke-width="5"/>',
    '<line x1="214" y1="48" x2="266" y2="38" stroke="' + (s2 === 0 ? '#228BE6' : '#F76707') + '" stroke-width="4.5"/>',
    s2 === 1 ? '<rect x="254" y="48" width="14" height="10" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>' : '',
    // Slot 3: Transit Station Sign (306, 46)
    '<line x1="306" y1="60" x2="306" y2="176" stroke="#2B2118" stroke-width="3"/>',
    '<rect x="286" y="30" width="40" height="30" rx="6" fill="' + (s3 === 0 ? '#20C997' : '#1971C2') + '" stroke="#FFFFFF" stroke-width="2.5"/>',
    s3 === 1 ? '<circle cx="306" cy="45" r="7" fill="#FFD43B"/>' : '<rect x="296" y="38" width="20" height="5" fill="#FFFFFF"/><rect x="303" y="38" width="6" height="16" fill="#FFFFFF"/>',
    // Slot 4: SkyTrain Car (68, 108)
    '<rect x="28" y="92" width="82" height="22" rx="6" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="30" y="104" width="78" height="6" fill="' + (s4 === 0 ? '#E03131' : '#1971C2') + '"/>',
    '<rect x="36" y="96" width="18" height="7" rx="1.5" fill="#74C0FC"/><rect x="59" y="96" width="18" height="7" rx="1.5" fill="#74C0FC"/>',
    s4 === 1 ? '<circle cx="104" cy="100" r="4" fill="#FFD43B" stroke="#2B2118" stroke-width="1.5"/>' : '',
    // Slot 5: SeaBus Catamaran (154, 156)
    '<polygon points="116,162 192,162 184,174 124,174" fill="#FFFFFF" stroke="#2B2118" stroke-width="2.2"/>',
    '<rect x="124" y="148" width="60" height="14" rx="3" fill="' + (s5 === 0 ? '#20C997' : '#F76707') + '" stroke="#2B2118" stroke-width="2"/>',
    s5 === 1 ? '' : '<rect x="148" y="140" width="12" height="8" fill="#FFFFFF" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 6: Waterfront Maple (240, 160)
    '<rect x="236" y="164" width="8" height="22" fill="#5C3A21" stroke="#2B2118" stroke-width="1.8"/>',
    '<circle cx="240" cy="152" r="16" fill="' + (s6 === 0 ? '#40C057' : '#E03131') + '" stroke="#2B2118" stroke-width="2.2"/>',
    s6 === 1 ? '<circle cx="240" cy="152" r="5" fill="#FFD43B"/>' : '',
    // Slot 7: Pier Gull on Bollard (306, 166)
    '<rect x="298" y="168" width="16" height="18" rx="2" fill="#8B5A2B" stroke="#2B2118" stroke-width="2"/>',
    '<ellipse cx="306" cy="160" rx="10" ry="7" fill="#FFFFFF" stroke="#2B2118" stroke-width="2"/>',
    s7 === 0
      ? '<polygon points="296,160 288,158 296,163" fill="#FF922B"/>'
      : '<polygon points="316,160 324,158 316,163" fill="#FF922B"/>',
    s7 === 1 ? '<rect x="300" y="149" width="12" height="5" rx="2" fill="#1971C2" stroke="#2B2118" stroke-width="1.5"/>' : ''
  ].join('');
}

function renderKoiGarden(ed, seed, d) {
  const s0 = dm(d, 0), s1 = dm(d, 1), s2 = dm(d, 2), s3 = dm(d, 3);
  const s4 = dm(d, 4), s5 = dm(d, 5), s6 = dm(d, 6), s7 = dm(d, 7);
  return [
    '<rect width="360" height="118" fill="' + ed.wallA + '"/>',
    '<rect x="0" y="118" width="360" height="112" fill="' + ed.waterA + '" stroke="#2B2118" stroke-width="2"/>',
    // Slot 0: Bamboo & Bird (58, 44)
    '<line x1="46" y1="12" x2="46" y2="118" stroke="#2B8A3E" stroke-width="6"/><line x1="64" y1="18" x2="64" y2="118" stroke="#40C057" stroke-width="5"/>',
    s0 === 0
      ? '<circle cx="64" cy="42" r="7" fill="#339AF0" stroke="#2B2118" stroke-width="1.8"/>'
      : s0 === 1
      ? ''
      : '<ellipse cx="52" cy="46" rx="8" ry="4" fill="#51CF66" stroke="#2B2118" stroke-width="1.5"/>',
    // Slot 1: Tea Pavilion Roof (148, 42)
    '<path d="M104,56 Q148,20 192,56 Z" fill="' + (s1 === 0 ? '#1D6F58' : '#C8372D') + '" stroke="#2B2118" stroke-width="2.4"/>',
    '<line x1="118" y1="56" x2="118" y2="108" stroke="#8B4513" stroke-width="4"/><line x1="178" y1="56" x2="178" y2="108" stroke="#8B4513" stroke-width="4"/>',
    s1 === 1 ? '<circle cx="148" cy="26" r="5.5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>' : '',
    // Slot 2: Blossom Branch (238, 44)
    '<path d="M214,24 Q238,48 262,38" fill="none" stroke="#5C3A21" stroke-width="3.5" stroke-linecap="round"/>',
    '<circle cx="228" cy="40" r="6" fill="' + (s2 === 0 ? '#FFD43B' : '#FF85A1') + '" stroke="#2B2118" stroke-width="1.6"/>',
    '<circle cx="248" cy="44" r="6" fill="' + (s2 === 0 ? '#FFD43B' : '#FF85A1') + '" stroke="#2B2118" stroke-width="1.6"/>',
    s2 === 1 ? '' : '<circle cx="238" cy="32" r="5.5" fill="#FF85A1" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 3: Stone Lantern (306, 48)
    '<rect x="298" y="58" width="16" height="48" fill="#ADB5BD" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="288,42 324,42 306,26" fill="#868E96" stroke="#2B2118" stroke-width="2"/>',
    '<rect x="295" y="42" width="22" height="16" fill="' + (s3 === 0 ? '#495057' : '#FFF3BF') + '" stroke="#2B2118" stroke-width="2"/>',
    s3 === 1 ? '<circle cx="306" cy="50" r="4.5" fill="#FF6B6B"/>' : '',
    // Slot 5: Moon Bridge (150, 124)
    '<path d="M98,136 Q150,92 202,136" fill="none" stroke="' + (s5 === 0 ? '#F59F00' : '#D93B30') + '" stroke-width="10" stroke-linecap="round"/>',
    '<path d="M98,126 Q150,82 202,126" fill="none" stroke="#2B2118" stroke-width="2.5"/>',
    s5 === 1 ? '' : '<circle cx="150" cy="102" r="5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.6"/>',
    // Slot 4: Lotus Pad & Bloom (64, 150)
    '<ellipse cx="64" cy="156" rx="24" ry="11" fill="#40C057" stroke="#2B2118" stroke-width="2"/>',
    s4 === 0
      ? '<circle cx="64" cy="146" r="8" fill="#51CF66" stroke="#2B2118" stroke-width="2"/><circle cx="61" cy="143" r="2" fill="#2B2118"/><circle cx="67" cy="143" r="2" fill="#2B2118"/>'
      : s4 === 1
      ? ''
      : '<ellipse cx="64" cy="146" rx="10" ry="7" fill="#FF85A1" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 6: Swimming Koi Fish (232, 164)
    '<ellipse cx="226" cy="162" rx="15" ry="7" fill="' + (s6 === 0 ? '#FFFFFF' : '#FF6B35') + '" stroke="#2B2118" stroke-width="2"/>',
    '<polygon points="240,162 250,155 250,169" fill="' + (s6 === 0 ? '#E03131' : '#FF6B35') + '" stroke="#2B2118" stroke-width="1.8"/>',
    s6 === 1 ? '' : '<ellipse cx="218" cy="176" rx="11" ry="5" fill="#FFD43B" stroke="#2B2118" stroke-width="1.8"/>',
    // Slot 7: Garden Rock & Dragonfly (306, 160)
    '<ellipse cx="306" cy="170" rx="20" ry="12" fill="#868E96" stroke="#2B2118" stroke-width="2.2"/>',
    s7 === 1
      ? ''
      : '<line x1="298" y1="150" x2="314" y2="150" stroke="' + (s7 === 0 ? '#FF6B6B' : '#339AF0') + '" stroke-width="3" stroke-linecap="round"/><ellipse cx="306" cy="145" rx="8" ry="3" fill="#E7F5FF" stroke="#2B2118" stroke-width="1.4"/>'
  ].join('');
}

const WORLD_RENDERERS = {
  yumcha: renderYumCha,
  bing_sutt: renderBingSutt,
  hk_tram: renderHkTram,
  harbour: renderHarbour,
  stanley_park: renderStanleyPark,
  gastown: renderGastown,
  wet_market: renderWetMarket,
  dragon_boat: renderDragonBoat,
  living_room: renderLivingRoom,
  flower_market: renderFlowerMarket,
  skytrain: renderSkyTrain,
  koi_garden: renderKoiGarden
};

export function renderSpotSceneSvg(puzzle, isModified, activeDiffCount, uniqueIdSuffix) {
  const ed = EDITIONS[(puzzle.edition || 0) % EDITIONS.length];
  const diffMap = {};
  if (isModified && Array.isArray(puzzle.diffs)) {
    const cap = typeof activeDiffCount === 'number' ? activeDiffCount : puzzle.diffs.length;
    for (let i = 0; i < cap && i < puzzle.diffs.length; i++) {
      const item = puzzle.diffs[i];
      diffMap[item.slot] = item.mode;
    }
  }
  const fn = WORLD_RENDERERS[puzzle.worldId] || renderYumCha;
  const uid = String(uniqueIdSuffix || puzzle.id || 'sd') + (isModified ? '_b' : '_a');
  const inner = fn(ed, puzzle.bgSeed || 0, diffMap, uid);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" class="spot-scene-svg" aria-hidden="true">' +
    inner +
    '<rect x="1.5" y="1.5" width="357" height="227" rx="12" fill="none" stroke="#2B2118" stroke-width="3"/>' +
    '</svg>'
  );
}

/* =========================================================================
   DETERMINISTIC GENERATOR FOR 300 CURATED NON-REPEATING PUZZLES (SD_001..SD_300)
   12 Worlds × 25 Distinct Scene + 5-Hotspot Configurations = 300 Unique Puzzles!
   ========================================================================= */

// 25 maximally diverse 5-of-8 hotspot subsets (every subset has 5 distinct indices in 0..7)
const FIVE_SLOT_COMBOS = [
  [0, 1, 4, 5, 7],
  [0, 2, 3, 5, 6],
  [1, 2, 4, 6, 7],
  [0, 3, 4, 6, 7],
  [1, 3, 4, 5, 6],
  [0, 1, 2, 5, 7],
  [0, 2, 4, 5, 6],
  [1, 2, 3, 4, 7],
  [0, 1, 3, 6, 7],
  [2, 3, 4, 5, 7],
  [0, 1, 4, 6, 7],
  [0, 2, 3, 4, 6],
  [1, 3, 5, 6, 7],
  [0, 1, 2, 4, 5],
  [0, 3, 4, 5, 7],
  [1, 2, 3, 6, 7],
  [0, 2, 5, 6, 7],
  [0, 1, 3, 4, 7],
  [1, 2, 4, 5, 6],
  [0, 2, 3, 6, 7],
  [0, 4, 5, 6, 7],
  [1, 2, 3, 5, 7],
  [0, 1, 2, 6, 7],
  [0, 1, 3, 5, 6],
  [2, 4, 5, 6, 7]
];

function buildAllSpotPuzzles() {
  const list = [];
  const usedK3 = new Set();
  const usedK4 = new Set();
  const usedK5 = new Set();

  // Interleave worlds across rounds so players experience all 12 worlds before seeing the next edition!
  for (let variantIdx = 0; variantIdx < 25; variantIdx++) {
    for (let wIdx = 0; wIdx < SPOT_WORLDS.length; wIdx++) {
      const world = SPOT_WORLDS[wIdx];
      const num = list.length + 1;
      const id = 'SD_' + String(num).padStart(3, '0');
      const edition = (variantIdx + wIdx) % EDITIONS.length;

      let chosenDiffs = null;
      for (let attempt = 0; attempt < 200; attempt++) {
        const combo = FIVE_SLOT_COMBOS[(variantIdx + wIdx * 2 + attempt) % FIVE_SLOT_COMBOS.length];
        const shift = (variantIdx + wIdx + attempt) % 5;
        const rotated = combo.slice(shift).concat(combo.slice(0, shift));
        const cand = [];
        for (let k = 0; k < rotated.length; k++) {
          const slot = rotated[k];
          const mode = (variantIdx + wIdx + k + slot + Math.floor(attempt / 5)) % 2;
          cand.push({ slot: slot, mode: mode });
        }
        const prefix = world.id + '|' + edition + '|';
        const sig3 = prefix + cand.slice(0, 3).map(function (d) { return d.slot + ':' + d.mode; }).sort().join(',');
        const sig4 = prefix + cand.slice(0, 4).map(function (d) { return d.slot + ':' + d.mode; }).sort().join(',');
        const sig5 = prefix + cand.map(function (d) { return d.slot + ':' + d.mode; }).sort().join(',');
        if (!usedK3.has(sig3) && !usedK4.has(sig4) && !usedK5.has(sig5)) {
          usedK3.add(sig3);
          usedK4.add(sig4);
          usedK5.add(sig5);
          chosenDiffs = cand;
          break;
        }
      }

      list.push({
        id: id,
        worldId: world.id,
        region: world.region,
        edition: edition,
        editionLabel: { zh: EDITIONS[edition].zh, en: EDITIONS[edition].en },
        bgSeed: variantIdx * 3 + wIdx,
        diffs: chosenDiffs
      });
    }
  }
  return list;
}

export const SPOT_DIFF_PUZZLES = buildAllSpotPuzzles();
