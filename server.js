const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA API Running (ScraperAPI Mode)"
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
    // GIA RDWB URL
    const targetUrl = `https://rdwb.gia.edu/?reportno=${report}&locale=en_US&env=prod&USEREG=1&qr=false`;

    // ScraperAPI wrapper
    const scraperUrl = `https://api.scraperapi.com/?api_key=04f15187821238376385877391c25996&url=${encodeURIComponent(
      targetUrl
    )}&render=true`;

    const response = await axios.get(scraperUrl, {
      timeout: 60000
    });

    const data = response.data;

    // SAFE EXTRACTION (because structure may change)
    const clarity =
      data?.data?.report?.clarity ||
      data?.report?.clarity ||
      data?.clarity ||
      extractFromText(data, "CLARITY") ||
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

// fallback helper (if HTML comes instead of JSON)
function extractFromText(data, key) {
  try {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    const regex = new RegExp(`${key}[^A-Z0-9]*([A-Z0-9]+)`, "i");
    const match = text.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
