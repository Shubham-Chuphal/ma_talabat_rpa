const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { config } = require("../config");
const axios = require("axios");
const Papa = require("papaparse");
const { writeDebugLog } = require("../utils/debugLog");
const { formatStartDate } = require("./index");
// AWS S3 config
const s3 = new S3Client({
  region: config?.aws?.region, // update region
  credentials: {
    accessKeyId: config?.aws?.accessKeyId, // load from env
    secretAccessKey: config?.aws?.secretAccessKey,
  },
});

async function downloadCsvFiles(results) {
  writeDebugLog(
    `[DEBUG][downloadCsvFiles] Called with results: ${JSON.stringify(
      results.map((r) => r.store)
    )}`,
    "debug_attribution.txt"
  );
  for (const result of results) {
    if (!result.downloadUrl || !result.cookieString) {
      writeDebugLog(
        `[DEBUG][downloadCsvFiles] Skipping store ${result.store}: downloadUrl or cookieString missing`,
        "debug_attribution.txt"
      );
      continue;
    }
    if (result.downloadUrl && result.cookieString) {
      try {
        const fileText = await axios.get(
          `https://seller.talabat.com.my${result.downloadUrl}`,
          {
            headers: { Cookie: result.cookieString },
            responseType: "text",
          }
        );
        result.csvContent = fileText.data;
        writeDebugLog(
          `[DEBUG][downloadCsvFiles] Downloaded CSV for ${result.store} (downloadUrl: ${result.downloadUrl})`,
          "debug_attribution.txt"
        );
        console.log(`[${result.store}] CSV downloaded`);
      } catch (err) {
        writeDebugLog(
          `[DEBUG][downloadCsvFiles] Download failed for ${result.store}: ${err.message}`,
          "debug_attribution.txt"
        );
        console.error(`[${result.store}] Download failed: ${err.message}`);
        result.csvContent = null;
      }
    }
  }
  return results;
}

function getDateTimeStrings() {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  return { date, time };
}

function convertRowsToCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const csvLines = [];

  // Add header row
  csvLines.push(headers.join(","));

  // Add data rows
  for (const row of rows) {
    const rowValues = headers.map((header) => {
      const value = row[header];
      return typeof value === "string" && value.includes(",")
        ? `"${value}"`
        : value;
    });
    csvLines.push(rowValues.join(","));
  }

  return csvLines.join("\n");
}

async function uploadCsvToS3(csvContent, dbName, modelName) {
  if (!csvContent) {
    console.warn(`No CSV content to upload for model: ${modelName}`);
    return;
  }

  const { date, time } = getDateTimeStrings();
  // S3 Path: reports/{dbName}/{date}/{modelName}_{time}.csv
  const s3Key = `reports/${dbName}/${date}/${modelName}_${time}.csv`;

  // Resolve bucket from env with sensible fallback
  const bucketName = process.env.TALABAT_S3_BUCKET || "talabat-data";

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: s3Key,
        Body: csvContent,
        ContentType: "text/csv",
      },
    });

    await upload.done();
    const msg = `Uploaded ${modelName} CSV to s3://${bucketName}/${s3Key}`;
    console.log(msg);
    writeDebugLog(`[DEBUG_ATTRIBUTION.TXT] ${msg}`, "debug_attribution.txt");
  } catch (err) {
    const emsg = `[Talabat] [ERROR] ${err.name || "S3Error"}: ${err.message}`;
    console.error(emsg);
    writeDebugLog(`[DEBUG_ATTRIBUTION.TXT] ${emsg}`, "debug_attribution.txt");
    throw err;
  }
}

module.exports = {
  downloadCsvFiles,
  convertRowsToCsv,
  uploadCsvToS3,
};
