const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

// cria o servidor HTTP
const server = http.createServer(app);

// cria o servidor WebSocket
const io = new Server(server, {
  cors: {
    origin: '*', // depois dá pra limitar pro domínio do front-end
  },
});

// quando alguém se conecta via WebSocket
io.on('connection', (socket) => {
  console.log(`Nova conexão WebSocket: ${socket.id}`);

  // a enfermeira entra no setor (ex: setor 3)
  socket.on('entrarSetor', (id_setor) => {
    socket.join(`setor:${id_setor}`);
    console.log(`Enfermeira entrou na sala setor:${id_setor}`);
  });

  socket.on('disconnect', () => {
    console.log(`Conexão encerrada: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3500;
app.get('/', (req, res) => {
  res.send('API do backend está rodand! Use /api/');
});


server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/api/`);
});

// exporta o io pra usar em outros arquivos (ex: quando criar chamado)
module.exports = io;
