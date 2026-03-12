const scraperService = require("./scraperService");
const boardgameRepository = require("../repositories/boardgameRepository");

async function scrapeAndSaveBoardgames(count) {
  await boardgameRepository.initBoardgamesFile();

  const boardgames = await scraperService.scrapeGames(count, (game) =>
    boardgameRepository.appendBoardgame(game),
  );

  return boardgames;
}

module.exports = {
  scrapeAndSaveBoardgames,
};
