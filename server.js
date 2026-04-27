const express = require("express");
const app = express();

// ✅ Health check (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ❌ TEMP: Disable browser (to stop crash)
app.get("/gia", async (req, res) => {
  const report = req.query.report;

  res.json({
    message: "Server working, browser temporarily disabled",
    report: report
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on " + PORT));
