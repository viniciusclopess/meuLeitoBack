// socket/socket.js
const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [               // se usar outra porta no dev
        "https://meu-leito-front.onrender.com",  // 👉 troca pelo domínio real do front
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // path: "/socket.io", // deixe padrão se não alterou nada
  });

  io.on("connection", (socket) => {
    console.log("✅ [socket] cliente conectado:", socket.id);

    socket.on("entrar_setor", ({ setorId }) => {
      console.log("🧩 [socket] entrar_setor:", setorId);
      socket.join(`setor_${setorId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [socket] cliente desconectado:", socket.id, reason);
    });
  });

  return io;
}

module.exports = { initSocket };
