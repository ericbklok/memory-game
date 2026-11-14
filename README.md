# 每日腦點心 · Daily MindSum (`memory-game`)

A senior-friendly, bilingual (**Cantonese / Traditional Chinese 粵語** & **English**) daily brain-exercise web app and installable **PWA** tailored for parents and family across **Hong Kong 🇭🇰** and **Vancouver 🇨🇦**.

---

## ✨ Features

- **1-Tap Daily 4-Dish Ritual (`今日四道腦點心紙`):** Tactile tea-house Dim Sum Stamp Card with red ink chop animations, streaks (`🔥`), forgiving **Warm Teapot Streak Shields (`🫖 保溫壺`)**, and 1-tap WhatsApp / WeChat / iMessage sharing.
- **15 Engaging Brain Games (Adaptive Difficulty & Untimed by Default):**
  1. **📰 時事醒目仔 (Daily News Recall):** HK, Vancouver & Wellness short briefs with **🔊 Cantonese (`zh-HK`) & English Read-Aloud** + recall quiz (refreshed daily via GitHub Actions).
  2. **🀄 麻雀與買餸記憶 (Mahjong / Family Photo Pairs & Wet Market Recall):** High-contrast Mahjong & Dim Sum tiles, private local **Family Photo cards** (`IndexedDB`), plus delayed-recall Wet Market shopping list.
  3. **🧮 飲茶埋單心算 (Yum Cha Bill & Exact Change):** Tea-house bill tallying, interactive bill/coin change-making, and target sums.
  4. **🏛️ 當年今日博學堂 (History & Reminiscence):** Nostalgic HK, Vancouver, Chinese & World trivia + chronological timeline ordering.
  5. **🗣️ 成語俗語與分類 (Idioms & Category Sort):** 4-character idioms, classic Cantonese sayings (`歇後語`), and *Connections*-style category sorting.
  6. **👀 眼明手快尋寶 (Eagle Eye Tile Hunt):** Calm, high-contrast visual scan grids with gentle hints.
  7. **🔢 醒神茶樓數獨 (Tea-House Sudoku):** 4×4, 6×6 & 9×9 Sudoku with Dim Sum icon mode, pencil notes (`草稿`), and smart logical step hints.
  8. **🀄 叫糊大師 (Mahjong Winning Tile Quiz):** Pick the exact winning tile (`食糊`) for sorted 7-, 10-, and 13-tile Cantonese Mahjong hands.
  9. **🀅 麻雀連連看消消樂 (Mahjong Pair Clear / Shisen-Sho):** Match tiles connected within ≤ 2 turns, with auto-shuffle protection and pair hints.
  10. **🃏 合廿四撲克心算 (Make 24 Card Math):** Step-by-step playing card arithmetic (`+ − × ÷`) to hit 24 (or 12 on Relaxed).
  11. **🔤 港溫尋字陣 (HK × YVR Word Search):** Tap-first + tap-last word search (zero dragging needed) for hidden HK/Vancouver places, teas & idioms.
  12. **🧱 茶木方塊消消樂 (Tea-Wood Block Fit):** Relaxing 6×6 wooden block placement puzzle clearing complete rows and columns.
  13. **🎨 心清眼亮辨色字 (Color vs. Word Switch / Stroop):** Prefrontal focus exercise switching between ink color and word meaning.
  14. **🎵 茗茶聽音記次序 (Porcelain Tea Chimes):** Pentatonic porcelain teacup melody memory (*Simon Says*) with 1-tap replay.
  15. **📖 雅言詞匯館 (Vocabulary Builder):** Refined Chinese context clues, practical HK × Vancouver everyday English vocabulary (with audio pronunciation & phonetics), and Synonym / Bilingual pair-matching.
- **🎁 Collectible Keepsake Album (`港溫珍藏圖鑑`):** Unlock 18 illustrated Classic Dim Sum, Famous Chinese Teas, and HK × Vancouver Landmarks.
- **🏆 Open Local Play + Optional Google OAuth Global & Family Circle Leaderboard:**
  - Anyone can play locally with zero login.
  - Signing up with Google syncs scores to the **Global Leaderboard** and lets any player **invite friends & family** (`?invite=TEA-XXXX`) into shared Circle scoreboards!

---

## 🚀 Publishing on GitHub Pages

1. Push to `main` on `https://github.com/ericbklok/memory-game`.
2. On GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Your live app will publish at: **`https://ericbklok.github.io/memory-game/`** (and refresh news automatically every day!).

---

## ☁️ Free \$0 Firebase Spark Setup (Google OAuth + Global Leaderboard)

No credit card is required on Firebase's **Spark (Free)** plan:

1. Go to [console.firebase.google.com](https://console.firebase.google.com/) → **Create a project** (keep the default **Spark Free Plan**).
2. **Authentication:** Click **Build → Authentication → Get started** → enable **Google** sign-in. Under **Authentication → Settings → Authorized domains**, add `ericbklok.github.io`.
3. **Firestore Database:** Click **Build → Firestore Database → Create database** → Start in **Production mode** → open the **Rules** tab, paste the contents of [`firestore.rules`](./firestore.rules), and click **Publish**.
4. **Web App Config:** In **Project Settings → General → Your apps**, click the Web icon (`</>`), register `Daily MindSum`, and copy the `firebaseConfig` values into [`js/firebase-config.js`](./js/firebase-config.js) (or paste them into the in-app **⚙️ Cloud Setup** modal to test immediately!).
