const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA Clarity API Running (RDWB Direct Mode)"
  });
});

// MAIN API
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.status(400).json({
      error: "Report missing"
    });
  }

  try {
    const url = `https://rdwb.gia.edu/?reportno=${report}&locale=en_US&env=prod&USEREG=1&qr=false`;

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.gia.edu/"
      }
    });

    const data = response.data;

    // Debug: sometimes structure differs
    const clarity =
      data?.data?.clarity ||
      data?.clarity ||
      data?.report?.clarity ||
      "Not Found";

    return res.json({
      report,
      clarity
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
