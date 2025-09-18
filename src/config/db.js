require('dotenv').config();
const { Client } = require('pg');

// Configuração da conexão com o banco de dados
const client = new Client({
  user: process.env.DB_USER, // Usuário do banco
  host: process.env.DB_HOST, // Servidor local
  database: process.env.DB_NAME, // Nome do banco
  password: process.env.DB_PASSOWORD, // Senha do banco
  port: process.env.DB_PORT, // Porta padrão do PostgreSQL
});

// Conectar ao banco de dados
const connectDB = async () => {
  try{
    await client.connect();
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
    await client.end();
    console.log("Conexão encerrada");
  } catch (err) {
    console.error("Erro ao encerrar a conexão", err.stack);
  }
};

module.exports = { connectDB, disconnectDB, client };