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

// Servir arquivos estáticos do projeto e libs do workshop
app.use(express.static(path.join(__dirname)));
app.use('/lib', express.static(path.join(__dirname, 'workshop_ia_comercio', 'workshop_ia_comercio', 'lib')));

// Rotas amigáveis iguais às da Vercel
app.get(['/', '/slide', '/slides'], (req, res) => {
  res.sendFile(path.join(__dirname, 'apresentacao_tecnica_promissao.html'));
});

app.get(['/mostra', '/extensao', '/mostra-extensao'], (req, res) => {
  res.sendFile(path.join(__dirname, 'apresentacao_mostra_extensao.html'));
});

app.get(['/totem', '/totem_kiosk'], (req, res) => {
  res.sendFile(path.join(__dirname, 'totem_kiosk.html'));
});

app.get(['/app', '/avaliar', '/mobile'], (req, res) => {
  res.sendFile(path.join(__dirname, 'app_cidadao.html'));
});

app.get(['/workshop'], (req, res) => {
  res.sendFile(path.join(__dirname, 'workshop_ia_comercio', 'workshop_ia_comercio', '02_SLIDES_WORKSHOP.html'));
});

app.get(['/apostila'], (req, res) => {
  res.sendFile(path.join(__dirname, 'workshop_ia_comercio', 'workshop_ia_comercio', '01_APOSTILA_GUIA_RAPIDO.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Promissão rodando na porta ${PORT}`);
  console.log(`📊 Apresentação Oficial: http://localhost:${PORT}/slides`);
  console.log(`🎓 Mostra de Extensão:   http://localhost:${PORT}/mostra`);
  console.log(`🖥️ Totem Kiosk:          http://localhost:${PORT}/totem`);
  console.log(`📱 App Cidadão:          http://localhost:${PORT}/app`);
  console.log(`🤖 Workshop IA Slides:   http://localhost:${PORT}/workshop`);
  console.log(`📘 Apostila Workshop:    http://localhost:${PORT}/apostila`);
  console.log(`🗄️ Banco de Dados:       Neon PostgreSQL Conectado`);
  console.log(`======================================================\n`);
});
