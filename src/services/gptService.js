const OpenAI = require("openai");

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }

    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

async function getBoxSize(title) {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a board game expert. When given a board game title, respond with only one word: SMALL, MEDIUM, or LARGE — representing the physical box size of the game. SMALL means a card-game-sized or tiny box (e.g. Coup, Sushi Go). MEDIUM means a standard-sized box (e.g. Ticket to Ride, Pandemic). LARGE means an oversized or very large box (e.g. Gloomhaven, Twilight Imperium). Respond with only the single word, no punctuation.",
      },
      {
        role: "user",
        content: title,
      },
    ],
    max_tokens: 5,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content?.trim().toUpperCase();
  const valid = ["SMALL", "MEDIUM", "LARGE"];

  return valid.includes(raw) ? raw : null;
}

module.exports = { getBoxSize };
