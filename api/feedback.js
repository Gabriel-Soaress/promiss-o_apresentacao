const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_n2koDwlrL9qh@ep-dry-bread-b6md1xar-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getPool();

  if (req.method === 'POST') {
    try {
      if (req.query && req.query.action === 'reset') {
        await db.query('TRUNCATE TABLE feedbacks RESTART IDENTITY;');
        console.log('[API] Banco de dados resetado via endpoint!');
        return res.status(200).json({ success: true, count: 0 });
      }

      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const { cpf, perfil, notaSlides, notaIdeia, notaGeral, notaInfra, notaSeguranca, origem, tipo } = body || {};

      const finalSlides = +(notaSlides || notaInfra || 5);
      const finalIdeia = +(notaIdeia || notaSeguranca || 5);
      const finalGeral = +(notaGeral || Math.round(((finalSlides + finalIdeia) / 2) * 10) / 10);
      const finalOrigem = origem || (tipo === 'totem' ? 'Totem Físico #01' : 'App Mobile (QR Code)');

      const result = await db.query(
        `INSERT INTO feedbacks (cpf, perfil, nota_infra, nota_seguranca, nota_geral, nota_slides, nota_ideia, nota_apresentacao, origem, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id, cpf, perfil, 
                   nota_slides AS "notaSlides", 
                   nota_ideia AS "notaIdeia", 
                   nota_apresentacao AS "notaGeral", 
                   nota_infra AS "notaInfra", 
                   nota_seguranca AS "notaSeguranca", 
                   origem, created_at AS "timestamp"`,
        [
          cpf || '48192038194',
          perfil || 'Avaliador / Banca',
          finalSlides,
          finalIdeia,
          finalGeral,
          finalSlides,
          finalIdeia,
          finalGeral,
          finalOrigem
        ]
      );

      const row = result.rows[0];
      row.tipo = (row.origem && row.origem.toLowerCase().includes('totem')) ? 'totem' : 'mobile';

      return res.status(201).json({ success: true, feedback: row });
    } catch (err) {
      console.error('[API] Erro ao salvar feedback no Neon:', err);
      return res.status(500).json({ error: 'Erro ao salvar feedback', details: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const sinceId = parseInt(req.query.since_id || '0', 10);
      let query;
      let params;

      if (sinceId > 0) {
        query = `SELECT id, cpf, perfil, 
                        COALESCE(nota_slides, nota_infra, 5) AS "notaSlides", 
                        COALESCE(nota_ideia, nota_seguranca, 5) AS "notaIdeia", 
                        COALESCE(nota_apresentacao, nota_geral, 5.0) AS "notaGeral",
                        COALESCE(nota_infra, nota_slides, 5) AS "notaInfra", 
                        COALESCE(nota_seguranca, nota_ideia, 5) AS "notaSeguranca", 
                        origem, created_at AS "timestamp"
                 FROM feedbacks
                 WHERE id > $1
                 ORDER BY id ASC`;
        params = [sinceId];
      } else {
        query = `SELECT id, cpf, perfil, 
                        COALESCE(nota_slides, nota_infra, 5) AS "notaSlides", 
                        COALESCE(nota_ideia, nota_seguranca, 5) AS "notaIdeia", 
                        COALESCE(nota_apresentacao, nota_geral, 5.0) AS "notaGeral",
                        COALESCE(nota_infra, nota_slides, 5) AS "notaInfra", 
                        COALESCE(nota_seguranca, nota_ideia, 5) AS "notaSeguranca", 
                        origem, created_at AS "timestamp"
                 FROM feedbacks
                 ORDER BY id DESC
                 LIMIT 50`;
        params = [];
      }

      const result = await db.query(query, params);
      const rows = result.rows.map(r => ({
        ...r,
        tipo: (r.origem && r.origem.toLowerCase().includes('totem')) ? 'totem' : 'mobile'
      }));

      return res.status(200).json({ success: true, feedbacks: rows });
    } catch (err) {
      console.error('[API] Erro ao buscar feedbacks do Neon:', err);
      return res.status(500).json({ error: 'Erro ao buscar feedbacks', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
