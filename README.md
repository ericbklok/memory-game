# 每日腦點心 · Daily MindSum (`memory-game`)

A senior-friendly, bilingual (**Cantonese / Traditional Chinese 粵語** & **English**) daily brain-exercise web app and installable **PWA** tailored for parents and family across **Hong Kong 🇭🇰** and **Vancouver 🇨🇦**.

---

## ✨ Features

- **1-Tap Daily 4-Dish Ritual (`今日四道腦點心紙`):** Tactile tea-house Dim Sum Stamp Card with red ink chop animations, streaks (`🔥`), forgiving **Warm Teapot Streak Shields (`🫖 保溫壺`)**, and 1-tap WhatsApp / WeChat / iMessage sharing.
- **6 Engaging Brain Games (Adaptive Difficulty & Untimed by Default):**
  1. **📰 時事醒目仔 (Daily News Recall):** HK, Vancouver & Wellness short briefs with **🔊 Cantonese (`zh-HK`) & English Read-Aloud** + recall quiz (refreshed daily via GitHub Actions).
  2. **🀄 麻雀與買餸記憶 (Mahjong / Family Photo Pairs & Wet Market Recall):** High-contrast Mahjong & Dim Sum tiles, private local **Family Photo cards** (`IndexedDB`), plus delayed-recall Wet Market shopping list.
  3. **🧮 飲茶埋單心算 (Yum Cha Bill & Exact Change):** Tea-house bill tallying, interactive bill/coin change-making, and target sums.
  4. **🏛️ 當年今日博學堂 (History & Reminiscence):** Nostalgic HK, Vancouver, Chinese & World trivia + chronological timeline ordering.
  5. **🗣️ 成語俗語與分類 (Idioms & Category Sort):** 4-character idioms, classic Cantonese sayings (`歇後語`), and *Connections*-style category sorting.
  6. **👀 眼明手快尋寶 (Eagle Eye Tile Hunt):** Calm, high-contrast visual scan grids with gentle hints.
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
