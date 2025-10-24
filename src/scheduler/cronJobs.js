const cron = require("node-cron");
const axios = require("axios");

const { config } = require("../config");
const { port } = config;
const BASE_URL = `http://localhost:${port}/api/v1`;

// Helper: format current time in IST
function nowIST() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

// Attribution: 8:50am and 2:50pm every day (IST)
function getDateRange() {
  const today = new Date();
  const end_date = today.toISOString().slice(0, 10); // today
  const past = new Date();
  past.setDate(today.getDate() - 10);
  const start_date = past.toISOString().slice(0, 10); // 14 days ago
  return { start_date, end_date };
}

// Attribution: 9:00am and 3:00pm every day (IST)

cron.schedule(
  "0 9,15 * * *",
  async () => {
    try {
      const { start_date, end_date } = getDateRange();
      console.log("[CRON] Triggering /attribution at", nowIST(), "with", {
        start_date,
        end_date,
      });
      await axios.post(`${BASE_URL}/attribution/populate?clientId=M18YZK7J`, {
        start_date,
        end_date,
      });
      console.log("[CRON] /attribution triggered successfully at", nowIST());
    } catch (err) {
      console.error("[CRON] Error triggering /attribution:", err.message);
    }
  },
  {
    timezone: "Asia/Kolkata", // Indian Standard Time
  }
);

// Structure: every 2 hours except 9–10am and 3–4pm (IST)
cron.schedule(
  "0 0,2,4,6,8,12,14,18,20,22 * * *",
  async () => {
    try {
      const { start_date, end_date } = getDateRange();
      console.log("[CRON] Triggering /structure at", nowIST(), "with", {
        start_date,
        end_date,
      });
      await axios.post(`${BASE_URL}/structure/campaigns?clientId=M18YZK7J`, {
        start_date,
        end_date,
      });
      console.log("[CRON] /structure triggered successfully at", nowIST());
    } catch (err) {
      console.error("[CRON] Error triggering /structure:", err.message);
    }
  },
  {
    timezone: "Asia/Kolkata", // Indian Standard Time
  }
);
