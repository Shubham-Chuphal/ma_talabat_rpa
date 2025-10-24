// Write date range to debug log

// function getShopeeTimestamps(startDateStr, endDateStr) {
//   // Parse "YYYY-MM-DD" string into Date objects as if they were in GMT+8
//   // Handle missing or invalid startDateStr
//   const start = startDateStr
//     ? new Date(`${startDateStr}T00:00:00+08:00`)
//     : new Date();

//   const startTimestamp = Math.floor(start.getTime() / 1000);

//   let endTimestamp = 0;
//   if (endDateStr && endDateStr !== 0) {
//     const end = new Date(`${endDateStr}T23:59:59+08:00`);
//     endTimestamp = Math.floor(end.getTime() / 1000);
//   }

//   return {
//     start_time: startTimestamp,
//     end_time: endTimestamp,
//   };
// }

function getEntityInsertMapFromConfig(CONFIG) {
  const map = [];
  for (const adTypeObj of CONFIG) {
    const adType = Object.keys(adTypeObj)[0];
    for (const config of adTypeObj[adType]) {
      // Main campaign entity
      if (config.model) {
        map.push({ model: config.model, key: "campaigns" });
      }
      // Other entities
      if (config.otherFetch) {
        for (const fetchConf of config.otherFetch) {
          // Only add if model key exists
          if (fetchConf.model && fetchConf.outputKey) {
            map.push({
              model: fetchConf.model,
              key: fetchConf.outputKey,
            });
          }
        }
      }
    }
  }
  return map;
}

function getTalabatTimestamps(startDateStr, endDateStr) {
  let startTimestamp, endTimestamp;
  const timezoneOffset = "+05:30"; // Set the desired timezone offset

  // Handle startDate
  if (
    typeof startDateStr === "string" &&
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})?)?$/.test(
      startDateStr
    )
  ) {
    // If the date string already has time and timezone, use it as is, otherwise add default time and timezone
    const startDate = startDateStr.includes("T")
      ? new Date(startDateStr)
      : new Date(`${startDateStr}T00:00:00${timezoneOffset}`);

    if (!isNaN(startDate)) {
      startTimestamp = Math.floor(startDate.getTime() / 1000);
    } else {
      // fallback to now if invalid
      startTimestamp = Math.floor(Date.now() / 1000);
    }
  } else {
    // fallback to now if missing or invalid
    startTimestamp = Math.floor(Date.now() / 1000);
  }

  // Handle endDate
  if (endDateStr === 0) {
    endTimestamp = 0;
  } else if (
    typeof endDateStr === "string" &&
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})?)?$/.test(
      endDateStr
    )
  ) {
    // If the date string already has time and timezone, use it as is, otherwise add end of day time and timezone
    const endDate = endDateStr.includes("T")
      ? new Date(endDateStr)
      : new Date(`${endDateStr}T23:59:59${timezoneOffset}`);

    if (!isNaN(endDate)) {
      endTimestamp = Math.floor(endDate.getTime() / 1000);
    } else {
      throw new Error("Invalid endDate format");
    }
  } else if (endDateStr !== undefined && endDateStr !== null) {
    throw new Error("Invalid endDate value — must be YYYY-MM-DD or 0");
  } else {
    endTimestamp = 0; // fallback to 0 if not provided
  }

  return {
    start_time: startTimestamp,
    end_time: endTimestamp,
  };
}

function getDateRangeArray(start, end) {
  const arr = [];
  let dt = new Date(start);
  const endDt = new Date(end);
  while (dt <= endDt) {
    arr.push(dt.toISOString().slice(0, 10));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

function* filterPairs(campaignStructure) {
  for (const adTypeObj of campaignStructure) {
    const adType = Object.keys(adTypeObj)[0];
    const adFilters = adTypeObj[adType];
    if (Array.isArray(adFilters)) {
      for (const filter of adFilters) {
        yield { adType, filter, subType: null };
      }
    } else if (typeof adFilters === "object" && adFilters !== null) {
      for (const [subType, filter] of Object.entries(adFilters)) {
        yield { adType, filter, subType };
      }
    }
  }
}
function generateUUIDv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hhmmToSeconds(hhmm) {
  if (typeof hhmm !== "string" || !/^\d{1,2}:\d{2}$/.test(hhmm)) {
    throw new Error(`Invalid time format: "${hhmm}". Use HH:MM`);
  }

  const [h, m] = hhmm.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time: "${hhmm}". Must be between 00:00 and 23:59`);
  }

  return h * 3600 + m * 60;
}

function formatStartDate(input) {
  // Parse "DD/MM/YYYY HH:mm:ss" to Date object
  const [datePart] = input.split(" ");
  const [day, month, year] = datePart.split("/");

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // "YYYY-MM-DD"
}

module.exports = {
  getEntityInsertMapFromConfig,
  getTalabatTimestamps,
  getDateRangeArray,
  generateUUIDv4,
  filterPairs,
  hhmmToSeconds,
  formatStartDate,
};
