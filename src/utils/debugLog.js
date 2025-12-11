const fs = require("fs");
const path = require("path");
const { config } = require("../config");

function writeDebugLog(msg, logFile = "debug_attribution.txt", mode = "a") {
  if (config.local_development) {
    const filePath = __dirname + "/../../" + logFile;
    const content = msg.endsWith("\n") ? msg : msg + "\n";
    if (mode === "w") {
      fs.writeFile(filePath, content, "utf8", (err) => {
        if (err) {
          console.error("[DEBUG] writeFile error:", err.message);
        }
      });
    } else {
      fs.appendFile(filePath, content, "utf8", (err) => {
        if (err) {
          console.error("[DEBUG] appendFile error:", err.message);
        }
      });
    }
  }
}

function createLogger(defaultFileName = "debug_campaign_details.txt") {
  return (msg, level = "info", fileName = defaultFileName) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [${level?.toUpperCase()}] [Talabat] ${msg}`;

    // Write to log file
    writeDebugLog(logMsg, fileName);
    if (!config.local_development)
      if (level === "error") {
        // Log to console based on level
        console.error(logMsg);
      } else if (level === "warn") {
        console.warn(logMsg);
      }
      // if (process.env.DEBUG === "true" || level !== "debug")
      else {
        console.log(logMsg);
      }
  };
}

/**
 * Saves API response data to a JSON file for debugging
 * @param {string} filename - Name of the file (without .json)
 * @param {object} data - Data to save
 * @param {Object} [options] - Additional options
 * @param {string} [options.subDir='responses'] - Subdirectory to save the file in
 * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
 * @param {string} [options.suffix] - Optional suffix to add before the extension
 * @returns {string|null} Path to the saved file or null on error
 */
function saveResponseToFile(filename, data, options = {}) {
  try {
    const { subDir = "responses", overwrite = false, suffix = "" } = options;

    const outputDir = path.join(__dirname, "../../debug", subDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let filePath;
    if (overwrite) {
      // For overwrite, use the exact filename
      filePath = path.join(
        outputDir,
        `${filename}${suffix ? `_${suffix}` : ""}.json`
      );
    } else {
      // For non-overwrite, include timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filePath = path.join(
        outputDir,
        `${filename}_${timestamp}${suffix ? `_${suffix}` : ""}.json`
      );
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`[DEBUG] Response saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving response to file:", error);
    return null;
  }
}

module.exports = { writeDebugLog, createLogger, saveResponseToFile };
