const axios = require("axios");
const os = require("os");
const path = require("path");
const { Worker } = require("worker_threads");
const parser = require("../utils/parser");

const BASE_URL = "https://boardgamegeek.com";
const LISTING_PATH = "/browse/boardgame/page";
const GAMES_PER_PAGE = 100;
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

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: REQUEST_HEADERS,
    timeout: REQUEST_TIMEOUT_MS,
  });

  return response.data;
}

async function scrapeListingPages(count) {
  const pagesNeeded = Math.ceil(count / GAMES_PER_PAGE);
  const allLinks = [];

  for (let page = 1; page <= pagesNeeded; page++) {
    const url = `${BASE_URL}${LISTING_PATH}/${page}`;

    console.log(`Scraping listing page ${page}/${pagesNeeded}...`);

    const html = await fetchPage(url);
    const links = parser.parseListingPage(html);

    allLinks.push(...links);

    if (page < pagesNeeded) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return allLinks.slice(0, count);
}

async function scrapeGamePage(url) {
  const html = await fetchPage(url);
  const gameData = parser.parseGamePage(html);

  if (!gameData) {
    console.warn(`Could not parse game data from: ${url}`);
    return null;
  }

  return gameData;
}

function chunkArray(arr, n) {
  const chunks = Array.from({ length: n }, () => []);
  arr.forEach((item, i) => chunks[i % n].push(item));
  return chunks;
}

async function scrapeGames(count, onGameScraped) {
  const gameLinks = await scrapeListingPages(count);

  console.log(`Found ${gameLinks.length} game links. Scraping details...`);

  const cpuCount = os.cpus().length;
  const workerCount = Math.max(1, Math.floor(cpuCount * 0.6));

  console.log(
    `Spawning ${workerCount} worker threads (${cpuCount} CPUs available, targeting 60%)...`,
  );

  const chunks = chunkArray(gameLinks, workerCount);
  const games = [];
  let scraped = 0;

  // Serialize onGameScraped calls to prevent concurrent file writes
  let saveChain = Promise.resolve();

  await new Promise((resolve, reject) => {
    let completedWorkers = 0;

    chunks.forEach((urls) => {
      if (urls.length === 0) {
        completedWorkers++;
        if (completedWorkers === workerCount) resolve();
        return;
      }

      const worker = new Worker(
        path.join(__dirname, "../workers/scrapeWorker.js"),
        { workerData: { urls } },
      );

      worker.on("message", (msg) => {
        if (msg.type === "game") {
          games.push(msg.data);
          scraped++;
          console.log(`Scraped ${scraped}/${gameLinks.length}: ${msg.url}`);
          if (onGameScraped) {
            saveChain = saveChain.then(() => onGameScraped(msg.data));
          }
        } else if (msg.type === "error") {
          console.error(`Failed to scrape ${msg.url}: ${msg.message}`);
        } else if (msg.type === "done") {
          completedWorkers++;
          if (completedWorkers === workerCount) resolve();
        }
      });

      worker.on("error", reject);
    });
  });

  // Wait for any in-flight saves to finish
  await saveChain;

  console.log(
    `Successfully scraped ${games.length}/${gameLinks.length} games.`,
  );

  return games;
}

module.exports = {
  scrapeListingPages,
  scrapeGamePage,
  scrapeGames,
};
