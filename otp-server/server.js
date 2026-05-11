const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// AWS config (later fill)
AWS.config.update({
  region: "ap-south-1", // India
  accessKeyId: "YOUR_ACCESS_KEY",
  secretAccessKey: "YOUR_SECRET_KEY",
});

const sns = new AWS.SNS();

// Send OTP API
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await sns
      .publish({
        Message: `Your OTP is ${otp}`,
        PhoneNumber: phone, // +91XXXXXXXXXX
      })
      .promise();

    console.log("OTP:", otp);

    res.json({ success: true, otp }); // (for testing)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});