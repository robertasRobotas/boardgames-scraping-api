const boardgameService = require("../services/boardgameService");

async function scrapeAndSave(req, res) {
  const count = parseInt(req.query.count, 10);

  if (!count || count < 1) {
    return res.status(400).json({
      error:
        'Query parameter "count" is required and must be a positive integer.',
    });
  }

  try {
    const boardgames = await boardgameService.scrapeAndSaveBoardgames(count);

    return res.json({
      message: `Successfully scraped and saved ${boardgames.length} boardgames.`,
      count: boardgames.length,
      boardgames,
    });
  } catch (error) {
    console.error("Scraping failed:", error);

    return res.status(500).json({
      error: "Failed to scrape boardgames.",
      details: error.message,
    });
  }
}

module.exports = {
  scrapeAndSave,
};
