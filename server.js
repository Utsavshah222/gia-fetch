const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA Scraper API Running (ScraperAPI Mode)"
  });
});

// MAIN API
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.status(400).json({ error: "Report missing" });
  }

  try {
    // 🔑 YOUR SCRAPERAPI KEY HERE
    const SCRAPER_API_KEY = "04f15187821238376385877391c25996";

    const targetUrl = `https://rdwb.gia.edu/?reportno=${report}&locale=en_US&env=prod&USEREG=1&qr=false`;

    const url = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;

    const response = await axios.get(url, {
      timeout: 30000
    });

    const data = response.data;

    // Try multiple possible paths (GIA response changes sometimes)
    const clarity =
      data?.clarity ||
      data?.report?.clarity ||
      data?.result?.clarity ||
      null;

    if (!clarity) {
      return res.json({
        report,
        clarity: "Not Found",
        raw: data
      });
    }

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
