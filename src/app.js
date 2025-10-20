// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// Libera os domínios do seu front
const allowedOrigins = [
  'http://localhost:3500',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin(origin, callback) {
    // Permite Postman/Insomnia (sem Origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // marque true se quiser enviar cookies
};

// aplica CORS em todas as rotas
app.use(cors(corsOptions));
// responde às requisições preflight (OPTIONS)
app.options('*', cors(corsOptions));

// suas rotas
const api = require('./routes');
app.use('/api', api);

module.exports = app;
