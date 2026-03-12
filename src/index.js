const express = require("express");
const boardgameRoutes = require("./routes/boardgameRoutes");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use("/api/boardgames", boardgameRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
