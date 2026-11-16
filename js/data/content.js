export const GAME_CATEGORIES = [
  { id: 'all', icon: '🌟', zh: '全部 (26)', en: 'All (26)' },
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
  },
  {
    id: 'headcount',
    cat: 'memory',
    theme: 'jade',
    icon: '🚋',
    title: { zh: '叮叮天車數乘客', en: 'Tram & SkyTrain Head Count' },
    shortName: { zh: '數乘客', en: 'Head Count' },
    desc: {
      zh: '經典腦鍛鍊人氣王！記實車廂原本人數，跟住幾波乘客上車落車，計下最後車入面有幾多人！',
      en: 'Brain Age fan-favorite! Watch passengers board and exit the HK Tram or SkyTrain and track how many remain!'
    },
    pillar: { zh: '動態記憶 · 即時加減', en: 'Working Memory · Tracking' }
  },
  {
    id: 'balance',
    cat: 'logic',
    theme: 'gold',
    icon: '⚖️',
    title: { zh: '茶莊天秤邊個重', en: 'Tea-Scale Heavyweight' },
    shortName: { zh: '天秤重', en: 'Tea Scale' },
    desc: {
      zh: '靈活腦學校經典題！觀察兩至三個銅天秤嘅傾斜與平衡關係，推理出邊樣寶物全場最重！',
      en: 'Big Brain Academy classic! Compare brass balance scales and deduce which tea-house treasure weighs the most!'
    },
    pillar: { zh: '輕重推理 · 比較邏輯', en: 'Quantitative Deduction' }
  },
  {
    id: 'steamer',
    cat: 'memory',
    theme: 'red',
    icon: '🥟',
    title: { zh: '蒸籠蓋印記位', en: 'Low-to-High Steamer Recall' },
    shortName: { zh: '記蒸籠', en: 'Steamers' },
    desc: {
      zh: '記實各籠點心嘅數字位置，蓋上竹籠後由細至大順序一籠籠揭開！',
      en: 'Memorize numbered bamboo steamers before the lids close, then tap them back in ascending order!'
    },
    pillar: { zh: '空間瞬間記憶', en: 'Spatial Working Memory' }
  },
  {
    id: 'quicksign',
    cat: 'math',
    theme: 'gold',
    icon: '➕',
    title: { zh: '算盤快選符號', en: 'Quick Sign & Bigger Plate' },
    shortName: { zh: '填符號', en: 'Quick Sign' },
    desc: {
      zh: '幫茶樓算式揀啱 ＋ − × ÷ 運算符號，再比拼兩碟點心邊邊數值更大，爽快醒腦！',
      en: 'Pick the missing + − × ÷ operator and compare two dim-sum plates to spot the bigger total!'
    },
    pillar: { zh: '運算直覺 · 數感比較', en: 'Number Sense · Operators' }
  },
  {
    id: 'clocktower',
    cat: 'math',
    theme: 'blue',
    icon: '🕰️',
    title: { zh: '鐘樓鏡影認時間', en: 'Clock Tower & Mirror Time' },
    shortName: { zh: '認鐘樓', en: 'Clock Time' },
    desc: {
      zh: '尖沙咀鐘樓與煤氣鎮蒸汽鐘！挑戰無字鐘面、水中鏡影倒影鐘及船車到達時間速算！',
      en: 'TST Clock Tower & Gastown Steam Clock! Read numberless dials, mirror-reflected clocks & arrival times!'
    },
    pillar: { zh: '空間時計 · 時間心算', en: 'Mirror Clock · Elapsed Time' }
  },
  {
    id: 'trail',
    cat: 'focus',
    theme: 'plum',
    icon: '🧭',
    title: { zh: '港溫梅花間竹連線', en: 'Alternating Stepping Stones' },
    shortName: { zh: '梅花連線', en: 'Trail Link' },
    desc: {
      zh: '按「1 → 甲 → 2 → 乙…」（英文 1 → A → 2 → B…）梅花間竹順序輕撳石春路連線，訓練雙線轉數！',
      en: 'Tap garden stepping stones alternating 1 → A → 2 → B → 3 → C in order to boost mental switching!'
    },
    pillar: { zh: '雙軌切換 · 執行專注', en: 'Task Switching · Focus' }
  },
  {
    id: 'tangram',
    cat: 'logic',
    theme: 'jade',
    icon: '🧩',
    title: { zh: '七巧板拼影坊', en: 'Rotated Silhouette Fit' },
    shortName: { zh: '拼影坊', en: 'Shape Fit' },
    desc: {
      zh: '喺腦海入面旋轉茶木拼塊（不可翻轉），搵出唯一可以完美嵌入剪影凹槽嘅一塊！',
      en: 'Mentally rotate wooden geometric tiles (no flipping!) to spot the exact piece that fits the cutout!'
    },
    pillar: { zh: '心理旋轉 · 空間幾何', en: 'Mental Rotation' }
  },
  {
    id: 'spotlight',
    cat: 'focus',
    theme: 'gold',
    icon: '🔦',
    title: { zh: '夜探霓虹剪影', en: "Mochi's Flashlight Peek" },
    shortName: { zh: '電筒尋寶', en: 'Spotlight' },
    desc: {
      zh: '阿喵拎住電筒照亮黑夜舞台一角（亦可手指輕撳移動光圈），憑局部線索估出隱藏物品！',
      en: 'Follow or aim Mochi’s moving flashlight beam across a dark stage to identify the hidden object!'
    },
    pillar: { zh: '局部觀察 · 視覺聯想', en: 'Visual Closure · Focus' }
  },
  {
    id: 'radicals',
    cat: 'verbal',
    theme: 'plum',
    icon: '🖌️',
    title: { zh: '拆字拼詞館', en: 'Radical & Word Forge' },
    shortName: { zh: '拆字館', en: 'Word Forge' },
    desc: {
      zh: '中文模式玩部首合字（如「氵＋青＝清」），英文模式玩生活詞語拼字，附語音朗讀！',
      en: 'Forge Chinese characters from radicals in Cantonese mode, or unscramble cozy 5–6 letter words in English!'
    },
    pillar: { zh: '字形結構 · 拼字思維', en: 'Character & Word Structure' }
  },
  {
    id: 'cupshuffle',
    cat: 'focus',
    theme: 'red',
    icon: '🧺',
    title: { zh: '蒸籠轉盤猜猜看', en: "Mochi's Steamer Shuffle" },
    shortName: { zh: '洗蒸籠', en: 'Cup Shuffle' },
    desc: {
      zh: '阿喵親手將流沙奶皇包收進竹籠再左右交換洗牌，睇實目標跟到尾搵返佢出嚟！',
      en: 'Mochi hides a Golden Custard Bun under a bamboo steamer and swaps them — track it with your eyes!'
    },
    pillar: { zh: '動態追蹤 · 目光鎖定', en: 'Dynamic Visual Tracking' }
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
