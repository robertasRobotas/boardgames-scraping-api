const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const FILE_PATH = path.join(DATA_DIR, "boardgames.js");

async function saveBoardgames(boardgames) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const fileContent =
    `const boardgames = ${JSON.stringify(boardgames, null, 2)};\n` +
    `\nmodule.exports = boardgames;\n`;

  await fs.writeFile(FILE_PATH, fileContent, "utf-8");

  console.log(`Saved ${boardgames.length} boardgames to ${FILE_PATH}`);
}

async function getBoardgames() {
  try {
    const content = await fs.readFile(FILE_PATH, "utf-8");
    const match = content.match(/const boardgames = (\[[\s\S]*\]);/);

    if (!match) {
      return [];
    }

    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

module.exports = {
  saveBoardgames,
  getBoardgames,
};
