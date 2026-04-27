const express = require("express");
const axios = require("axios");

const app = express();

const API_KEY = "04f15187821238376385877391c25996";

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send("GIA Clarity API Running ✅");
});

/* =========================
   GET CLARITY ONLY
========================= */
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Missing report number" });
  }

  try {
    const targetUrl = `https://www.gia.edu/report-check?locale=en_US&reportno=${report}`;

    const scraperUrl = `https://api.scraperapi.com/?api_key=${API_KEY}&url=${encodeURIComponent(
      targetUrl
    )}&render=true`;

    const response = await axios.get(scraperUrl, {
      timeout: 60000
    });

    const html = response.data;

    // Extract ONLY clarity safely
    const match = html.match(
      /id=["']CLARITY_GRADE["'][^>]*>([^<]+)</i
    );

    const clarity = match ? match[1].trim() : "Not Found";

    console.log("Clarity:", clarity);

    res.json({
      report: report,
      clarity: clarity
    });

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
