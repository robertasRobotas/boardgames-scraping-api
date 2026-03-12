const express = require("express");
const boardgameRoutes = require("./routes/boardgameRoutes");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use("/api/boardgames", boardgameRoutes);

const ROUTES = [{ prefix: "/api/boardgames", router: boardgameRoutes }];

function printEndpoints(port) {
  console.log("\nAvailable endpoints:");
  ROUTES.forEach(({ prefix, router }) => {
    router.stack
      .filter((r) => r.route)
      .forEach((r) => {
        const methods = Object.keys(r.route.methods)
          .map((m) => m.toUpperCase())
          .join(", ");
        console.log(
          `  ${methods.padEnd(6)} http://localhost:${port}${prefix}${r.route.path}`,
        );
      });
  });
  console.log();
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  printEndpoints(PORT);
});
