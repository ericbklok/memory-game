export const GAME_CATALOG = [
  {
    id: 'news',
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
    icon: '👀',
    title: { zh: '眼明手快尋寶', en: 'Eagle Eye Tile Hunt' },
    shortName: { zh: '眼力', en: 'Focus' },
    desc: {
      zh: '喺整齊牌陣入面一眼搵出唯一唔同嘅字或者麻雀牌，唔趕時間！',
      en: 'Spot the single subtly different character or tile in a calm, crisp grid!'
    },
    pillar: { zh: '視覺專注 · 觀察力', en: 'Visual Attention · Focus' }
  }
];

export const MAHJONG_AND_DIMSUM_TILES = [
  { id: 'zhong', symbol: '中', color: '#C8372D', label: { zh: '紅中', en: 'Red Dragon' } },
  { id: 'fa', symbol: '發', color: '#1B6E56', label: { zh: '發財', en: 'Green Dragon' } },
  { id: 'bai', symbol: '框', display: '⬜', color: '#1F578A', label: { zh: '白板', en: 'White Dragon' } },
  { id: 'dong', symbol: '東', color: '#1C232B', label: { zh: '東風', en: 'East Wind' } },
  { id: 'nan', symbol: '南', color: '#1C232B', label: { zh: '南風', en: 'South Wind' } },
  { id: 'ba-wan', symbol: '八萬', color: '#C8372D', label: { zh: '八萬', en: '8 Characters' } },
  { id: 'yi-tong', symbol: '🥟', color: '#C8811A', label: { zh: '蝦餃', en: 'Har Gow' } },
  { id: 'siu-mai', symbol: '🧆', color: '#C8811A', label: { zh: '燒賣', en: 'Siu Mai' } },
  { id: 'egg-tart', symbol: '🥧', color: '#C8811A', label: { zh: '蛋撻', en: 'Egg Tart' } },
  { id: 'tea-pot', symbol: '🫖', color: '#1B6E56', label: { zh: '靚普洱', en: 'Pu-erh Tea' } },
  { id: 'maple', symbol: '🍁', color: '#C8372D', label: { zh: '楓葉', en: 'Maple Leaf' } },
  { id: 'ferry', symbol: '⛴️', color: '#1F578A', label: { zh: '天星小輪', en: 'Star Ferry' } }
];

export const WET_MARKET_ITEMS = [
  { id: 'choysum', emoji: '🥬', zh: '新鮮菜心', en: 'Choy Sum' },
  { id: 'eggs', emoji: '🥚', zh: '走地雞蛋', en: 'Free-Range Eggs' },
  { id: 'fish', emoji: '🐟', zh: '游水石斑', en: 'Fresh Grouper' },
  { id: 'ginger', emoji: '🫚', zh: '老薑一嚿', en: 'Fresh Ginger' },
  { id: 'apple', emoji: '🍎', zh: '富士蘋果', en: 'Fuji Apples' },
  { id: 'orange', emoji: '🍊', zh: '香甜新奇士橙', en: 'Sweet Oranges' },
  { id: 'shrimp', emoji: '🦐', zh: '生猛海蝦', en: 'Live Prawns' },
  { id: 'mushroom', emoji: '🍄', zh: '花菇冬菇', en: 'Shiitake Mushrooms' },
  { id: 'tofu', emoji: '🧊', zh: '滑溜板豆腐', en: 'Silken Tofu' },
  { id: 'corn', emoji: '🌽', zh: '清甜粟米', en: 'Sweet Corn' },
  { id: 'tomato', emoji: '🍅', zh: '紅熟番茄', en: 'Ripe Tomatoes' },
  { id: 'bread', emoji: '🥐', zh: '出爐菠蘿包', en: 'Pineapple Bun' }
];

export const YUM_CHA_MENU = [
  { emoji: '🥟', zh: '筍尖蝦餃皇', en: 'Har Gow (Shrimp Dumplings)', price: 28 },
  { emoji: '🧆', zh: '蟹籽燒賣皇', en: 'Pork & Shrimp Siu Mai', price: 26 },
  { emoji: '🥯', zh: '蜜汁叉燒包', en: 'BBQ Pork Cha Siu Bao', price: 22 },
  { emoji: '🥧', zh: '酥皮靚蛋撻', en: 'Flaky Egg Tarts', price: 20 },
  { emoji: '🍤', zh: '鮮蝦滑腸粉', en: 'Shrimp Rice Roll', price: 30 },
  { emoji: '🍮', zh: '香滑馬蹄糕', en: 'Water Chestnut Cake', price: 18 },
  { emoji: '🥬', zh: '白灼靚油菜', en: 'Poached Greens', price: 24 },
  { emoji: '🫖', zh: '每位茗茶', en: 'Tea Charge', price: 10 }
];

export const HISTORY_QUESTIONS = [
  {
    region: 'hk',
    q: {
      zh: '連接港島同九龍嘅第一條海底隧道（紅磡海底隧道）係喺邊一年正式通車？',
      en: 'In what year did Hong Kong’s first Cross-Harbour Tunnel (Hung Hom) officially open?'
    },
    choices: [
      { zh: '1972 年', en: '1972' },
      { zh: '1989 年', en: '1989' },
      { zh: '1958 年', en: '1958' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：紅隧喺 1972 年 8 月通車，當年沈殿霞（肥姐）坐老爺車成為首批過海嘉賓之一，轟動全港！',
      en: 'Fun fact: Opened in August 1972, beloved entertainer Lydia Shum ("Fei-Fei") famously rode across in a vintage car during the opening ceremony!'
    }
  },
  {
    region: 'yvr',
    q: {
      zh: '令溫哥華登上國際舞台、並促成架空列車（SkyTrain）誕生嘅世界博覽會係喺邊一年舉行？',
      en: 'Which landmark World Expo put modern Vancouver on the global map and launched the SkyTrain?'
    },
    choices: [
      { zh: '1986 年（Expo 86）', en: '1986 (Expo 86)' },
      { zh: '1998 年', en: '1998' },
      { zh: '1967 年', en: '1967' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：1986 年溫哥華世博會（Expo 86）吸引超過 2,200 萬人次入場，今日嘅 Science World 圓球就係當年留低嘅地標！',
      en: 'Fun fact: Expo 86 drew over 22 million visits to False Creek and left behind iconic landmarks including Science World and Canada Place!'
    }
  },
  {
    region: 'hk',
    q: {
      zh: '昔日飛機喺九龍城低空掠過、被譽為全球最考機師技術之一嘅香港舊機場叫咩名？',
      en: 'What was the name of Hong Kong’s legendary old airport famous for low turns over Kowloon City?'
    },
    choices: [
      { zh: '啟德機場（Kai Tak）', en: 'Kai Tak Airport' },
      { zh: '赤鱲角機場', en: 'Chek Lap Kok' },
      { zh: '石崗機場', en: 'Shek Kong' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：啟德機場服務香港 73 年，喺 1998 年 7 月 5 日晚上熄燈告別，一句「Goodbye Kai Tak」成為幾代香港人嘅集體回憶！',
      en: 'Fun fact: Kai Tak served Hong Kong for 73 years before its emotional farewell night on July 5, 1998.'
    }
  },
  {
    region: 'yvr',
    q: {
      zh: '溫哥華市中心被海水環繞、擁有著名圖騰柱同海堤步道（Seawall）嘅大型公園係？',
      en: 'Which famous park in Vancouver features an iconic oceanfront Seawall and historic Totem Poles?'
    },
    choices: [
      { zh: '史丹利公園（Stanley Park）', en: 'Stanley Park' },
      { zh: '中央公園（Central Park）', en: 'Central Park' },
      { zh: '海德公園（Hyde Park）', en: 'Hyde Park' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：史丹利公園喺 1888 年開放，面積超過 400 公頃，比紐約中央公園仲要大少少！',
      en: 'Fun fact: Opened in 1888, Stanley Park spans over 400 hectares — making it even larger than New York’s Central Park!'
    }
  },
  {
    region: 'both',
    q: {
      zh: '中國古代四大發明之中，由東漢「蔡倫」改良並大大普及嘅係邊一項？',
      en: 'Among the Four Great Inventions of ancient China, which one did Cai Lun famously improve during the Eastern Han dynasty?'
    },
    choices: [
      { zh: '造紙術', en: 'Papermaking' },
      { zh: '指南針', en: 'The Compass' },
      { zh: '火藥', en: 'Gunpowder' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：蔡倫用樹皮、麻頭同舊漁網造出輕便紙張（蔡侯紙），令書籍同文化得以廣泛流傳！',
      en: 'Fun fact: Cai Lun used tree bark, hemp, and old fishing nets to create lightweight affordable paper in 105 CE!'
    }
  },
  {
    region: 'both',
    q: {
      zh: '人類歷史上第一次成功登陸月球（阿波羅 11 號，尼爾·岩士唐）係發生喺邊一年？',
      en: 'In what year did Apollo 11 astronaut Neil Armstrong first walk on the Moon?'
    },
    choices: [
      { zh: '1969 年', en: '1969' },
      { zh: '1979 年', en: '1979' },
      { zh: '1959 年', en: '1959' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：1969 年 7 月全球超過六億人透過電視直播見證「個人嘅一小步，人類嘅一大步」！',
      en: 'Fun fact: Over 600 million people watched the July 1969 lunar landing live on television around the world!'
    }
  },
  {
    region: 'hk',
    q: {
      zh: '香港島行駛超過一百年、雙層而且發出「叮叮」聲嘅經典交通工具係？',
      en: 'Which century-old double-decker transport on Hong Kong Island is affectionately nicknamed "Ding Ding"?'
    },
    choices: [
      { zh: '香港電車（Hong Kong Tramways）', en: 'Hong Kong Tramways' },
      { zh: '山頂纜車', en: 'The Peak Tram' },
      { zh: '輕鐵列車', en: 'Light Rail' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：香港電車自 1904 年投入服務，擁有全世界最大規模嘅雙層電車車隊！',
      en: 'Fun fact: Operating since 1904, Hong Kong Tramways still runs the world’s largest fleet of double-decker trams!'
    }
  },
  {
    region: 'yvr',
    q: {
      zh: '連接溫哥華市中心（史丹利公園）同北溫哥華、建於 1938 年嘅著名吊橋叫咩名？',
      en: 'Built in 1938, which famous suspension bridge connects Stanley Park to the North Shore in Vancouver?'
    },
    choices: [
      { zh: '獅門橋（Lions Gate Bridge）', en: 'Lions Gate Bridge' },
      { zh: '青馬大橋（Tsing Ma Bridge）', en: 'Tsing Ma Bridge' },
      { zh: '倫敦塔橋（Tower Bridge）', en: 'Tower Bridge' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：獅門橋個名嚟自北溫哥華山頂一對好似獅子嘅山峰（The Lions），橋頭仲有一對石獅子守護！',
      en: 'Fun fact: Named after the twin mountain peaks ("The Lions") north of Vancouver, the bridge is guarded by two iconic art-deco concrete lions!'
    }
  },
  {
    region: 'both',
    q: {
      zh: '被譽為「醫聖」李時珍花咗近三十年時間編寫嘅中國明代藥物學巨著係？',
      en: 'Which monumental Ming-dynasty medical compendium took Li Shizhen nearly 30 years to write?'
    },
    choices: [
      { zh: '《本草綱目》', en: 'Compendium of Materia Medica (Bencao Gangmu)' },
      { zh: '《資治通鑑》', en: 'Zizhi Tongjian' },
      { zh: '《天工開物》', en: 'Tiangong Kaiwu' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：《本草綱目》收錄咗超過 1,892 種藥物同一萬幾條藥方，更被列入聯合國世界記憶名錄！',
      en: 'Fun fact: It cataloged 1,892 medicinal substances and over 11,000 prescriptions, earning a place on UNESCO’s Memory of the World Register!'
    }
  },
  {
    region: 'both',
    q: {
      zh: '廣東人飲茶「一盅兩件」入面嘅「一盅」原本係指啲乜嘢？',
      en: 'In the classic Cantonese Yum Cha phrase "Yat Jung Leung Gin" (一盅兩件), what does "Yat Jung" originally refer to?'
    },
    choices: [
      { zh: '一盅焗茶（蓋碗茶）', en: 'A lidded individual cup of brewed tea' },
      { zh: '一盅燉湯', en: 'A pot of double-boiled soup' },
      { zh: '一盅白飯', en: 'A steamed bowl of rice' }
    ],
    answer: 0,
    fact: {
      zh: '知多啲：以前茶居用茶盅（蓋碗）泡茶，配兩件精緻點心，所以叫「一盅兩件」，嘆盡慢活人情味！',
      en: 'Fun fact: Early Canton tea houses steeped tea leaves directly in a lidded porcelain cup ("cha jung"), paired with two plates of fresh dim sum!'
    }
  }
];

export const TIMELINE_SETS = [
  {
    title: { zh: '請由「最早」到「最近」順序撳以下三件大事：', en: 'Tap these 3 milestones in chronological order (Earliest → Latest):' },
    events: [
      { year: 1898, zh: '天星小輪正式成立穿梭維港', en: 'Star Ferry founded on Victoria Harbour' },
      { year: 1972, zh: '香港紅磡海底隧道通車', en: 'HK Cross-Harbour Tunnel opens' },
      { year: 1998, zh: '赤鱲角香港國際機場啟用', en: 'HK Chek Lap Kok Airport opens' }
    ]
  },
  {
    title: { zh: '請由「最早」到「最近」順序撳以下三件溫哥華／世界大事：', en: 'Tap these 3 Vancouver & World milestones from Earliest → Latest:' },
    events: [
      { year: 1938, zh: '溫哥華獅門橋（Lions Gate Bridge）通車', en: 'Vancouver Lions Gate Bridge opens' },
      { year: 1986, zh: '溫哥華世界博覽會（Expo 86）開幕', en: 'Vancouver Expo 86 opens' },
      { year: 2010, zh: '溫哥華冬季奧運會舉行', en: 'Vancouver Winter Olympics held' }
    ]
  },
  {
    title: { zh: '請由「最早」到「最近」順序撳中國三大朝代：', en: 'Tap these 3 Chinese dynasties in historical order (Earliest → Latest):' },
    events: [
      { year: 618, zh: '唐朝（詩仙李白、貞觀之治）', en: 'Tang Dynasty' },
      { year: 960, zh: '宋朝（清明上河圖、蘇東坡）', en: 'Song Dynasty' },
      { year: 1368, zh: '明朝（鄭和下西洋、紫禁城建成）', en: 'Ming Dynasty' }
    ]
  },
  {
    title: { zh: '請由「最早」到「最近」順序撳以下日常科技誕生年份：', en: 'Tap these 3 everyday inventions from Earliest → Latest:' },
    events: [
      { year: 1920, zh: '收音機廣播普及入屋', en: 'Household Radio Broadcasting' },
      { year: 1967, zh: '香港無線彩色電視啟播', en: 'Colour TV Broadcasts in HK' },
      { year: 2007, zh: '第一代觸控屏幕 iPhone 推出', en: 'First touchscreen iPhone launches' }
    ]
  }
];

export const IDIOM_QUESTIONS = [
  {
    prompt: {
      zh: '請揀啱嘅字完成成語：「龍馬 ＿ 神」（形容人精神奕奕、充滿活力）',
      en: 'Complete the classic blessing meaning "full of energy & vitality": "Dragon-Horse ___ Spirit" (龍馬精神)'
    },
    choices: [
      { zh: '精（龍馬精神）', en: '精 — Vigorous Spirit (龍馬精神)' },
      { zh: '驚（龍馬驚神）', en: '驚 — Startled' },
      { zh: '清（龍馬清神）', en: '清 — Clear' }
    ],
    answer: 0,
    note: {
      zh: '祝願長輩身體健康、魄力充沛最常用「龍馬精神」！',
      en: 'A beloved Cantonese greeting wishing elders vibrant energy and health!'
    }
  },
  {
    prompt: {
      zh: '廣東話俗語（歇後語）：「姜太公釣魚 —— ＿＿＿＿」下一句係咩？',
      en: 'Complete the classic proverb: "Jiang Ziya fishing with a straight hook — ______"'
    },
    choices: [
      { zh: '願者上釣（心甘情願）', en: 'Only the willing take the bait (願者上釣)' },
      { zh: '一條都無', en: 'Not a single fish caught' },
      { zh: '水清無魚', en: 'Water too clear for fish' }
    ],
    answer: 0,
    note: {
      zh: '相傳姜太公用直鈎唔落魚餌釣魚，比喻雙方你情我願！',
      en: 'Legend says Jiang Ziya used a straight hook without bait — meaning folks join completely voluntarily!'
    }
  },
  {
    prompt: {
      zh: '請完成四字成語：「熟能 ＿ 巧」（比喻練習得多自然更加純熟靈巧）',
      en: 'Complete the idiom meaning "Practice makes perfect": "Familiarity breeds ___ skill" (熟能生巧)'
    },
    choices: [
      { zh: '生（熟能生巧）', en: '生 — Practice makes skill (熟能生巧)' },
      { zh: '升（熟能升巧）', en: '升 — Rising' },
      { zh: '星（熟能星巧）', en: '星 — Star' }
    ],
    answer: 0,
    note: {
      zh: '每日玩幾分鐘腦點心，一樣「熟能生巧」，腦筋越用越精靈！',
      en: 'Just like daily brain puzzles — a few minutes each morning keeps the mind nimble!'
    }
  },
  {
    prompt: {
      zh: '廣東話俗語：「三個臭皮匠 —— ＿＿＿＿」下一句係咩？',
      en: 'Complete the proverb equivalent to "Two heads are better than one": "Three humble cobblers — ______"'
    },
    choices: [
      { zh: '勝過一個諸葛亮', en: 'Outsmart even master strategist Zhuge Liang' },
      { zh: '整爛三對新皮鞋', en: 'Ruin three pairs of shoes' },
      { zh: '不如早啲去飲茶', en: 'Might as well go for tea' }
    ],
    answer: 0,
    note: {
      zh: '意思係集思廣益，大家一齊傾偈動腦，智慧更高！',
      en: 'Putting heads together with family and friends beats solving everything alone!'
    }
  },
  {
    prompt: {
      zh: '請完成成語：「一舉 ＿ 得」（做一件事同時有兩個好處）',
      en: 'Complete the idiom meaning "Two birds with one stone": "One move, ___ gains" (一舉兩得)'
    },
    choices: [
      { zh: '兩（一舉兩得）', en: '兩 — Two gains in one move (一舉兩得)' },
      { zh: '百（一舉百得）', en: '百 — A hundred' },
      { zh: '半（一舉半得）', en: '半 — Half' }
    ],
    answer: 0,
    note: {
      zh: '嘆住早茶又練到腦力，正正就係「一舉兩得」！',
      en: 'Enjoying morning tea while sharpening your mind — two wins at once!'
    }
  }
];

export const CATEGORY_BOARDS = [
  {
    groups: [
      {
        name: { zh: '🫖 中國名茶', en: '🫖 Famous Teas' },
        items: [
          { zh: '普洱', en: "Pu'er" },
          { zh: '鐵觀音', en: 'Tieguanyin' },
          { zh: '香片', en: 'Jasmine Tea' }
        ]
      },
      {
        name: { zh: '🥟 酒樓點心', en: '🥟 Classic Dim Sum' },
        items: [
          { zh: '蝦餃', en: 'Har Gow' },
          { zh: '叉燒包', en: 'Cha Siu Bao' },
          { zh: '鮮蝦腸粉', en: 'Rice Roll' }
        ]
      },
      {
        name: { zh: '🇨🇦 大溫哥華地標', en: '🇨🇦 Metro Vancouver Spots' },
        items: [
          { zh: '史丹利公園', en: 'Stanley Park' },
          { zh: '獅門橋', en: 'Lions Gate' },
          { zh: '格蘭湖島', en: 'Granville Island' }
        ]
      }
    ]
  },
  {
    groups: [
      {
        name: { zh: '🇭🇰 香港經典地標', en: '🇭🇰 Hong Kong Landmarks' },
        items: [
          { zh: '獅子山', en: 'Lion Rock' },
          { zh: '太平山頂', en: 'Victoria Peak' },
          { zh: '尖沙咀鐘樓', en: 'TST Clock Tower' }
        ]
      },
      {
        name: { zh: '🍊 清甜生果', en: '🍊 Fresh Fruits' },
        items: [
          { zh: '富士蘋果', en: 'Apple' },
          { zh: '香甜木瓜', en: 'Papaya' },
          { zh: '紅肉火龍果', en: 'Dragon Fruit' }
        ]
      },
      {
        name: { zh: '🀄 麻雀三元／四喜牌', en: '🀄 Mahjong Honor Tiles' },
        items: [
          { zh: '紅中', en: 'Red Dragon' },
          { zh: '發財', en: 'Green Dragon' },
          { zh: '白板', en: 'White Dragon' }
        ]
      }
    ]
  }
];

export const EAGLE_PAIRS = [
  { majority: '末', odd: '未', tip: { zh: '留意上面一橫長短（末 vs 未）', en: 'Look at the top horizontal stroke (末 vs 未)' } },
  { majority: '烏', odd: '鳥', tip: { zh: '搵下邊隻雀仔多咗一點眼睛（烏 vs 鳥）', en: 'Spot the bird with the eye stroke inside (烏 vs 鳥)' } },
  { majority: '大', odd: '太', tip: { zh: '留意下面有無多一點（大 vs 太）', en: 'Spot the extra dot at the bottom (大 vs 太)' } },
  { majority: '茶', odd: '荼', tip: { zh: '留意下面係「木」定多咗一橫（茶 vs 荼）', en: 'Look closely at the middle stroke (茶 vs 荼)' } },
  { majority: '問', odd: '間', tip: { zh: '門入面係「口」定「日」（問 vs 間）', en: 'Inside the gate: 口 vs 日 (問 vs 間)' } },
  { majority: '8', odd: 'B', tip: { zh: '數字 8 入面混入咗英文字母 B！', en: 'Find the letter B hiding among 8s!' } },
  { majority: '🥟', odd: '🥐', tip: { zh: '蝦餃陣入面混入咗一個牛角包！', en: 'Find the croissant hiding among the dumplings!' } },
  { majority: '🍁', odd: '🍂', tip: { zh: '紅楓葉入面有一塊落葉唔同款！', en: 'Spot the different autumn leaf among the maple leaves!' } }
];

export const COLLECTIBLE_ALBUM = [
  // Classic Dim Sum
  { id: 'har-gow', cat: 'dimsum', emoji: '🥟', zh: '晶瑩筍尖蝦餃皇', en: 'Crystal Har Gow', blurb: { zh: '茶樓「四大天王」之首，傳統摺紋要有十二摺以上先算上品！', en: 'Crown jewel of Yum Cha — master chefs pleat at least 12 delicate folds!' } },
  { id: 'siu-mai', cat: 'dimsum', emoji: '🧆', zh: '蟹籽干蒸燒賣', en: 'Crab Roe Siu Mai', blurb: { zh: '「一盅兩件」必備拍檔，鮮甜爽彈！', en: 'An essential companion to morning tea with savory pork and whole shrimp.' } },
  { id: 'egg-tart', cat: 'dimsum', emoji: '🥧', zh: '出爐酥皮蛋撻', en: 'Golden Egg Tart', blurb: { zh: '牛油皮與酥皮各有支持者，熱辣辣出爐最香滑！', en: 'Whether shortcrust or 100-layer puff pastry, nothing beats a warm HK egg tart.' } },
  { id: 'bolo-bun', cat: 'dimsum', emoji: '🥯', zh: '冰火菠蘿油', en: 'Pineapple Bun w/ Butter', blurb: { zh: '金黃脆皮夾住冰凍厚牛油，港式茶餐廳同溫哥華港式餅店人氣王！', en: 'Warm crunchy sweet crust hugging chilled salted butter — beloved in HK & Richmond!' } },
  { id: 'cheung-fun', cat: 'dimsum', emoji: '🍤', zh: '布拉鮮蝦腸粉', en: 'Silky Shrimp Rice Roll', blurb: { zh: '米香滑溜，淋上甜豉油即刻令人食指大動！', en: 'Steamed on cotton cloth for a velvety texture, drizzled with sweet soy.' } },
  { id: 'cha-siu-bao', cat: 'dimsum', emoji: '馒', display: '🍥', zh: '爆口蜜汁叉燒包', en: 'Honey BBQ Pork Bun', blurb: { zh: '包頂自然微裂露出蜜汁叉燒，鬆軟香甜！', en: 'Fluffy steamed bun bursting open gently at the top with sweet roast pork.' } },

  // Famous Teas
  { id: 'puer', cat: 'tea', emoji: '🫖', zh: '陳年雲南普洱', en: 'Aged Yunnan Pu-erh', blurb: { zh: '湯色紅濃明亮，溫和護胃，消滯解膩一流！', en: 'Smooth, earthy, and comforting — the classic pairing for rich dim sum.' } },
  { id: 'tieguanyin', cat: 'tea', emoji: '🍵', zh: '安溪鐵觀音', en: 'Anxi Tieguanyin Oolong', blurb: { zh: '「七泡有餘香」，入口回甘帶天然蘭花清香！', en: 'Famous for lingering orchid aroma even after seven steepings!' } },
  { id: 'jasmine', cat: 'tea', emoji: '🌼', zh: '茉莉香片', en: 'Fragrant Jasmine Tea', blurb: { zh: '綠茶熏製新鮮茉莉花香，清新醒神！', en: 'Green tea scented with night-blooming jasmine blossoms — crisp and refreshing.' } },
  { id: 'juk-po', cat: 'tea', emoji: '🌻', zh: '清潤菊花普洱（菊普）', en: 'Chrysanthemum Pu-erh', blurb: { zh: '廣東茶客最愛配搭：普洱醇厚加上杭菊清熱明目！', en: 'A signature Cantonese blend adding cooling chrysanthemum flowers to smooth Pu-erh.' } },
  { id: 'longjing', cat: 'tea', emoji: '🍃', zh: '西湖明前龍井', en: 'West Lake Dragon Well', blurb: { zh: '色綠、香郁、味甘、形美，春日上品綠茶！', en: 'Celebrated for its jade color, toasted chestnut aroma, and sweet finish.' } },
  { id: 'shuixian', cat: 'tea', emoji: '🪵', zh: '武夷岩茶水仙', en: 'Wuyi Rock Water Sprite', blurb: { zh: '獨具「岩骨花香」，韻味悠長！', en: 'Grown in mineral-rich Wuyi cliffs for a roasted, mellow "rock rhyme" flavor.' } },

  // HK & Vancouver Icons
  { id: 'star-ferry', cat: 'place', emoji: '⛴️', zh: '維港天星小輪', en: 'Victoria Harbour Star Ferry', blurb: { zh: '綠白船身橫渡維多利亞港超過一個世紀，海風最寫意！', en: 'Green-and-white ferries crossing Victoria Harbour for well over a century.' } },
  { id: 'hk-tram', cat: 'place', emoji: '🚋', zh: '港島叮叮電車', en: 'HK "Ding Ding" Tram', blurb: { zh: '坐上層吹風睇街景，由堅尼地城慢慢嘆到筲箕灣！', en: 'Breezy upper-deck rides linking Kennedy Town to Shau Kei Wan since 1904.' } },
  { id: 'lion-rock', cat: 'place', emoji: '⛰️', zh: '香港獅子山', en: 'Lion Rock', blurb: { zh: '九龍同新界之間嘅地標山峰，象徵守望相助精神！', en: 'Iconic ridge watching over Kowloon, symbolizing resilience and family spirit.' } },
  { id: 'stanley-park', cat: 'place', emoji: '🌲', zh: '溫哥華史丹利公園', en: 'Vancouver Stanley Park', blurb: { zh: '沿住海堤（Seawall）散步睇雪山同海灣，心曠神怡！', en: 'Oceanfront seawall strolls framed by cedar forests and North Shore peaks.' } },
  { id: 'lions-gate', cat: 'place', emoji: '🌉', zh: '溫哥華獅門橋', en: 'Lions Gate Bridge', blurb: { zh: '橫跨布拉德內灣，黃昏日落景色美不勝收！', en: 'Spanning Burrard Inlet since 1938 with breathtaking sunset views.' } },
  { id: 'granville', cat: 'place', emoji: '🛶', zh: '格蘭湖島市集', en: 'Granville Island Market', blurb: { zh: '坐小渡輪去買新鮮生果、飲杯熱湯，溫哥華週末好去處！', en: 'Beloved waterfront public market for fresh berries, artisan treats, and Aquabus rides.' } }
];
