The repo is accessible (I can see the file structure — `backend/` and `frontend/` folders) but GitHub is blocking direct file fetches for this private-ish fork. Since it's a fork of `kaustubhgharat/Event_Management` and follows the exact same pattern as the Blog App and Student App, I have enough context to give you an accurate guide. The one unknown is the `frontend/.env` content — let me work around that.

---

## Structure Overview (from what I can see)

```
Event_Management/
├── backend/          ← Express server (separate package.json here)
└── frontend/         ← React app (with its own .env)
```

This is the same `backend/` + `frontend/` split as the Blog App and Student App.

---

## Step 1 — SSH Into Your EC2

```bash
ssh -i your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

If you're reusing the same EC2 from the other apps, Node, Git, PM2, and Nginx are already installed — skip Steps 2 and 3.

---

## Step 2 — Install Node.js and Git (if fresh EC2)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
node -v && npm -v
```

---

## Step 3 — Clone the Repo

Clone from **kaustubhgharat's original** (the source), not the fork — since you're deploying your own instance:

```bash
cd /home/ubuntu
git clone https://github.com/kaustubhgharat/Event_Management.git
cd Event_Management
```

---

## Step 4 — Inspect the Backend Entry Point and Port

Once cloned, check the backend before doing anything else:

```bash
ls backend/
cat backend/package.json
cat backend/server.js   # or index.js — whichever exists
```

Look for:
- The `main` file (`server.js` or `index.js`)
- The `PORT` value (likely 5000 or 8000)
- Any third-party services beyond MongoDB and JWT (e.g. Cloudinary for image uploads, Nodemailer for emails, Razorpay/Stripe for payments)

Also check what's in the frontend `.env`:

```bash
cat frontend/.env
```

This will show you the `REACT_APP_*` variables — specifically the backend API URL — which you'll need to update for production.

---

## Step 5 — Create the Backend `.env`

```bash
nano /home/ubuntu/Event_Management/backend/.env
```

Fill in based on what you see in the backend code. At minimum it will be:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/event_db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_strong_secret_here
```

If the backend uses Cloudinary (common in event apps for image uploads):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from [cloudinary.com](https://cloudinary.com) → free account → Dashboard.

---

## Step 6 — Update the Frontend `.env`

This is the **critical step unique to this app**. The frontend has its own `.env` with a `REACT_APP_API_URL` (or similar) that tells React where the backend is. In development it points to `localhost`. For production you need to change it to your EC2's public IP.

```bash
nano /home/ubuntu/Event_Management/frontend/.env
```

Change whatever localhost URL you find to:

```env
REACT_APP_API_URL=http://<YOUR_EC2_PUBLIC_IP>
# or if the variable name is different, e.g.:
REACT_APP_BACKEND_URL=http://<YOUR_EC2_PUBLIC_IP>
```

> If you have a domain name, use that instead of the bare IP. If you plan to add HTTPS later via Certbot, use `https://yourdomain.com`.

**This must be set before the React build step** — `REACT_APP_*` variables are baked into the build at compile time, not at runtime.

---

## Step 7 — Install Backend Dependencies

```bash
cd /home/ubuntu/Event_Management/backend
npm install
```

---

## Step 8 — Install Frontend Dependencies and Build

```bash
cd /home/ubuntu/Event_Management/frontend
npm install
npm run build
```

If the build runs out of memory on t2.micro, add swap first:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Then re-run `npm run build`.

This creates `frontend/build/` — the compiled static React files.

---

## Step 9 — Check if Backend Serves the React Build

Look at the backend entry file:

```bash
grep -n "static\|build\|production" /home/ubuntu/Event_Management/backend/server.js
```

**If you see `express.static` pointing to the frontend build** — you're good, Express will serve everything.

**If you don't see it** — add it. Open `server.js` (or `index.js`):

```bash
nano /home/ubuntu/Event_Management/backend/server.js
```

Add before `app.listen(...)`:

```javascript
const path = require('path')

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')))
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'))
    })
}
```

---

## Step 10 — Start the Backend with PM2

```bash
sudo npm install -g pm2   # skip if already installed

cd /home/ubuntu/Event_Management/backend
pm2 start server.js --name event-app
# if the entry file is index.js use: pm2 start index.js --name event-app

pm2 save
pm2 startup   # copy and run the printed command
```

Verify it's running:

```bash
pm2 logs event-app
# Look for: Server running on port XXXX + MongoDB connected
```

---

## Step 11 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/event-app
```

Paste (replace port with whatever your backend actually uses):

```nginx
server {
    listen 80;
    server_name <YOUR_EC2_PUBLIC_IP>;

    # Increase if the app handles image uploads
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/event-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 12 — Test It

Open `http://<YOUR_EC2_PUBLIC_IP>` in a browser. You should see the Event Management UI.

If the frontend loads but API calls fail (network errors in browser console), it means the `REACT_APP_API_URL` in the frontend `.env` is wrong. Fix it and rebuild:

```bash
nano /home/ubuntu/Event_Management/frontend/.env
# correct the URL

cd /home/ubuntu/Event_Management/frontend
npm run build

pm2 restart event-app
```

---

## Comparison Table Across All Four Apps

| | Blog | Student | E-Commerce | Event |
|---|---|---|---|---|
| Backend entry | `backend/index.js` | `backend/server.js` | `server.js` (root) | `backend/server.js` |
| `.env` location | repo root | `backend/` | repo root | `backend/` |
| Frontend folder | `frontend/` | `frontend/` | `client/` | `frontend/` |
| Frontend `.env` | ❌ none | ❌ none | ❌ none | ✅ **has own `.env`** |
| Port | 3800 | 5000 | 4000 | likely 5000 |
| PM2 start from | repo root | `backend/` | repo root | `backend/` |
| Extra services | — | — | Stripe | possibly Cloudinary |

The **unique thing about this app** vs the others is the `frontend/.env` with the hardcoded API URL — that must be updated to your EC2 IP before building, otherwise the React app will try to call `localhost:5000` from the user's browser, which will fail.

---

## Useful Commands

```bash
pm2 logs event-app                    # live logs
pm2 restart event-app                 # restart
sudo tail -f /var/log/nginx/error.log # Nginx errors

# Full redeploy after code changes
cd /home/ubuntu/Event_Management
git pull
cd frontend && npm run build
cd ../backend && pm2 restart event-app
```
