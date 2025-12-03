// server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const pool = require("./db/pool");
const { initSocket } = require("./socket/socket");

const PORT = process.env.PORT || 3500;

// 1) Cria o servidor HTTP a partir do Express
const server = http.createServer(app);

// 2) Inicializa o Socket.IO usando o MESMO servidor HTTP
//    (é ESSA linha que faz o Socket.IO funcionar no Render)
const io = initSocket(server);

// 3) (Opcional) deixa o io acessível nos controllers via req.app.get("io")
app.set("io", io);

// 4) Sobe o servidor (no Render ele vai usar process.env.PORT)
server.listen(PORT, () => {
  console.log("-------------------------------------------------");
  console.log(`🚀 Servidor HTTP rodando na porta: ${PORT}`);
  console.log("-------------------------------------------------");
});

// 5) Tratamento de erro de inicialização
server.on("error", (err) => {
  console.error("❌ Erro ao iniciar o servidor:");
  console.error(err);
});

// 6) Encerramento limpo (mais útil em dev/local)
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

// (Opcional) exportar se precisar em testes
module.exports = { server, io };
