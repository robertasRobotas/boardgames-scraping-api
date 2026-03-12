const { Router } = require("express");
const boardgameController = require("../controllers/boardgameController");

const router = Router();

router.post("/scrape", boardgameController.scrapeAndSave);
router.post("/enrich-box-size", boardgameController.enrichBoxSize);

module.exports = router;
