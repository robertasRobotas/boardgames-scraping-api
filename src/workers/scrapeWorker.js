const { workerData, parentPort } = require("worker_threads");
const axios = require("axios");
const parser = require("../utils/parser");

const REQUEST_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const { urls } = workerData;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    try {
      const response = await axios.get(url, {
        headers: REQUEST_HEADERS,
        timeout: REQUEST_TIMEOUT_MS,
      });

      const gameData = parser.parseGamePage(response.data);

      if (gameData) {
        parentPort.postMessage({ type: "game", data: gameData, url });
      } else {
        parentPort.postMessage({ type: "skip", url });
      }
    } catch (error) {
      parentPort.postMessage({ type: "error", url, message: error.message });
    }

    if (i < urls.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  parentPort.postMessage({ type: "done" });
}

run();
