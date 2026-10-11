const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const CONSUMER_KEY = process.env.CONSUMER_KEY || "Bji0g8yfxmLScfm3PZ2PXkANvG0A4Dj...";
const CONSUMER_SECRET = process.env.CONSUMER_SECRET || "vGoXZKfKdRYvFpdNbbQ8ELbRm6y...";
const SHORTCODE = "174379";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const CALLBACK_URL = "https://ajira-mpesa-backend.onrender.com/callback";

async function getToken(){
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const {data} = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` }
  });
  return data.access_token;
}

async function handleStk(req,res){
  try{
    let {phone, amount} = req.body;
    console.log("STK Request:", phone, amount);
    if(!phone) return res.status(400).json({error:"phone missing"});
    let formatted = phone.toString();
    if(formatted.startsWith("0")) formatted = "254"+formatted.slice(1);
    if(formatted.startsWith("+")) formatted = formatted.slice(1);
    
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,"").slice(0,14);
    const password = Buffer.from(SHORTCODE+PASSKEY+timestamp).toString("base64");
    
    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount || 1,
      PartyA: formatted,
      PartyB: SHORTCODE,
      PhoneNumber: formatted,
      CallBackURL: CALLBACK_URL,
      AccountReference: "Ajira",
      TransactionDesc: "Ajira Job"
    };
    const {data} = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success", data);
    res.json(data);
  }catch(e){
    console.error(e.response?.data || e.message);
    res.status(500).json({error: e.response?.data || e.message});
  }
}

// HIZI NDIZO LOVABLE INATAFUTA!
app.post("/stkpush", handleStk);
app.post("/api/stkpush", handleStk);
app.post("/stk", handleStk);

app.get("/", (req,res)=>res.send("Ajira Running - Use POST /stkpush"));
app.post("/callback", (req,res)=>{
  console.log("Callback", JSON.stringify(req.body));
  res.json({ResultCode:0, ResultDesc:"Accepted"});
});

app.listen(10000, ()=>console.log("Running on 10000"));
