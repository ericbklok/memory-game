export const GAME_CATEGORIES = [
  { id: 'all', icon: '🌟', zh: '全部 (16)', en: 'All (16)' },
  { id: 'memory', icon: '🧠', zh: '記憶力', en: 'Memory' },
  { id: 'logic', icon: '🧩', zh: '邏輯推理', en: 'Logic' },
  { id: 'math', icon: '🧮', zh: '靈活心算', en: 'Math' },
  { id: 'verbal', icon: '📖', zh: '語言博學', en: 'Language' },
  { id: 'focus', icon: '👀', zh: '眼力專注', en: 'Focus' }
];

export const GAME_CATALOG = [
  {
    id: 'news',
    cat: 'memory',
    theme: 'red',
    icon: '📰',
    title: { zh: '時事醒目仔', en: 'Daily News Recall' },
    shortName: { zh: '時事', en: 'News' },
    desc: {
      zh: '讀兩則香港、溫哥華及國際新鮮事（支援廣東話朗讀），考考即時記性！',
      en: 'Read or listen to HK, Vancouver & World news briefs, then test your recall!'
    },
    pillar: { zh: '閱讀理解 · 短期記憶', en: 'Comprehension · Recall' }
  },
  {
    id: 'memory',
    cat: 'memory',
    theme: 'jade',
    icon: '🀄',
    title: { zh: '麻雀與買餸記憶', en: 'Mahjong & Market Memory' },
    shortName: { zh: '記憶', en: 'Memory' },
    desc: {
      zh: '麻雀／屋企相片翻牌配對，加埋街市買餸延遲記憶挑戰！',
      en: 'Mahjong & family photo pairs plus Wet Market shopping list recall!'
    },
    pillar: { zh: '視覺空間 · 工作記憶', en: 'Visual · Working Memory' }
  },
  {
    id: 'math',
    cat: 'math',
    theme: 'gold',
    icon: '🧮',
    title: { zh: '飲茶埋單心算', en: 'Yum Cha & Market Math' },
    shortName: { zh: '心算', en: 'Math' },
    desc: {
      zh: '酒樓點心計數、街市篤銀紙找續、港溫時差速算！',
      en: 'Tea-house bill tallying, tapping exact change, and target sums!'
    },
    pillar: { zh: '實用生活心算', en: 'Everyday Mental Math' }
  },
  {
    id: 'history',
    cat: 'verbal',
    theme: 'blue',
    icon: '🏛️',
    title: { zh: '當年今日博學堂', en: 'History & Back in the Day' },
    shortName: { zh: '博學', en: 'History' },
    desc: {
      zh: '老香港、溫哥華情懷、中華與世界歷史常識及先後次序排排坐！',
      en: 'HK, Vancouver, Chinese & World history trivia and timeline ordering!'
    },
    pillar: { zh: '長期記憶 · 懷舊常識', en: 'Reminiscence · Trivia' }
  },
  {
    id: 'words',
    cat: 'verbal',
    theme: 'plum',
    icon: '🗣️',
    title: { zh: '成語俗語與分類', en: 'Idioms & Category Sort' },
    shortName: { zh: '語言', en: 'Words' },
    desc: {
      zh: '經典四字成語、廣東話精警俗語，再玩詞語分類配對！',
      en: 'Classic idioms, Cantonese sayings & proverbs, plus category grouping!'
    },
    pillar: { zh: '語言流暢 · 邏輯歸類', en: 'Language · Executive Logic' }
  },
  {
    id: 'eagle',
    cat: 'focus',
    theme: 'gold',
    icon: '👀',
    title: { zh: '眼明手快尋寶', en: 'Eagle Eye Tile Hunt' },
    shortName: { zh: '眼力', en: 'Focus' },
    desc: {
      zh: '2D 彩色插畫尋寶！喺得意汽車、萌寵動物、港溫交通與茶座圖畫入面搵出唯一唔同嗰格！',
      en: 'Colorful 2D picture hunt! Spot the odd car, cute animal, HK/YVR transit vehicle, or tea-house scene!'
    },
    pillar: { zh: '視覺專注 · 觀察力', en: 'Visual Attention · Focus' }
  },
  {
    id: 'sudoku',
    cat: 'logic',
    theme: 'blue',
    icon: '🔢',
    title: { zh: '醒神茶樓數獨', en: 'Tea-House Sudoku' },
    shortName: { zh: '數獨', en: 'Sudoku' },
    desc: {
      zh: '支援 4×4、6×6 及經典 9×9 棋盤，可切換數字或點心圖案，附草稿同智能提示！',
      en: '4×4, 6×6 & 9×9 grids with optional Dim Sum icons, pencil notes & smart step hints!'
    },
    pillar: { zh: '邏輯推理 · 專注力', en: 'Deductive Logic' }
  },
  {
    id: 'tenpai',
    cat: 'logic',
    theme: 'jade',
    icon: '🀄',
    title: { zh: '叫糊大師（聽邊張牌）', en: 'Mahjong Winning Tile' },
    shortName: { zh: '叫糊', en: 'Tenpai' },
    desc: {
      zh: '望實副整齊廣東牌，計下摸邊一張牌即刻食糊！附食糊牌型解說！',
      en: 'Study a sorted Cantonese Mahjong hand and pick the exact tile that completes the win!'
    },
    pillar: { zh: '圖案組合 · 麻雀智慧', en: 'Pattern Grouping' }
  },
  {
    id: 'shisen',
    cat: 'logic',
    theme: 'red',
    icon: '🀅',
    title: { zh: '麻雀連連看消消樂', en: 'Mahjong Pair Clear' },
    shortName: { zh: '連連看', en: 'Tile Link' },
    desc: {
      zh: '搵出兩隻相同而連線轉彎唔超過兩次嘅麻雀／點心牌配對消除，越玩越順手！',
      en: 'Connect matching Mahjong & Dim Sum tiles within two turns to clear the board!'
    },
    pillar: { zh: '空間規劃 · 視覺搜尋', en: 'Spatial Planning' }
  },
  {
    id: 'make24',
    cat: 'math',
    theme: 'red',
    icon: '🃏',
    title: { zh: '合廿四撲克心算', en: 'Make 24 Card Math' },
    shortName: { zh: '合廿四', en: 'Make 24' },
    desc: {
      zh: '經典港式紙牌心算！預設輕鬆加法合 24，附一步提示與復原，按步就班挑戰加減乘除！',
      en: 'Friendly card math to 24! Starts with gentle addition deals (plus Undo & Step Hints), scaling up at your pace!'
    },
    pillar: { zh: '靈活運算 · 策略思考', en: 'Flexible Arithmetic' }
  },
  {
    id: 'wordsearch',
    cat: 'focus',
    theme: 'jade',
    icon: '🔤',
    title: { zh: '港溫尋字陣', en: 'HK × YVR Word Search' },
    shortName: { zh: '尋字陣', en: 'Word Grid' },
    desc: {
      zh: '撳頭尾兩格（無須拖拉）搵出隱藏嘅港溫地標、名茶點心與吉祥成語！',
      en: 'Tap start & end letters (no dragging needed) to uncover hidden HK, YVR & tea words!'
    },
    pillar: { zh: '字詞搜尋 · 視覺追蹤', en: 'Word Tracking' }
  },
  {
    id: 'blocks',
    cat: 'logic',
    theme: 'gold',
    icon: '🧱',
    title: { zh: '茶木方塊消消樂', en: 'Tea-Wood Block Fit' },
    shortName: { zh: '方塊', en: 'Block Fit' },
    desc: {
      zh: '輕撳擺放木塊填滿橫行或直行即可消除得分，無時間限制最療癒！',
      en: 'Tap to place wooden blocks on a 6×6 board and clear full rows or columns!'
    },
    pillar: { zh: '空間幾何 · 前瞻規劃', en: 'Visuospatial Fit' }
  },
  {
    id: 'stroop',
    cat: 'focus',
    theme: 'plum',
    icon: '🎨',
    title: { zh: '心清眼亮辨色字', en: 'Color vs. Word Switch' },
    shortName: { zh: '辨色字', en: 'Color Mind' },
    desc: {
      zh: '睇清題目要求揀「字嘅顏色」定「字嘅意思」，訓練大腦反應同定力！',
      en: 'Switch sharply between tapping the ink color vs. the written word meaning!'
    },
    pillar: { zh: '專注抑制 · 腦筋轉數', en: 'Mental Agility' }
  },
  {
    id: 'melody',
    cat: 'memory',
    theme: 'blue',
    icon: '🎵',
    title: { zh: '茗茶聽音記次序', en: 'Porcelain Tea Chimes' },
    shortName: { zh: '聽音記', en: 'Chimes' },
    desc: {
      zh: '聽住五聲音階茶杯發光奏樂，跟住次序撳返相應茶杯（支援重聽）！',
      en: 'Watch and listen to pentatonic porcelain teacups chime, then tap them back in order!'
    },
    pillar: { zh: '聽覺記憶 · 次序專注', en: 'Auditory Sequence' }
  },
  {
    id: 'vocab',
    cat: 'verbal',
    theme: 'jade',
    icon: '📖',
    title: { zh: '雅言詞匯館（中英雙語）', en: 'Vocabulary Builder' },
    shortName: { zh: '詞匯', en: 'Vocab' },
    desc: {
      zh: '精選中文雅詞、近義詞配對及溫哥華／日常實用英文生字（附發音朗讀與例句）！',
      en: 'Context clues, synonym match & practical Cantonese-English vocabulary with audio!'
    },
    pillar: { zh: '詞匯擴充 · 語言表達', en: 'Vocabulary · Expression' }
  },
  {
    id: 'spotdiff',
    cat: 'focus',
    theme: 'red',
    icon: '🔍',
    title: { zh: '茶餐廳港溫搵錯處', en: 'HK × YVR Spot the Difference' },
    shortName: { zh: '搵錯處', en: 'Spot Diff' },
    desc: {
      zh: '300 幅精繪港溫茶座、叮叮、天星與公園插畫，輕撳兩幅圖搵出 3 至 5 處唔同！',
      en: '300 cozy HK & Vancouver illustrated scenes — tap either picture to spot 3 to 5 differences!'
    },
    pillar: { zh: '細節觀察 · 視覺比對', en: 'Visual Comparison · Focus' }
  }
];

export {
  MAHJONG_AND_DIMSUM_TILES,
  WET_MARKET_ITEMS,
  MARKET_CHATS,
  YUM_CHA_MENU,
  EXACT_CHANGE_SCENARIOS,
  TARGET_PAIR_PUZZLES,
  COLLECTIBLE_ALBUM
} from './bank-market-math.js';

export { HISTORY_QUESTIONS, TIMELINE_SETS } from './bank-history.js';

export {
  IDIOM_QUESTIONS,
  CATEGORY_BOARDS,
  ZH_WORD_BANK,
  EN_WORD_BANK
} from './bank-words-eagle.js';

export {
  EAGLE_PAIRS,
  EAGLE_BUCKETS,
  EAGLE_THEME_META,
  renderEagleTileHtml
} from './eagle-art.js';
