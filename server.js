const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "9a6Q3o...";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "0uZb...";
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const PASSKEY = process.env.MPESA_PASSKEY || "bfb279...";
const CALLBACK_URL = "https://ajira-mpesa-backend.onrender.com/callback";

const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Content-Type": "application/json"
};

async function getToken() {
  const auth = Buffer.from(CONSUMER_KEY + ":" + CONSUMER_SECRET).toString("base64");
  const r = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { ...HEADERS, Authorization: "Basic " + auth }
  });
  return r.data.access_token;
}

app.get("/", (req, res) => res.send("Ajira Running - Use POST /stkpush"));

app.post("/stkpush", async (req, res) => {
  try {
    const phone = req.body.phone;
    const amount = req.body.amount;
    if (!phone || !amount) return res.status(400).json({ error: "phone and amount required" });

    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString("base64");
    let formattedPhone = phone.startsWith("0") ? "254" + phone.slice(1) : phone;
    if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

    const r = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: "Ajira",
      TransactionDesc: "Payment"
    }, {
      headers: { ...HEADERS, Authorization: "Bearer " + token }
    });
    res.json(r.data);
  } catch (e) {
    console.log(e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

app.post("/api/stkpush", (req, res) => { req.url = "/stkpush"; app.handle(req, res); });
app.post("/stk", (req, res) => { req.url = "/stkpush"; app.handle(req, res); });
app.post("/callback", (req, res) => { console.log(req.body); res.json({ ok: true }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on " + PORT));
