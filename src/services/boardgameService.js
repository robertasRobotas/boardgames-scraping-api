const scraperService = require("./scraperService");
const boardgameRepository = require("../repositories/boardgameRepository");

async function scrapeAndSaveBoardgames(count) {
  const boardgames = await scraperService.scrapeGames(count);

  await boardgameRepository.saveBoardgames(boardgames);

  return boardgames;
}

module.exports = {
  scrapeAndSaveBoardgames,
};
