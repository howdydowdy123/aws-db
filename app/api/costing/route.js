import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

const DEFAULT_COLUMNS = [
  'Order Number',
  'User Name',
  'Total Cost',
  'Total Price with out GST',
  'LM',
  'Mid Mile',
  'Provider',
  'Zone',
  'Actual Weight',
  'Package Round weight',
  'Handover Date',
  'Created Date',
  'Drop Country',
  'Vertical',
  'LM Cost',
  'LM Cost INR',
];

function safeIdent(name) {
  if (!name || typeof name !== 'string') return null;
  if (!/^[A-Za-z0-9_ ][A-Za-z0-9_ .\-+/()]*$/.test(name)) return null;
  if (name.includes('"') || name.includes(';') || name.includes('--')) return null;
  return name;
}

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = safeIdent(searchParams.get('table') || 'costing');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '2000'), 1), 100000);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    if (!table) {
      return Response.json({ error: 'Invalid table name' }, { status: 400 });
    }

    let columns = DEFAULT_COLUMNS;
    const colParam = searchParams.get('columns');
    if (colParam) {
      const parsed = colParam
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
        .map(safeIdent)
        .filter(Boolean);
      if (parsed.length) columns = parsed;
    }

    const selectList = columns.map(quoteIdent).join(', ');
    const orderCol = columns.includes('Order Number') ? quoteIdent('Order Number') : 'ctid';

    const sql = `
      SELECT ${selectList}
      FROM ${quoteIdent(table)}
      ORDER BY ${orderCol} ASC NULLS LAST
      LIMIT $1 OFFSET $2
    `;
    const countSql = `SELECT COUNT(*)::bigint AS total FROM ${quoteIdent(table)}`;

    const client = await pool.connect();
    try {
      const [countResult, dataResult] = await Promise.all([
        offset === 0 ? client.query(countSql) : Promise.resolve(null),
        client.query(sql, [limit, offset]),
      ]);

      let total = null;
      if (countResult) {
        total = BigInt(countResult.rows[0].total);
      }

      return Response.json(
        {
          rows: dataResult.rows,
          total: total ? Number(total) : null,
          limit,
          offset,
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'X-Total-Count': total ? String(total) : '',
          },
        }
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
