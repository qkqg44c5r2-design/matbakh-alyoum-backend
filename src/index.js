/**
 * Matbakh Alyoum – WhatsApp → Google Sheets Webhook
 * READY FOR PRODUCTION
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

/* =========================
   Health Check
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   WhatsApp Webhook (VERIFY)
========================= */
app.get("/webhooks/whatsapp", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* =========================
   WhatsApp Webhook (POST)
========================= */
app.post("/webhooks/whatsapp", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from || "";
    const text = message.text?.body || "";
    const timestamp = new Date(
      parseInt(message.timestamp, 10) * 1000
    ).toISOString();

    // Send to Google Sheets
    if (process.env.SHEETS_WEBHOOK_URL) {
      await axios.post(process.env.SHEETS_WEBHOOK_URL, {
        phone: from,
        message: text,
        received_at: timestamp
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.sendStatus(200);
  }
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
