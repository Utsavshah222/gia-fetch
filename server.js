const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "GIA Clarity API Running (Puppeteer Stable Mode)"
  });
});

// CLARITY API
app.get("/clarity", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Report number missing" });
  }

  let browser = null;

  try {
    // 🔥 IMPORTANT FIX FOR RENDER / LINUX
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote"
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    const url = `https://www.gia.edu/report-check?locale=en_US&reportno=${report}`;

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // wait a bit for JS rendering
    await page.waitForTimeout(3000);

    // extract clarity
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

// START SERVER
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
