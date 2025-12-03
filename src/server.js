// server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const pool = require("./db/pool");
const { initSocket } = require("./socket/socket");

const PORT = process.env.PORT || 3500;

const server = http.createServer(app);

const io = initSocket(server);

app.set("io", io);

server.listen(PORT, () => {
  console.log("-------------------------------------------------");
  console.log(`🚀 Servidor HTTP rodando na porta: ${PORT}`);
  console.log("-------------------------------------------------");
});

server.on("error", (err) => {
  console.error("❌ Erro ao iniciar o servidor:");
  console.error(err);
});

process.on("SIGINT", async () => {
  console.log("\nEncerrando servidor e pool...");
  try {
    await pool.end();
    console.log("✅ Pool de conexões fechado.");
  } catch (err) {
    console.error("⚠️ Erro ao encerrar pool:", err.message);
  }
  server.close(() => {
    console.log("🛑 Servidor encerrado com sucesso.");
    process.exit(0);
  });
});

module.exports = { server, io };
