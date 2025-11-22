# U7BUY Webhook Handler (JavaScript)

Project ready to deploy to Render (or any Node.js hosting).  
Features:
- HTTPS-ready (Render provides HTTPS)
- Validates HMAC-SHA256 signature from U7BUY (configurable)
- Logs every incoming webhook to `logs/webhook.log`
- Sends formatted message to Discord via webhook
- Health endpoint `/health` for monitoring

## Files
- `index.js` — main server
- `package.json` — dependencies & start script
- `logs/` — runtime logs (created automatically)
- `.env.example` — environment variables example

## Environment variables
Create environment variables in Render or your environment:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
U7BUY_SECRET=your_u7buy_shared_secret_here
U7BUY_SIGNATURE_HEADER=x-u7buy-signature
PORT=3000
```

Notes:
- `U7BUY_SECRET` is optional; if provided, the server will validate the HMAC-SHA256 of the raw request body.
- `U7BUY_SIGNATURE_HEADER` defaults to `x-u7buy-signature`. Set it to match the header U7BUY uses.
- Ensure your webhook URL in U7BUY points to `https://<your-render-domain>/webhook`.

## Usage (locally)
1. Install Node.js (>= 16)
2. `npm install`
3. `DISCORD_WEBHOOK_URL=... U7BUY_SECRET=... node index.js`
4. Test with `curl`:
```
curl -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d '{"hello":"world"}'
```

## Deploy to Render
1. Push repo to GitHub.
2. In Render, create a new **Web Service** connected to the repo.
3. Set Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables in Render dashboard.
6. Deploy.
