const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/gia", async (req, res) => {
  const report = req.query.report;

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new"
    });

    const page = await browser.newPage();

    await page.goto(
      `https://www.gia.edu/report-check?reportno=${report}`,
      { waitUntil: "networkidle2" }
    );

    await new Promise(r => setTimeout(r, 4000));

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

    res.json(data);

  } catch (err) {
    res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running"));
