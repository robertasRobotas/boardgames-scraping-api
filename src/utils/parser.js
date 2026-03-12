const crypto = require("crypto");
const cheerio = require("cheerio");

const BASE_URL = "https://boardgamegeek.com";
const PRELOAD_MARKER = "GEEK.geekitemPreload";

function parseListingPage(html) {
  const $ = cheerio.load(html);
  const gameLinks = [];

  $("td.collection_objectname a.primary").each((_, el) => {
    const href = $(el).attr("href");

    if (href && href.startsWith("/boardgame/")) {
      gameLinks.push(`${BASE_URL}${href}`);
    }
  });

  return gameLinks;
}

function parseGamePage(html) {
  const preloadData = extractPreloadData(html);

  if (!preloadData?.item) {
    return null;
  }

  return mapPreloadToGameData(preloadData);
}

function extractPreloadData(html) {
  const lines = html.split("\n");
  const preloadLine = lines.find((line) => line.includes(PRELOAD_MARKER));

  if (!preloadLine) {
    return null;
  }

  const assignmentIndex = preloadLine.indexOf("=");

  if (assignmentIndex === -1) {
    return null;
  }

  const firstBrace = preloadLine.indexOf("{", assignmentIndex);
  const lastBrace = preloadLine.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonStr = preloadLine.substring(firstBrace, lastBrace + 1);

  return JSON.parse(jsonStr);
}

function mapPreloadToGameData(preloadData) {
  const item = preloadData.item;
  const stats = item.stats || {};
  const polls = item.polls || {};
  const userPlayers = polls.userplayers || {};
  const weightPoll = polls.boardgameweight || {};

  const { min: minBest, max: maxBest } = extractBestPlayerRange(userPlayers);

  const averageRating = parseFloat(stats.average);
  const rating = !isNaN(averageRating)
    ? Math.round(averageRating * 10) / 10
    : null;

  const difficulty =
    weightPoll.averageweight != null
      ? Math.round(weightPoll.averageweight * 100) / 100
      : null;

  return {
    id: crypto.randomUUID(),
    title: item.name || null,
    subtitle: item.short_description || null,
    imgUrl: item["imageurl@2x"] || item.imageurl || null,
    rating,
    releaseYear: parseIntOrNull(item.yearpublished),
    minAvailableForPeopleNumber: parseIntOrNull(item.minplayers),
    maxAvailableForPeopleNumber: parseIntOrNull(item.maxplayers),
    minBestPlayForPeopleNumber: minBest,
    maxBestPlayForPeopleNumber: maxBest,
    recommendedStartingAge: parseIntOrNull(item.minage),
    difficulty,
    ratingsCount: parseIntOrNull(stats.usersrated),
    minPlayingTime: parseIntOrNull(item.minplaytime),
    maxPlayingTime: parseIntOrNull(item.maxplaytime),
  };
}

function extractBestPlayerRange(userPlayers) {
  const bestRanges = userPlayers.best || [];

  if (bestRanges.length === 0) {
    return { min: null, max: null };
  }

  const allMins = bestRanges.map((range) => range.min);
  const allMaxes = bestRanges.map((range) => range.max);

  return {
    min: Math.min(...allMins),
    max: Math.max(...allMaxes),
  };
}

function parseRatingsCount(text) {
  if (!text) {
    return null;
  }

  const cleaned = text.trim().toUpperCase();
  const match = cleaned.match(/([\d.]+)\s*(K)?/);

  if (!match) {
    return null;
  }

  const number = parseFloat(match[1]);

  return match[2] ? Math.round(number * 1000) : number;
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = parseInt(value, 10);

  return isNaN(parsed) || parsed === 0 ? null : parsed;
}

module.exports = {
  parseListingPage,
  parseGamePage,
  parseRatingsCount,
};
