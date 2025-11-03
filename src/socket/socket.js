// src/socket.js
const { Server } = require("socket.io");
const { selectProfissionaisSetoresSocket } = require("../services/socketService");
const {
  insertChamado,
  atribuirProfissionalAoChamado,
} = require("../services/chamadosService");

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

    // só pra ver TUDO o que esse socket está mandando
    socket.onAny((event, ...args) => {
      console.log(`📥 [${socket.id}] onAny ->`, event, args);
    });

    // --- REGISTRAR PROFISSIONAL ---
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

    // --- ENTRAR DIRETO EM ROOM DE SETOR ---
    socket.on("entrar_setor", ({ setorId }) => {
      if (!setorId) {
        socket.emit("erro_setor", { msg: "setorId não informado" });
        console.log(`⚠️ ${socket.id} tentou entrar em setor sem id`);
        return;
      }

      const roomName = `setor:${setorId}`;
      socket.join(roomName);
      console.log(`🟦 ${socket.id} entrou na room ${roomName}`);

      // LOGA QUEM TÁ NA ROOM
      const socketsDaRoom = io.sockets.adapter.rooms.get(roomName);
      console.log(
        "👥 sockets na room",
        roomName,
        socketsDaRoom ? [...socketsDaRoom] : "nenhum"
      );

      socket.emit("entrou_no_setor", {
        setorId,
        room: roomName,
        msg: `Entrou na room ${roomName}`,
      });
    });

    // --- PACIENTE ABRE CHAMADO ---
    socket.on(
      "novo_chamado",
      async ({
        id_paciente_leito,
        setorId,
        prioridade,
        mensagem,
        nomePaciente,
        nomeLeito,
      }) => {
        if (!id_paciente_leito) {
          socket.emit("erro_chamado", { msg: "id_paciente_leito não informado" });
          return;
        }
        if (!setorId) {
          socket.emit("erro_chamado", { msg: "setorId não informado" });
          return;
        }

        const roomName = `setor:${setorId}`;

        try {
          const chamado = await insertChamado({
            id_paciente_leito,
            prioridade,
            mensagem,
          });

          console.log(`📢 chamado ${chamado.Id} criado e enviado para ${roomName}`);

          // envia o chamado para todas as enfermeiras do setor
          io.to(roomName).emit("receber_chamado", {
            chamadoId: chamado.Id,
            IdSetor: setorId,
            IdPacienteLeito: id_paciente_leito,
            prioridade: prioridade ?? null,
            mensagem: mensagem ?? null,
            hora: new Date().toISOString(),
            // 👇 agora vem o nome do paciente e do leito
            NomePaciente: nomePaciente || null,
            NomeLeito: nomeLeito || null,
          });

          // confirma pro paciente que foi criado
          socket.emit("chamado_enviado", {
            chamadoId: chamado.Id,
            msg: "Chamado criado e enviado.",
          });
        } catch (err) {
          console.error("❌ erro ao inserir chamado:", err);
          socket.emit("erro_chamado", { msg: "Erro ao registrar o chamado." });
        }
      }
    );
    // --- ENFERMEIRA ACEITA CHAMADO ---
    socket.on(
      "aceitar_chamado",
      async ({ chamadoId, idProfissional, setorId }) => {
        if (!chamadoId || !idProfissional) {
          socket.emit("erro_chamado", {
            msg: "chamadoId e idProfissional são obrigatórios",
          });
          return;
        }

        try {
          const chamadoAtualizado = await atribuirProfissionalAoChamado({
            id_chamado: chamadoId,
            id_profissional: idProfissional,
          });

          console.log(
            `✅ chamado ${chamadoId} aceito pelo profissional ${idProfissional}`
          );

          if (setorId) {
            const roomName = `setor:${setorId}`;
            io.to(roomName).emit("chamado_aceito", {
              chamadoId,
              idProfissional,
            });
          }

          socket.emit("chamado_aceito_ok", {
            chamadoId,
            idProfissional,
            chamado: chamadoAtualizado,
          });
        } catch (err) {
          console.error("❌ erro ao aceitar chamado:", err);
          socket.emit("erro_chamado", {
            msg: "Erro ao aceitar chamado.",
          });
        }
      }
    );

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
