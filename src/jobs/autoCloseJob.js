const cron = require("node-cron");
const { autoCloseChamados } = require("../services/chamadosService");
const { getIO } = require("../socket");

function startAutoCloseJob() {
  // Rodar todo minuto
  cron.schedule("* * * * *", async () => {
    console.log("⌛ Verificando chamados para encerrar automaticamente...");

    // Quantos minutos esperar antes de encerrar automaticamente
    const TEMPO_LIMITE_MIN = 30;

    const chamadosEncerrados = await autoCloseChamados(TEMPO_LIMITE_MIN);

    if (chamadosEncerrados.length > 0) {
      const io = getIO();

      chamadosEncerrados.forEach((chamado) => {
        const roomName = `setor:${chamado.setorId}`;

        console.log(`🚨 Encerrando automaticamente chamado ${chamado.Id}`);

        io.to(roomName).emit("chamado_encerrado_auto", {
          chamadoId: chamado.Id,
          setorId: chamado.setorId,
          status: "ENCERRADO AUTOMATICAMENTE",
        });
      });
    }
  });
}

module.exports = { startAutoCloseJob };
