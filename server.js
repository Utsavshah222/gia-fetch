const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

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
        "--no-zygote"
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
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

    // 🔥 EXTRA SAFE WAIT
    await page.waitForTimeout(5000);

    await page.waitForSelector("#CLARITY_GRADE", {
      timeout: 20000
    }).catch(() => {});

    const clarity = await page.evaluate(() => {
      const el = document.querySelector("#CLARITY_GRADE");
      return el ? el.innerText.trim() : null;
    });

    await browser.close();

    return res.json({
      report,
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
  console.log("Server running on", PORT);
});
