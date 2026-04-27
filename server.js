const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA Clarity API Running (Puppeteer Mode)"
  });
});

// MAIN API
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Report number missing" });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    // Real browser headers
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    const url = `https://www.gia.edu/report-check?locale=en_US&reportno=${report}`;

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Wait for clarity element
    await page.waitForSelector("#CLARITY_GRADE", { timeout: 20000 }).catch(() => {});

    // Extract data inside browser context
    const clarity = await page.evaluate(() => {
      const el = document.querySelector("#CLARITY_GRADE");
      return el ? el.innerText.trim() : null;
    });

    await browser.close();

    return res.json({
      report: report,
      clarity: clarity || "Not Found"
    });

  } catch (err) {
    if (browser) await browser.close();

    return res.json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
