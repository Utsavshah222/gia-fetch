const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

// Home route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA Clarity API Running"
  });
});

// CLARITY API
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Report missing" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    const url = `https://www.gia.edu/report-check?locale=en_US&reportno=${report}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // WAIT for clarity element (VERY IMPORTANT)
    await page.waitForSelector("#CLARITY_GRADE", {
      timeout: 30000
    });

    // Extract ONLY clarity
    const clarity = await page.$eval("#CLARITY_GRADE", el =>
      el.innerText.trim()
    );

    await browser.close();

    return res.json({
      report,
      clarity
    });

  } catch (err) {
    if (browser) await browser.close();

    return res.json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
