const express = require("express");
const axios = require("axios");

const app = express();

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

/* =========================
   GIA SCRAPER API
========================= */
app.get("/gia", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Report number missing" });
  }

  try {
    console.log("Fetching report:", report);

    const apiKey = "04f15187821238376385877391c25996";

    const targetUrl = `https://www.gia.edu/report-check?reportno=${report}`;

    const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(
      targetUrl
    )}&render=true&country_code=us`;

    const response = await axios.get(scraperUrl, {
      timeout: 60000
    });

    const html = response.data;

    console.log("HTML received length:", html.length);

    const get = (id) => {
      const regex = new RegExp(`id="${id}"[^>]*>(.*?)<`, "i");
      const match = html.match(regex);

      return match
        ? match[1].replace(/<[^>]*>/g, "").trim()
        : "Not Found";
    };

    const data = {
      clarity: get("CLARITY_GRADE"),
      color: get("COLOR_GRADE"),
      weight: get("WEIGHT"),
      cut: get("CUT_GRADE"),
      polish: get("POLISH"),
      symmetry: get("SYMMETRY")
    };

    console.log("Parsed data:", data);

    res.json(data);

  } catch (err) {
    console.error("ERROR:", err.message);

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
