// src/socket.js
const { Server } = require("socket.io");
const { selectProfissionaisSetoresSocket } = require("../services/socketService");
const {
  insertChamado,
  autoCloseChamados,
  acceptChamado,
  cancelChamado
} = require("../services/chamadosService");
const cron = require("node-cron");
let jobStarted = false; // Garantir que o cron não seja iniciado 2x
let io;

function startAutoCloseJob() {
  if (jobStarted) return;
  jobStarted = true;

  cron.schedule("* * * * *", async () => {
    console.log("⌛ Verificando chamados para encerrar automaticamente...");

    const TEMPO_LIMITE_MIN = 30;

    try {
      const chamadosEncerrados = await autoCloseChamados(TEMPO_LIMITE_MIN) || [];

      console.log("🔎 Resultado do autoCloseChamados:", chamadosEncerrados);

      if (Array.isArray(chamadosEncerrados) && chamadosEncerrados.length > 0) {
        console.log(`🚨 ${chamadosEncerrados.length} chamados serão encerrados automaticamente.`);

        chamadosEncerrados.forEach((chamado) => {
          const roomName = `setor:${chamado.IdSetor}`;

          console.log(`🚨 Encerrando automaticamente chamado ${chamado.Id} no setor ${chamado.IdSetor}`);

          io.to(roomName).emit("chamado_encerrado_auto", {
            chamadoId: chamado.Id,
            setorId: chamado.IdSetor,
            status: "ENCERRADO AUTOMATICAMENTE",
          });
        });
      } else {
        console.log("⚠️ Nenhum chamado retornado pelo autoCloseChamados.");
      }
    } catch (err) {
      console.error("❌ Erro no job de auto encerramento:", err);
    }
  });
}


function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://app-meuleito.com.br", // mesmo domínio do HostGator
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  startAutoCloseJob();

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
        tipo,
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
        if (!tipo) {
          socket.emit("erro_chamado", { msg: "tipo não informado" });
          return;
        }

        const roomName = `setor:${setorId}`;

        try {
          const chamado = await insertChamado({
            id_paciente_leito,
            prioridade,
            tipo,
            mensagem,
          });

          console.log(`📢 chamado ${chamado.Id} criado e enviado para ${roomName}`);

          // envia o chamado para todas as enfermeiras do setor
          io.to(roomName).emit("receber_chamado", {
            chamadoId: chamado.Id,
            IdSetor: setorId,
            IdPacienteLeito: id_paciente_leito,
            prioridade: prioridade ?? null,
            tipo: tipo,
            mensagem: mensagem ?? null,
            hora: new Date().toISOString(),
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
          const chamadoAtualizado = await acceptChamado({
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

    // Socket de cancelamento do chamado
    socket.on(
      "cancelar_chamado",
      async ({ chamadoId, setorId }) => {
        if (!chamadoId) {
          socket.emit("erro_chamado", {
            msg: "chamadoId é obrigatório para cancelar.",
          });
          return;
        }

        try {
          const chamado = await cancelChamado(chamadoId);

          if (!chamado) {
            socket.emit("cancelar_chamado_erro", {
              chamadoId,
              msg: "Não foi possível cancelar: chamado não está mais pendente ou não pertence a este paciente.",
            });
            return;
          }

          console.log(`🛑 chamado ${chamadoId} cancelado pelo paciente`);

          // avisa o paciente que deu certo
          socket.emit("cancelar_chamado_ok", {
            chamadoId,
            status: chamado.Status,
            msg: "Chamado cancelado com sucesso.",
          });

          // avisa as enfermeiras do setor para remover da tela
          const roomName = `setor:${setorId || chamado.IdSetor}`;

          io.to(roomName).emit("chamado_cancelado", {
            chamadoId,
            setorId: setorId || chamado.IdSetor,
            status: chamado.Status,
          });

        } catch (err) {
          console.error("❌ erro ao cancelar chamado:", err);
          socket.emit("cancelar_chamado_erro", {
            chamadoId,
            msg: "Erro ao cancelar chamado.",
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
