const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/gia", async (req, res) => {
  const report = req.query.report;

  try {
    console.log("START REQUEST:", report);

    const browser = await chromium.launch({
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    console.log("Opening page...");

    await page.goto(
      `https://www.gia.edu/report-check?reportno=${report}`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );

    console.log("Waiting for selector...");

    await page.waitForSelector("#CLARITY_GRADE", { timeout: 15000 });

    console.log("Extracting data...");

    const data = await page.evaluate(() => {
      const get = (id) =>
        document.querySelector(`#${id}`)?.innerText || "";

      return {
        clarity: get("CLARITY_GRADE"),
        color: get("COLOR_GRADE"),
        weight: get("WEIGHT"),
        cut: get("CUT_GRADE"),
        polish: get("POLISH"),
        symmetry: get("SYMMETRY")
      };
    });

    await browser.close();

    console.log("SUCCESS:", data);

    res.json(data);

  } catch (err) {
    console.error("ERROR:", err);

    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
