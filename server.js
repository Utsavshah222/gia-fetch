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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    );

    let reportData = null;

    page.on("response", async (response) => {
      try {
        const url = response.url();
        if (url.includes("rdwb.gia.edu") || url.includes("reportno")) {
          const json = await response.json();
          if (json) reportData = json;
        }
      } catch (_) {}
    });

    await page.goto(
      `https://www.gia.edu/report-check?reportno=${report}`,
      { waitUntil: "networkidle2", timeout: 55000 }
    );

    await new Promise((r) => setTimeout(r, 3000));

    if (!reportData) {
      reportData = await page.evaluate(() => {
        const get = (sel) =>
          document.querySelector(sel)?.innerText?.trim() || null;
        return {
          clarity_grade: get('[class*="clarity"]'),
          color_grade:   get('[class*="color-grade"]'),
          carat_weight:  get('[class*="carat"]'),
          cut_grade:     get('[class*="cut-grade"]'),
          shape:         get('[class*="shape"]'),
          polish:        get('[class*="polish"]'),
          symmetry:      get('[class*="symmetry"]'),
          fluorescence:  get('[class*="fluorescence"]'),
        };
      });
    }

    await browser.close();
    const result = { report, data: reportData, source: "puppeteer" };
    cache.set(report, result);
    res.json(result);

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
