const express = require("express");
const { chromium } = require("playwright");

const app = express();

/* ===============================
   HEALTH CHECK (IMPORTANT)
================================ */
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

/* ===============================
   GIA FETCH API
================================ */
app.get("/gia", async (req, res) => {
  const report = req.query.report;

  if (!report) {
    return res.json({ error: "Report number missing" });
  }

  let browser;

  try {
    console.log("🔹 Request received:", report);

    // Launch browser
    browser = await chromium.launch({
      args: ["--no-sandbox"],
      timeout: 30000
    });

    const page = await browser.newPage();

    console.log("🌐 Opening GIA page...");

    await page.goto(
      `https://www.gia.edu/report-check?reportno=${report}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    console.log("⏳ Waiting for data...");

    // Wait for clarity field (main trigger)
    await page.waitForSelector("#CLARITY_GRADE", { timeout: 20000 });

    console.log("📊 Extracting data...");

    const data = await page.evaluate(() => {
      const get = (id) =>
        document.querySelector(`#${id}`)?.innerText || "Not Found";

      return {
        clarity: get("CLARITY_GRADE"),
        color: get("COLOR_GRADE"),
        weight: get("WEIGHT"),
        cut: get("CUT_GRADE"),
        polish: get("POLISH"),
        symmetry: get("SYMMETRY")
      };
    });

    console.log("✅ SUCCESS:", data);

    res.json(data);

  } catch (err) {
    console.error("❌ ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  } finally {
    if (browser) {
      await browser.close();
      console.log("🛑 Browser closed");
    }
  }
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
