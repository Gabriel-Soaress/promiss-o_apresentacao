const express = require('express');
const path = require('path');
const feedbackHandler = require('./api/feedback');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API de feedback conectada ao Neon PostgreSQL
app.all('/api/feedback', (req, res) => {
  return feedbackHandler(req, res);
});

// Servir arquivos estáticos do projeto
app.use(express.static(path.join(__dirname)));

// Rotas amigáveis iguais às da Vercel
app.get(['/', '/slide', '/slides'], (req, res) => {
  res.sendFile(path.join(__dirname, 'apresentacao_tecnica_promissao.html'));
});

app.get(['/totem', '/totem_kiosk'], (req, res) => {
  res.sendFile(path.join(__dirname, 'totem_kiosk.html'));
});

app.get(['/app', '/avaliar', '/mobile'], (req, res) => {
  res.sendFile(path.join(__dirname, 'app_cidadao.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Promissão rodando na porta ${PORT}`);
  console.log(`📊 Apresentação: http://localhost:${PORT}/slides`);
  console.log(`🖥️ Totem Kiosk:  http://localhost:${PORT}/totem`);
  console.log(`📱 App Cidadão:  http://localhost:${PORT}/app`);
  console.log(`🗄️ Banco de Dados: Neon PostgreSQL Conectado`);
  console.log(`======================================================\n`);
});
