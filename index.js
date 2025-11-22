const express = require("express");
const app = express();

// Agar webhook bisa membaca JSON
app.use(express.json());

// Health check (untuk Render)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Webhook endpoint SANGAT SEDERHANA
app.post("/webhook", (req, res) => {
  console.log("Webhook received:", req.body);

  // Kembalikan 200 OK SELALU
  res.status(200).send("OK");
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server berjalan di port", PORT);
});
