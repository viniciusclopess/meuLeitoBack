require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./db/pool');
const { Server } = require('socket.io');

// cria o servidor HTTP com o Express
const server = http.createServer(app);

// cria o servidor WebSocket (Socket.IO)
const io = new Server(server, {
  cors: {
    origin: '*', // depois podemos restringir ao domínio do front
    methods: ['GET', 'POST'],
  },
});

// quando alguém se conecta via WebSocket
io.on('connection', (socket) => {
  console.log(`WS conectado: ${socket.id}`);

  socket.on('entrarSetor', (id_setor) => {
    const room = `setor:${id_setor}`;
    socket.join(room);
    console.log(`${socket.id} → ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`WS off: ${socket.id}`);
  });
});


// expõe o io para uso em outras partes do app (rotas, controladores)
app.set('io', io);

// adiciona rota raiz pra evitar erro 404 no navegador
app.get('/', (req, res) => {
  res.send('Servidor do Meu Leito está rodando! 🚀');
});

const PORT = process.env.PORT || 3500;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/`);
  console.log(`🌐 Acesse o teste WebSocket em ws://localhost:${PORT}`);
});

// encerramento limpo (quando der Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor e pool…');
  try {
    await pool.end();
  } catch {}
  server.close(() => process.exit(0));
});
