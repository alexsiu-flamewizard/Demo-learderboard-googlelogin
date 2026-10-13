# Gemini Game Hub

一個簡單的 Demo 平台：用 Google 登入後，可以玩、上傳、管理 **Google Gemini 產生的 HTML 遊戲**，每個遊戲都有自己的 **Leaderboard**。

前端是 Vite + React，資料與檔案都放在 Firebase（Authentication、Cloud Firestore、Storage），**沒有自建後端**。

---

## 功能列表

- Google Login（Firebase Authentication）
- 登入後自動建立 `users/{uid}`，預設 `role = "user"`
- 首頁顯示所有 `isActive = true` 的遊戲
- 搜尋遊戲（title / description）
- 遊戲頁用 iframe 載入上傳的 HTML
- 登入使用者可提交分數（手動輸入，或由 iframe `postMessage` 填入後再按提交）
- 每個遊戲有 Top 10 與完整排行榜
- Admin 可新增 / 編輯 / 啟用停用 / 刪除遊戲
- Thumbnail 與 HTML 檔上傳到 Firebase Storage
- Dark mode、RWD card dashboard
- HashRouter，方便部署到 GitHub Pages

未登入也可以瀏覽遊戲與排行榜；提交分數與 Admin 功能需要登入。

---

## 技術棧

- Vite
- React
- JavaScript（不使用 TypeScript / Next.js）
- Tailwind CSS
- React Router（`HashRouter`）
- lucide-react
- Firebase Authentication（Google Login）
- Cloud Firestore
- Firebase Storage

---

## 快速開始

```bash
npm install
copy .env.example .env
# 把 .env 填入你的 Firebase 設定
npm run dev
```

瀏覽器開啟 Vite 顯示的本機網址（通常是 `http://localhost:5173`）。

```bash
npm run build
npm run preview
```

---

## Firebase 建立教學

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 新增專案（Project）
3. 專案建立後，進入 **Project settings → General → Your apps**
4. 新增一個 **Web app**（`</>` 圖示）
5. 複製 Firebase config，填到本機 `.env`

需要的值：

- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

---

## Google Login 啟用教學

1. Firebase Console → **Build → Authentication**
2. 點 **Get started**
3. **Sign-in method** 啟用 **Google**
4. 設定專案的公開名稱與支援 email
5. **Authentication → Settings → Authorized domains**
   - 本機開發請保留 `localhost`
   - 若部署 GitHub Pages，再加入 `username.github.io`

第一次用 Google 登入後，前端會自動寫入：

```text
users/{uid}
  uid
  displayName
  email
  photoURL
  role: "user"
  createdAt
  updatedAt
```

---

## Firestore 建立教學

1. Firebase Console → **Build → Firestore Database**
2. 建立資料庫，開發時可先選 **Start in test mode**，再立刻改成本專案的 rules
3. 位置選離使用者較近的 region
4. 把專案根目錄的 `firestore.rules` 貼進 **Rules** 分頁並發布

Collections 會在第一次登入 / 新增遊戲 / 提交分數時自動建立，不必先手動建空 collection。

建議的資料結構：

### `users/{uid}`

| 欄位 | 說明 |
| --- | --- |
| uid | Firebase Auth uid |
| displayName | 顯示名稱 |
| email | Email |
| photoURL | 頭像 |
| role | `"user"` 或 `"admin"` |
| createdAt / updatedAt | Timestamp |

### `games/{gameId}`

| 欄位 | 說明 |
| --- | --- |
| title | 遊戲名稱 |
| description | 簡介 |
| thumbnailUrl | Storage download URL |
| htmlFileUrl | Storage download URL |
| createdBy | 建立者 uid |
| createdAt / updatedAt | Timestamp |
| isActive | 是否出現在首頁 |

### `scores/{scoreId}`

| 欄位 | 說明 |
| --- | --- |
| userId | 玩家 uid |
| gameId | 遊戲 id |
| userName | 玩家名稱 |
| userPhotoURL | 玩家頭像 |
| score | number |
| createdAt | Timestamp |

`scoreId` 由 Firestore 自動產生。

---

## Storage 啟用教學

1. Firebase Console → **Build → Storage**
2. Get started，選與 Firestore 相同或鄰近的 region
3. 把專案根目錄的 `storage.rules` 貼進 **Rules** 並發布

上傳路徑格式：

```text
games/{gameId}/thumbnail_{timestamp}_{filename}
games/{gameId}/game_{timestamp}.html
```

HTML 上傳時會設成 `text/html` 且 `Content-Disposition: inline`，讓遊戲頁的 iframe 可以直接顯示，而不是被下載。

---

## .env 設定

複製範例檔：

```bash
copy .env.example .env
```

`.env.example`：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# GitHub Pages 範例：/repo-name/
# 本機開發用 /
VITE_BASE_PATH=/
```

`.env` 不會進 git。改完環境變數後請重啟 `npm run dev`。

如果部署到：

```text
https://username.github.io/repo-name/
```

請在 `.env`（或 CI 環境變數）設定：

```env
VITE_BASE_PATH=/repo-name/
```

`vite.config.js` 會讀取這個值當 `base`。

---

## 如何建立第一個 admin

1. 先用 Google 登入一次，讓系統建立 `users/{你的uid}`
2. 打開 Firebase Console → Firestore → `users`
3. 找到你的文件
4. 把 `role` 從 `"user"` 改成 `"admin"`
5. 重新整理網站

Navbar 出現 **Admin** 後就可以進入 `/admin`。

非 admin 進入 `/admin` 會看到 **Access Denied**。

使用者不能在前端把自己改成 admin；Firestore rules 也禁止一般使用者改 `role`。

---

## 如何新增遊戲

1. 用 admin 帳號登入
2. 打開 **Admin**
3. 填寫：
   - title
   - description
   - thumbnail image
   - html file（Gemini 產生的單一 HTML 最理想）
   - isActive
4. 送出後，檔案會上傳到 Storage，download URL 會寫進 `games` collection

專案內有可上傳測試的 sample game：

```text
public/sample-games/clicker/index.html
```

這是一款 **馬里奧風格像素闖關**：動態背景、吃金幣、踩怪物、躲避水管食人花與砲彈，共三關，到達城堡過關。過關或 Game Over 會把分數傳回平台：

```js
window.parent.postMessage({
  type: "GAME_SCORE",
  score: finalScore
}, "*");
```

**請先到 Admin Panel 手動上傳這個 HTML 檔來測試。** 它是單一檔案，title 可用「馬里奧大冒險」，thumbnail 可自己截一張遊戲畫面。

操作：← → 移動，空白鍵 / ↑ 跳躍。手機有虛擬按鈕。遊戲內也有 **Submit Score**。平台只會填入分數，不會自動送出。

另外還有一份簡單點擊遊戲：

```text
public/sample-game.html
```

---

## 如何提交分數

有兩種方式：

1. **手動輸入**：登入後在遊戲頁的 score number input 輸入分數，按 Submit
2. **遊戲回傳**：HTML 遊戲用 `window.parent.postMessage` 把分數傳給平台，平台會填進 input。登入使用者會看到「收到遊戲分數，請點擊提交」，再按 Submit 才會寫入 Firestore

流程：

1. 打開 `/game/:gameId`
2. 在 iframe 裡玩遊戲
3. 等到分數填入表單（手動或 postMessage）
4. 登入後按 Submit
5. 文件會寫入 `scores` collection
6. 該遊戲頁下方顯示 Top 10；`/leaderboard/:gameId` 顯示完整排行榜

排序規則：`score` 由高到低。前三名顯示 🥇 🥈 🥉。目前登入使用者的列會 highlight。

**Demo 不會自動提交分數**，避免遊戲一結束就誤送。

---

## HTML 遊戲如何回傳分數

把這段放進 Gemini 產生的 HTML 遊戲。遊戲頁的 iframe 會監聽 `message`，當 `event.data.type === "GAME_SCORE"` 時，把 `score` 填進表單。

```html
<button onclick="submitScore()">Submit Score</button>
<script>
function submitScore() {
  window.parent.postMessage({
    type: "GAME_SCORE",
    score: 100
  }, "*");
}
</script>
```

訊息格式：

```js
{
  type: "GAME_SCORE",
  score: 1234
}
```

注意：

- `type` 必須是 `"GAME_SCORE"`
- `score` 必須是 number
- Demo 使用 `"*"` 當 `targetOrigin`，方便本機與 GitHub Pages 測試
- **正式產品不要使用 `"*"`**，應該限制 `targetOrigin`，例如：

```js
window.parent.postMessage(
  { type: "GAME_SCORE", score: 100 },
  "https://your-domain.example"
);
```

平台端也應該驗證 `event.origin`（例如只接受 Firebase Storage 網域），必要時再用 Cloud Functions 驗證分數，避免作弊。

---

## 如何部署到 GitHub Pages

這個專案雖然依賴 Firebase，但前端仍是靜態檔，可以放到 GitHub Pages。請使用 **HashRouter**（本專案已設定），避免 GitHub Pages 重新整理時 404。

1. 把程式推到 GitHub repository
2. 若 repo 名稱不是根網域，設定：

```env
VITE_BASE_PATH=/repo-name/
```

3. 建置：

```bash
npm run build
```

4. 把 `dist/` 部署到 `gh-pages` branch，或在 repo Settings → Pages 指定 GitHub Actions / `dist`

簡單做法之一：

```bash
npm install -D gh-pages
```

然後在 `package.json` 加：

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

再執行：

```bash
npm run deploy
```

5. GitHub → Settings → Pages，確認 source 指向 `gh-pages`

網站網址會類似：

```text
https://username.github.io/repo-name/#/
https://username.github.io/repo-name/#/game/abc123
```

---

## GitHub Pages + Firebase Auth authorized domain 設定

Google Login 只能在 Firebase 允許的網域使用。

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. 新增：

```text
localhost
username.github.io
```

3. 不要只加完整 path；Authorized domains 填 **hostname**
4. 若 login popup 被擋，請允許瀏覽器 popup，或確認 `authDomain` 與 Firebase 專案一致

OAuth 同意畫面如果出現錯誤，到 [Google Cloud Console](https://console.cloud.google.com/) 確認：

- OAuth consent screen 已設定
- Google provider 已啟用
- 支援 email 正確

---

## Firestore Rules

專案檔案：`firestore.rules`

重點：

- `games`
  - 所有人可以 read `isActive = true` 的遊戲
  - admin 可以 read / write 全部遊戲
- `users`
  - 使用者可以 read / write 自己的基本 profile
  - 使用者不能把自己改成 admin
  - admin 可以 read 所有 users
- `scores`
  - 所有人可以 read
  - 登入使用者可以 create 自己的 score
  - `userId` 必須等於 `request.auth.uid`
  - `score` 必須是 number
  - 一般使用者不能 update / delete；admin 可以

發布方式：

- Console 手動貼上 rules
- 或安裝 Firebase CLI 後執行 `firebase deploy --only firestore:rules`

---

## Storage Rules

專案檔案：`storage.rules`

重點：

- `games/**` 的 HTML 與 thumbnails **公開讀取**（iframe 才能載入）
- 只有 admin 可以 upload / update / delete

Storage rules 會用 `firestore.get(...)` 檢查 `users/{uid}.role == "admin"`，所以請先完成 Firestore 的 users 文件，再上傳檔案。

---

## Demo 限制

這是 Demo，不是正式比賽系統。

- 分數可以**手動輸入**，無法防止作弊
- iframe `postMessage` 只會填入分數，**不會自動提交**
- Demo 的 `postMessage` 使用 `"*"`；正式版應限制 `targetOrigin` 並驗證 `event.origin`
- 沒有後端驗證遊戲結果
- 沒有 Cloud Functions
- 同一位玩家可以多次提交分數
- HTML 遊戲請盡量做成單一檔案；外部相對路徑資源可能載不到
- 未登入使用者可以看到遊戲，但不能提交分數、不能進 Admin

**正式版不應該信任前端送出的分數。**  
正式版應限制 `postMessage` 的 `targetOrigin`，驗證 `event.origin`，並用 Cloud Functions / 後端驗證分數，避免作弊。

---

## 未來升級方向

- 驗證 `postMessage` 的 `event.origin`，正式環境不要使用 `"*"`
- 遊戲 iframe `postMessage` 後自動提交分數（需搭配後端驗證）
- Cloud Functions 驗證分數、限制提交頻率
- 每位玩家每局只保留最高分
- 遊戲分類、標籤、精選
- Admin 審核 Gemini HTML 內容
- 即時排行榜（Firestore `onSnapshot`）
- 使用量統計、檢舉、留言
- 部署到 Firebase Hosting（可搭配自訂網域）

---

## 主要檔案

```text
src/firebase.js
src/contexts/AuthContext.jsx
src/hooks/useAdmin.js
src/components/Navbar.jsx
src/components/GameCard.jsx
src/components/LeaderboardTable.jsx
src/components/AdminRoute.jsx
src/pages/Home.jsx
src/pages/GameDetail.jsx
src/pages/GameLeaderboard.jsx
src/pages/Admin.jsx
src/pages/AccessDenied.jsx
src/services/userService.js
src/services/gameService.js
src/services/scoreService.js
firestore.rules
storage.rules
```

Routes：

- `/`
- `/game/:gameId`
- `/leaderboard/:gameId`
- `/admin`
