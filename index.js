const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const winston = require("winston");
const fs = require("fs");
const path = require("path");

// ----- Logger setup -----
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

// ----- Environment -----
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const U7BUY_SECRET = process.env.U7BUY_SECRET || "";
const SIGNATURE_HEADER = process.env.U7BUY_SIGNATURE_HEADER || "x-u7buy-signature";
const PORT = process.env.PORT || 3000;

// ----- Signature helper -----
function safeCompare(a, b) {
  try {
    const A = Buffer.from(a);
    const B = Buffer.from(b);
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

// ----- Express setup -----
const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Webhook
app.post("/webhook", async (req, res) => {
  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const signature = req.get(SIGNATURE_HEADER) || "";

    // Validate signature
    if (U7BUY_SECRET) {
      const expected = crypto.createHmac("sha256", U7BUY_SECRET).update(rawBody).digest("hex");
      if (!safeCompare(expected, signature)) {
        logger.warn("Invalid Signature");
        return res.status(401).send("Invalid signature");
      }
    }

    const payloadString = JSON.stringify(req.body);
    logger.info("Received webhook: " + payloadString);

    // Respond immediately for U7BUY requirement
    res.status(200).send("OK");

    const truncated = payloadString.length > 1900
      ? payloadString.slice(0, 1900) + "\n... (truncated)"
      : payloadString;

    // Discord embed message
    const discordMsg = {
      embeds: [
        {
          title: "📩 Webhook U7BUY Diterima",
          description: "Payload diterima dari U7BUY",
          fields: [
            { name: "Signature Valid", value: U7BUY_SECRET ? "Yes" : "No", inline: true },
            {
              name: "Data",
              value: `\`\`\`json
${truncated}
\`\`\``
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Send to Discord
    if (DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(DISCORD_WEBHOOK_URL, discordMsg, {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        logger.error("Discord send error: " + err.message);
      }
    }

  } catch (err) {
    logger.error("Error: " + err.message);
    try { res.status(500).send("Server error"); } catch {}
  }
});

// Start server
app.listen(PORT, () => logger.info("Server berjalan di port " + PORT));
