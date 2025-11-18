// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./db/pool');
const { initSocket } = require("./socket/socket");

const PORT = process.env.PORT || 3500;

// cria o servidor HTTP
const server = http.createServer(app);

// inicializa o Socket.IO corretamente
const io = initSocket(server);

// salva o io dentro do app (caso queira usar em controllers)
app.set('io', io);

// inicia o servidor
server.listen(PORT, () => {
  console.log('------------------------------------------');
  console.log(`🚀 Servidor HTTP rodando em: http://localhost:${PORT}`);
  console.log(`🌐 WebSocket ativo em: ws://localhost:${PORT}`);
  console.log('------------------------------------------');
});

// captura erros de inicialização
server.on('error', (err) => {
  console.error('❌ Erro ao iniciar o servidor:');
  console.error(err.message);
});

// encerramento limpo (Ctrl + C)
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor e pool...');
  try {
    await pool.end();
    console.log('✅ Pool de conexões fechado.');
  } catch (err) {
    console.error('⚠️ Erro ao encerrar pool:', err.message);
  }
  server.close(() => {
    console.log('🛑 Servidor encerrado com sucesso.');
    process.exit(0);
  });
});
