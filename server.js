const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "9a6Q3o...";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "0uZb...";
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const PASSKEY = process.env.MPESA_PASSKEY || "bfb279...";
const CALLBACK_URL = "https://ajira-mpesa-backend.onrender.com/callback";

const SAFARICOM_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Content-Type": "application/json",
  "Accept": "application/json"
};

async function getToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { ...SAFARICOM_HEADERS, Authorization: `Basic ${auth}` } }
  );
  return res.data.access_token;
}

async function stkPush(phone, amount) {
  const token = await getToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString("base64");
  
  let formattedPhone = phone.startsWith("0") ? "254" + phone.slice(1) : phone;
  if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

  const res = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
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
    },
    { headers: { ...SAFARICOM_HEADERS, Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

app.get("/", (req, res) => res.send("Ajira Running - Use POST /stkpush"));

const handleStk = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if (!phone || !amount) return res.status(400).json({ error: "phone and amount required" });
    const data = await stkPush(phone, amount);
    res.json(data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
};

app.post("/stkpush", handleStk);
app.post("/api/stkpush", handleStk);
app.post("/stk", handleStk);
app.post("/callback", (req, res) => { console.log("Callback:", JSON.stringify(req.body)); res.json({ ok: true }); });

app.listen(10000, () => console.log("Running on 10000"));
