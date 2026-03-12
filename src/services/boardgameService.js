const scraperService = require("./scraperService");
const boardgameRepository = require("../repositories/boardgameRepository");
const gptService = require("./gptService");

async function scrapeAndSaveBoardgames(count) {
  await boardgameRepository.initBoardgamesFile();

  const boardgames = await scraperService.scrapeGames(count, (game) =>
    boardgameRepository.appendBoardgame(game),
  );

  return boardgames;
}

async function enrichBoardgamesWithBoxSize() {
  const boardgames = await boardgameRepository.getBoardgames();

  if (boardgames.length === 0) {
    return { updated: 0, total: 0 };
  }

  let updated = 0;

  for (const game of boardgames) {
    if (!game.title) continue;

    try {
      const boxSize = await gptService.getBoxSize(game.title);
      game.boxSize = boxSize;
      updated++;
      console.log(`[GPT] ${game.title} → ${boxSize}`);
    } catch (error) {
      console.error(`[GPT] Failed for "${game.title}": ${error.message}`);
      game.boxSize = null;
    }
  }

  await boardgameRepository.saveBoardgames(boardgames);

  return { updated, total: boardgames.length };
}

module.exports = {
  scrapeAndSaveBoardgames,
  enrichBoardgamesWithBoxSize,
};
