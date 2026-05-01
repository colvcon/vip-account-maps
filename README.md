# VIP Account Maps

Dynamic account mapping site for WordPress VIP. Generates scored stakeholder maps from ZoomInfo + Salesforce data, stored in Google Drive, deployed on Vercel.

## Setup

### 1. Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable the **Google Drive API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `https://YOUR-VERCEL-URL.vercel.app/oauth` (and `http://localhost:5173/oauth` for local dev)
7. Copy the Client ID

### 2. Deploy to Vercel

```bash
npm install
```

Option A — Vercel CLI:
```bash
npm i -g vercel
vercel
```

Option B — drag and drop:
Go to vercel.com/new, connect your GitHub repo or drag this folder.

### 3. Set Environment Variable

In Vercel dashboard → Settings → Environment Variables:
```
VITE_GOOGLE_CLIENT_ID = your_client_id_here
```

Redeploy after setting the variable.

### 4. First Login

1. Open the site
2. Paste your Anthropic API key (stored locally in browser, never sent to Vercel)
3. Connect Google Drive (OAuth popup)
4. You're in

## Adding Maps

**From the site:** Click "New Map" → type a domain → Claude runs the full account mapping workflow automatically.

**From Claude:** Run the account mapper skill in Claude chat. It will auto-save to Drive and appear on the site immediately.

## How it works

- Account maps are stored as JSON files in a Google Drive folder called "VIP Account Maps"
- The app reads/writes directly to Drive via the Google Drive REST API (no backend needed)
- Claude API is called client-side using your Anthropic key (stored in localStorage)
- ZoomInfo and Glean MCP servers are called via Claude's MCP client capability

## Stack

- React 18 + React Router
- Vite (build)
- Google Drive REST API (storage)
- Anthropic Claude API + MCP (account mapping)
- Vercel (hosting)
