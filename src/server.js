// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./db/pool'); // para encerrar o pool no shutdown

const server = http.createServer(app);

const PORT = process.env.PORT || 3500;

// rota raiz (opcional)
app.get('api/', (_req, res) => {
  res.send('API do backend está rodando! Use /api/');
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/api/`);
});

// encerramento limpo (CTRL+C, PM2, etc.)
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor e pool…');
  try { await pool.end(); } catch {}
  server.close(() => process.exit(0));
});
