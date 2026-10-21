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
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const { cpf, perfil, notaInfra, notaSeguranca, notaGeral, origem, tipo } = body || {};

      const finalOrigem = origem || (tipo === 'totem' ? 'Totem Físico #01' : 'App Mobile (QR Code)');

      const result = await db.query(
        `INSERT INTO feedbacks (cpf, perfil, nota_infra, nota_seguranca, nota_geral, origem, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, cpf, perfil, nota_infra AS "notaInfra", nota_seguranca AS "notaSeguranca", nota_geral AS "notaGeral", origem, created_at AS "timestamp"`,
        [
          cpf || '48192038194',
          perfil || 'Morador de Promissão',
          notaInfra || 5,
          notaSeguranca || 5,
          notaGeral || 5.0,
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
        query = `SELECT id, cpf, perfil, nota_infra AS "notaInfra", nota_seguranca AS "notaSeguranca", nota_geral AS "notaGeral", origem, created_at AS "timestamp"
                 FROM feedbacks
                 WHERE id > $1
                 ORDER BY id ASC`;
        params = [sinceId];
      } else {
        query = `SELECT id, cpf, perfil, nota_infra AS "notaInfra", nota_seguranca AS "notaSeguranca", nota_geral AS "notaGeral", origem, created_at AS "timestamp"
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
