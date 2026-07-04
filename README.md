# 🎨 Drawly — Multiplayer Draw & Guess Game

A full-featured multiplayer drawing and guessing game inspired by Skribbl.io, built with React, Node.js, and Socket.IO.

---

## 🚀 Quick Start (Local Play)

### Prerequisites
- **Node.js 18+** — https://nodejs.org

### Step 1 — Install Dependencies

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### Step 2 — Configure Environment

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

### Step 3 — Run Both Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Server starts at http://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# App opens at http://localhost:5173
```

### Step 4 — Play!
1. Open http://localhost:5173 in your browser
2. Enter your name and **Create Room**
3. Share the room code or invite link with friends
4. Host clicks **Start Game** when everyone is ready

---

## 🌐 Hosting Online (So Anyone Can Play)

### Option A — Railway (Easiest, Free Tier)

**Deploy Backend:**
1. Go to https://railway.app and sign up
2. Click **New Project → Deploy from GitHub**
3. Connect your repo and select the `server` folder as root
4. Set environment variables:
   ```
   PORT=3001
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```
5. Railway gives you a URL like `https://drawly-server.up.railway.app`

**Deploy Frontend:**
1. Go to https://vercel.com
2. Import your repo, set **Root Directory** to `client`
3. Add environment variable:
   ```
   VITE_SERVER_URL=https://drawly-server.up.railway.app
   ```
4. Deploy — Vercel gives you `https://drawly.vercel.app`

### Option B — Render (Free Tier)

**Backend on Render:**
1. https://render.com → New Web Service
2. Connect GitHub repo, set root to `server/`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add env var: `CLIENT_URL=https://your-app.vercel.app`

**Frontend on Vercel:** (same as Option A above)

### Option C — VPS / DigitalOcean ($6/mo)

```bash
# On your server (Ubuntu 22.04)
git clone https://github.com/you/drawly
cd drawly

# Install Node via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# Setup server
cd server
cp .env.example .env
nano .env  # Set PORT=3001, CLIENT_URL=https://yourdomain.com
npm install

# Build client
cd ../client
cp .env.example .env
nano .env  # Set VITE_SERVER_URL=https://yourdomain.com
npm install && npm run build

# Install PM2 to keep server running
npm install -g pm2
cd ../server
pm2 start src/index.js --name drawly-server
pm2 save && pm2 startup

# Install Nginx
sudo apt install nginx -y
```

**Nginx config** (`/etc/nginx/sites-available/drawly`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React frontend
    location / {
        root /path/to/drawly/client/dist;
        try_files $uri /index.html;
    }

    # Proxy Socket.IO + API to Node server
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3001;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/drawly /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add HTTPS with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Option D — Play on LAN (Same WiFi)

No hosting needed! Just:
1. Start both servers locally
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. In `client/.env`, set:
   ```
   VITE_SERVER_URL=http://192.168.1.XXX:3001
   ```
4. Restart client: `npm run dev -- --host`
5. Friends connect to: `http://192.168.1.XXX:5173`

---

## 🎮 How to Play

| Role | What to do |
|------|-----------|
| **Host** | Create room, configure settings, start game |
| **Drawer** | Pick a word, draw it on the canvas in time |
| **Guesser** | Type guesses in chat — faster = more points! |

### Scoring
- **Guesser:** Up to 500 points — earlier guesses earn more
- **Drawer:** +50 points per correct guess
- **Close guesses** (within 2 letters) get a 🔥 hint

### Hints
- Word length shown as `_ _ _ _ _`
- 1/3 through: one random letter revealed
- 2/3 through: another letter revealed

---

## 📁 Project Structure

```
drawly/
├── server/
│   └── src/
│       ├── index.js          # Express + Socket.IO server
│       └── game/
│           ├── gameManager.js  # All game state logic
│           ├── socketHandlers.js # Socket event handlers
│           └── words.js        # Word list
└── client/
    └── src/
        ├── components/
│           ├── Canvas/       # Drawing canvas + tools
│           ├── Chat/         # Chat + guessing panel
│           ├── Game/         # Game screens + overlays
│           ├── Lobby/        # Home + lobby screens
│           └── UI/           # Notification toast
        ├── context/          # React context (Game, Socket)
        └── hooks/            # useCanvas, useGameSocket
```

---

## ⚙️ Game Settings

| Setting | Options | Default |
|---------|---------|---------|
| Rounds | 2–6 | 3 |
| Draw Time | 40–120s | 80s |
| Max Players | 2–10 | 8 |

---

## 🔧 Tech Stack

- **Frontend:** React 18, Tailwind CSS, Socket.IO Client, HTML5 Canvas
- **Backend:** Node.js, Express, Socket.IO
- **No database needed** — all state is in-memory (resets on server restart)

---

## 📝 Notes

- Games are ephemeral — state lives in server memory
- For persistence, add MongoDB/Redis (optional enhancement)
- Supports mobile touch drawing
- Works on all modern browsers
