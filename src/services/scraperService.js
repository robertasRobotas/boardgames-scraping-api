const os = require("os");
const browserService = require("./browserService");
const parser = require("../utils/parser");

const BASE_URL = "https://boardgamegeek.com";
const LISTING_PATH = "/browse/boardgame/page";
const GAMES_PER_PAGE = 100;
const REQUEST_DELAY_MS = 2000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeListingPages(count) {
  const pagesNeeded = Math.ceil(count / GAMES_PER_PAGE);
  const allLinks = [];

  for (let page = 1; page <= pagesNeeded; page++) {
    const url = `${BASE_URL}${LISTING_PATH}/${page}`;

    console.log(`Scraping listing page ${page}/${pagesNeeded}...`);

    const html = await browserService.fetchPage(url);
    const links = parser.parseListingPage(html);

    allLinks.push(...links);

    if (page < pagesNeeded) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return allLinks.slice(0, count);
}

async function scrapeGamePage(url) {
  const html = await browserService.fetchPage(url);
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
  const concurrency = Math.max(1, Math.floor(cpuCount * 0.6));

  console.log(
    `Scraping with ${concurrency} concurrent pages (${cpuCount} CPUs, targeting 60%)...`,
  );

  const games = [];
  let scraped = 0;
  let index = 0;

  // Serialize saves to prevent concurrent file writes
  let saveChain = Promise.resolve();

  async function worker() {
    while (true) {
      const i = index++;

      if (i >= gameLinks.length) break;

      const url = gameLinks[i];

      try {
        const gameData = await scrapeGamePage(url);

        if (gameData) {
          games.push(gameData);
          scraped++;
          console.log(`Scraped ${scraped}/${gameLinks.length}: ${url}`);

          if (onGameScraped) {
            saveChain = saveChain.then(() => onGameScraped(gameData));
          }
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
      }

      await delay(REQUEST_DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
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
