const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA API Running (Stable RDWB Mode)"
  });
});

app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.status(400).json({
      error: "Report missing"
    });
  }

  try {
    // REAL GIA BACKEND API (this is the key)
    const url = `https://rdwb.gia.edu/?reportno=${report}&locale=en_US&env=prod&USEREG=1&qr=false`;

    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://www.gia.edu",
        "Referer": "https://www.gia.edu/"
      }
    });

    const data = response.data;

    // SAFE EXTRACTION (structure may vary)
    const clarity =
      data?.report?.clarity ||
      data?.clarity ||
      data?.result?.clarity ||
      data?.diamond?.clarity ||
      null;

    res.json({
      report,
      clarity: clarity || "Not Found",
      source: "RDWB API"
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
