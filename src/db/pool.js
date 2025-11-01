require('dotenv').config();
const { Pool } = require('pg');

// usa SSL simples se PG_SSL_REQUIRE=true OU PGSSLMODE != 'disable'
const useSsl =
  process.env.PG_SSL_REQUIRE === 'true' ||
  (process.env.PGSSLMODE && process.env.PGSSLMODE.toLowerCase() !== 'disable');

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
    ssl: {
    // Aiven costuma exigir SSL. "require" aqui = sempre usar SSL.
    require: true,
    // se você NÃO tiver o certificado CA salvo localmente,
    // deixa assim pra não falhar na verificação:
    rejectUnauthorized: false,
  }, // <<— CORRETO
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Conectar ao banco de dados
const connectDB = async () => {
  try{
    await pool.connect();
    console.log("Conectado ao PostgreSQL");
  }
  catch(err){
    console.error("Erro ao conectar ao PostgreSQl: ", err);
    process.exit(1);
  }
};

// Função para desconectar do banco de dados
const disconnectDB = async () => {
  try {
    await pool.end();
    console.log("Conexão encerrada");
  } catch (err) {
    console.error("Erro ao encerrar a conexão", err.stack);
  }
};

module.exports = { connectDB, disconnectDB, pool };