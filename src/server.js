// server.js
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 3500;

// cria o servidor HTTP
const server = http.createServer(app);

// configura o Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`✅ Socket conectado: ${socket.id}`);

  socket.on('entrarSetor', (id_setor) => {
    const room = `setor:${id_setor}`;
    socket.join(room);
    console.log(`${socket.id} entrou na sala ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket desconectado: ${socket.id}`);
  });
});

app.set('io', io);

// tenta iniciar o servidor
server.listen(PORT, () => {
  console.log('------------------------------------------');
  console.log(`🚀 Servidor HTTP rodando em: http://localhost:${PORT}`);
  console.log(`🌐 WebSocket ativo em: ws://localhost:${PORT}`);
  console.log('------------------------------------------');
});

// caso dê erro ao iniciar
server.on('error', (err) => {
  console.error(' !X! Erro ao iniciar o servidor:');
  console.error(err.message);
});

// encerramento limpo (Ctrl + C)
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor e pool...');
  try {
    await pool.end();
    console.log('!V! Pool de conexões fechado.');
  } catch (err) {
    console.error('!A! Erro ao encerrar pool:', err.message);
  }
  server.close(() => {
    console.log('!P! Servidor encerrado com sucesso.');
    process.exit(0);
  });
});
