const express = require("express");
const axios = require("axios");
const winston = require("winston");
const fs = require("fs");
const path = require("path");

// =======================================
// LOGGING SETUP
// =======================================
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, "webhook.log") }),
    new winston.transports.Console()
  ],
});

// =======================================
// ENVIRONMENT VARIABLES
// =======================================
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// =======================================
// HEALTH CHECK
// =======================================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// =======================================
// WEBHOOK ENDPOINT (NO SIGNATURE!)
// =======================================
app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    logger.info("Received webhook: " + JSON.stringify(payload));

    // BALAS LANGSUNG KE U7BUY
    res.status(200).send("OK");

    // Format payload untuk Discord
    const payloadString = JSON.stringify(payload, null, 2);
    const truncated = payloadString.length > 1900 
      ? payloadString.substring(0, 1900) + "\n... (truncated)"
      : payloadString;

    // Discord embed message
    const discordMsg = {
      embeds: [
        {
          title: "📩 Webhook U7BUY Diterima",
          description: "Payload berhasil diterima dari API U7BUY",
          fields: [
            {
              name: "Data",
              value: `\`\`\`json\n${truncated}\n\`\`\``
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Kirim ke Discord
    if (DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(DISCORD_WEBHOOK_URL, discordMsg);
      } catch (err) {
        logger.error("Discord error: " + err.message);
      }
    }

  } catch (err) {
    logger.error("Server error: " + err.message);
    try { res.status(500).send("Server error"); } catch {}
  }
});

// =======================================
// START SERVER
// =======================================
app.listen(PORT, () => {
  logger.info("Server berjalan di port " + PORT);
});
