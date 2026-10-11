const express=require('express');const axios=require('axios');const cors=require('cors');const app=express();app.use(cors());app.use(express.json());
const CONSUMER_KEY="Bji0g8yfxmLScfm3PZ2PXkANvGOA4DjzxhHOk0UUIL8yWDSZ";
const CONSUMER_SECRET="vGoXZKfKdRYvfpdNbbQ8ELbRm6yvG9ZdpeIT9hDZfV6UGg1bh5dRNC2vQZd7vy3u";
const SHORTCODE="174379";const PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
async function getToken(){const a=Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');const r=await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",{headers:{Authorization:`Basic ${a}`}});return r.data.access_token;}
app.post('/stk',async(req,res)=>{const{phone,amount}=req.body;try{const token=await getToken();const timestamp=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);const password=Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');const d={BusinessShortCode:SHORTCODE,Password:password,Timestamp:timestamp,TransactionType:"CustomerPayBillOnline",Amount:amount,PartyA:phone,PartyB:SHORTCODE,PhoneNumber:phone,CallBackURL:"https://mydomain.com/callback",AccountReference:"AjiraWorld",TransactionDesc:"Payment"};const resp=await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",d,{headers:{Authorization:`Bearer ${token}`}});res.json(resp.data);}catch(e){res.status(500).json({error:e.response?.data||e.message});}});
app.get('/',(req,res)=>res.send('Ajira Running'));
app.listen(10000,()=>console.log("Running"));
