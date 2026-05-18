const express = require('express');
const { hasSupabaseConfig, createSupabaseAdminClient } = require('../supabase');

const router = express.Router();

router.get('/config', (_req, res) => {
  res.json({
    ok: true,
    configured: hasSupabaseConfig(),
  });
});

router.get('/test', async (req, res) => {
  if (!hasSupabaseConfig()) {
    return res.status(400).json({
      ok: false,
      error: 'Supabase non configurato. Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nel file .env',
    });
  }

  const table = String(req.query.table || 'tournaments').trim();
  const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
  if (!safeTable) {
    return res.status(400).json({
      ok: false,
      error: 'Nome tabella non valido',
    });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from(safeTable)
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return res.status(500).json({
        ok: false,
        table: safeTable,
        error: error.message,
        hint: 'Connessione raggiunta ma query fallita (tabella mancante o policy RLS).',
      });
    }

    return res.json({
      ok: true,
      table: safeTable,
      count: typeof count === 'number' ? count : null,
      message: 'Connessione Supabase OK',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Errore sconosciuto Supabase',
    });
  }
});

module.exports = router;
