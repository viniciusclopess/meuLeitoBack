const { client } = require('../config/db');  // Importa a conexão

// Função para criar um novo paciente
const createPaciente = async (nome, observacao) => {
  try {
    const res = await client.query(
      'INSERT INTO pacientes (nome, observacao) VALUES ($1, $2) RETURNING *',
      [nome, observacao]
    );
    console.log('Paciente criado:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao criar paciente', err);
  }
};

// Função para buscar todos os pacientes
const getPacientes = async () => {
  try {
    const res = await client.query('SELECT * FROM pacientes');
    console.log('Pacientes encontrados:', res.rows);
  } catch (err) {
    console.error('Erro ao buscar pacientes', err);
  }
};

// Função para atualizar um paciente
const updatePaciente = async (id, nome, observacao) => {
  try {
    const res = await client.query(
      'UPDATE pacientes SET nome = $1, observacao = $2 WHERE id = $3 RETURNING *',
      [nome, observacao, id]
    );
    console.log('Paciente atualizado:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar paciente', err);
  }
};

// Função para deletar um paciente
const deletePaciente = async (id) => {
  try {
    const res = await client.query('DELETE FROM pacientes WHERE id = $1 RETURNING *', [id]);
    console.log('Paciente deletado:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao deletar paciente', err);
  }
};

module.exports = { createPaciente, getPacientes, updatePaciente, deletePaciente };
