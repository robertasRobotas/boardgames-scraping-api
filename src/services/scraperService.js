const axios = require("axios");
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

async function scrapeGames(count) {
  const gameLinks = await scrapeListingPages(count);

  console.log(`Found ${gameLinks.length} game links. Scraping details...`);

  const games = [];

  for (let i = 0; i < gameLinks.length; i++) {
    const url = gameLinks[i];

    console.log(`Scraping game ${i + 1}/${gameLinks.length}: ${url}`);

    try {
      const gameData = await scrapeGamePage(url);

      if (gameData) {
        games.push(gameData);
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}: ${error.message}`);
    }

    if (i < gameLinks.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

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
