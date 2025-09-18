const { connectDB, disconnectDB } = require('./config/db');  // Importa a função de conexão

const run = async () => {
  await connectDB();  // Conectar ao banco de dados

  // Aqui podemos adicionar qualquer operação para testar a conexão

  // Caso queira desconectar
  // await disconnectDB();  // Desconectar do banco
};

run();
