const { Router } = require("express");
const boardgameController = require("../controllers/boardgameController");

const router = Router();

router.post("/scrape", boardgameController.scrapeAndSave);

module.exports = router;
