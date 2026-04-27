const express = require("express");
const axios = require("axios");

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

  try {
    const url = `https://rdwb.gia.edu/?reportno=${report}&locale=en_US&env=prod&USEREG=1&qr=false`;

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = response.data;

    const clarity =
      data?.clarity ||
      data?.report?.clarity ||
      "Not Found";

    res.json({
      report,
      clarity
    });

  } catch (err) {
    res.json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
