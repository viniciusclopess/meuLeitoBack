// src/socket.js
const { Server } = require("socket.io");
const { selectProfissionaisSetoresSocket } = require("../services/socketService")

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 conectado:", socket.id);

    socket.on("registrar_profissional", async ({ profissionalId }) => {
      const setores = await selectProfissionaisSetoresSocket(profissionalId);

      setores.forEach((s) => {
        const roomName = `setor:${s.Id}`;
        socket.join(roomName);
        console.log(`✅ ${socket.id} entrou na room ${roomName}`);
      });

      socket.emit(
        "setores_registrados",
        setores.map((s) => ({ id: s.Id, nome: s.Nome }))
      );
    });

    socket.on("disconnect", () => {
      console.log("❌ desconectou:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado ainda.");
  }
  return io;
}


module.exports = {
  initSocket,
  getIO,
};