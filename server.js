const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

/* =========================
   GIA FETCH API (STABLE)
========================= */
app.get("/gia", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Missing report number" });
  }

  try {
    console.log("Fetching report:", report);

    const url = `https://www.gia.edu/report-check?reportno=${report}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      },
      timeout: 30000
    });

    const html = response.data;

    console.log("HTML received length:", html.length);

    const $ = cheerio.load(html);

    const getValue = (id) => {
      return $(`#${id}`).text().trim() || "Not Found";
    };

    const data = {
      clarity: getValue("CLARITY_GRADE"),
      color: getValue("COLOR_GRADE"),
      weight: getValue("WEIGHT"),
      cut: getValue("CUT_GRADE"),
      polish: getValue("POLISH"),
      symmetry: getValue("SYMMETRY")
    };

    console.log("Parsed Data:", data);

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
