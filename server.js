const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8080;
const cache = new Map();

app.get("/", (_, res) => res.json({ status: "GIA API Running" }));

app.get("/clarity", async (req, res) => {
  const report = req.query.report;
  if (!report) return res.status(400).json({ error: "Report missing" });

  if (cache.has(report)) {
    return res.json({ ...cache.get(report), cached: true });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    let reportData = null;

    page.on("response", async (response) => {
      try {
        const url = response.url();
        if (
          url.includes("rdwb.gia.edu") ||
          url.includes("report-results-api.gia.edu") ||
          url.includes("reportno")
        ) {
          const json = await response.json();
          if (json) reportData = json;
        }
      } catch (_) {}
    });

    await page.goto(
      `https://www.gia.edu/report-check?reportno=${report}`,
      { waitUntil: "networkidle2", timeout: 55000 }
    );

    // Wait extra 3 seconds for JS to finish loading data
    await new Promise((r) => setTimeout(r, 3000));

    // Fallback: scrape DOM if API interception didn't work
    if (!reportData) {
      reportData = await page.evaluate(() => {
        const getText = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.innerText.trim() : null;
        };
        return {
          report_number: getText('[class*="report-number"]'),
          report_date:   getText('[class*="report-date"]'),
          report_type:   getText('[class*="report-type"]'),
          shape:         getText('[class*="shape"]'),
          carat_weight:  getText('[class*="carat"]'),
          color_grade:   getText('[class*="color-grade"], [class*="color_grade"]'),
          clarity_grade: getText('[class*="clarity-grade"], [class*="clarity_grade"]'),
          cut_grade:     getText('[class*="cut-grade"], [class*="cut_grade"]'),
          polish:        getText('[class*="polish"]'),
          symmetry:      getText('[class*="symmetry"]'),
          fluorescence:  getText('[class*="fluorescence"]'),
        };
      });
    }

    await browser.close();

    const result = { report, data: reportData, source: "puppeteer" };
    cache.set(report, result);

    return res.json(result);

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
