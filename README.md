# Dollar Rate Monitor

Telegram bot that fetches the exchange rate from [DollarHouse](https://app.dollarhouse.pe/) and notifies you when it drops below a configured threshold.

## Bot commands

- `/start` — Welcome message
- `/help` — Help
- `/dolar` — Get current exchange rate (buy/sell)

## Environment variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token (get it from [@BotFather](https://t.me/BotFather)) |
| `TELEGRAM_CHAT_ID` | Your Chat ID to receive alerts (get it from [@userinfobot](https://t.me/userinfobot)) |
| `PRICE_LIMIT` | Threshold in soles; if the buy rate is below this, you get an alert (e.g. `3.40`) |

## Deploy on Railway

### 1. Push the project to GitHub

If the project is not in Git yet:

```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub and link it:
git remote add origin https://github.com/YOUR_USERNAME/dollar-rate-monitor.git
git branch -M main
git push -u origin main
```

### 2. Create a project on Railway

1. Go to [railway.app](https://railway.app) and sign in (with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Select the `dollar-rate-monitor` repository and authorize Railway if prompted.
4. Railway will detect Node.js and use the project’s `nixpacks.toml` (build + start).

### 3. Set environment variables

In your Railway project:

1. Open the **service** (the deployment tile).
2. Go to the **Variables** tab (or **Settings** → **Variables**).
3. Add:

   - `TELEGRAM_BOT_TOKEN` = token from @BotFather  
   - `TELEGRAM_CHAT_ID` = your Chat ID (number from @userinfobot)  
   - `PRICE_LIMIT` = e.g. `3.40`

4. Save; Railway will redeploy if needed.

### 4. (Optional) Manual build and start commands

If you don’t use `nixpacks.toml` or want to set them in the UI:

- **Build Command:** `pnpm run build` (or `npm run build` if using npm).
- **Start Command:** `node dist/index.js` (or `pnpm start`).

### 5. Verify the deployment

- In Railway, under **Deployments**, the build should be green and the service running.
- In Telegram: send `/start` or `/dolar` to your bot. It should reply if everything is set up correctly.
- Alerts are sent every 20 minutes when the buy rate is below `PRICE_LIMIT`.

---

## Local development

```bash
pnpm install
pnpm run dev    # Bot in development mode (reloads on code changes)
# or
pnpm run build && pnpm start
```
