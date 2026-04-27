const axios = require("axios");

const API_KEY = "04f15187821238376385877391c25996";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    const res = await axios.get(url, { timeout: 60000 });

    if (res.data.includes("CLARITY_GRADE")) {
      return res.data;
    }

    console.log("Retrying render...", i + 1);
    await sleep(3000);
  }

  return null;
}

app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) return res.json({ error: "missing report" });

  try {
    const targetUrl = `https://www.gia.edu/report-check?locale=en_US&reportno=${report}`;

    const scraperUrl = `https://api.scraperapi.com/?api_key=${API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

    const html = await fetchWithRetry(scraperUrl);

    if (!html) {
      return res.json({
        report,
        clarity: "Not Found (render failed)"
      });
    }

    const match = html.match(
      /id=["']CLARITY_GRADE["'][^>]*>([^<]+)</i
    );

    const clarity = match ? match[1].trim() : "Not Found";

    res.json({ report, clarity });

  } catch (err) {
    res.json({ error: err.message });
  }
});
