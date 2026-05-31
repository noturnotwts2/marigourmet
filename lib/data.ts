import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export type EntryType = 'receita' | 'gasto';

export interface Entry {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount NUMERIC NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function readEntries(): Promise<Entry[]> {
  await initDB();
  const rows = await sql`SELECT * FROM entries ORDER BY date DESC, created_at DESC`;
  return rows.map(r => ({
    id: r.id, date: r.date, type: r.type as EntryType,
    category: r.category, description: r.description || '',
    amount: parseFloat(r.amount), createdAt: r.created_at,
  }));
}

export async function addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> {
  await initDB();
  const id = Date.now().toString();
  await sql`
    INSERT INTO entries (id, date, type, category, description, amount)
    VALUES (${id}, ${entry.date}, ${entry.type}, ${entry.category}, ${entry.description}, ${entry.amount})
  `;
  return { ...entry, id, createdAt: new Date().toISOString() };
}

export async function deleteEntry(id: string): Promise<boolean> {
  await initDB();
  const result = await sql`DELETE FROM entries WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

export async function getEntriesByDateRange(days: number): Promise<Entry[]> {
  await initDB();
  const rows = await sql`
    SELECT * FROM entries
    WHERE date::date >= CURRENT_DATE - (${days} || ' days')::INTERVAL
    ORDER BY date DESC, created_at DESC
  `;
  return rows.map(r => ({
    id: r.id, date: r.date, type: r.type as EntryType,
    category: r.category, description: r.description || '',
    amount: parseFloat(r.amount), createdAt: r.created_at,
  }));
}

export function getSummary(entries: Entry[]) {
  const receitas = entries.filter(e => e.type === 'receita');
  const gastos = entries.filter(e => e.type === 'gasto');
  const totalReceitas = receitas.reduce((s, e) => s + e.amount, 0);
  const totalGastos = gastos.reduce((s, e) => s + e.amount, 0);
  return {
    totalReceitas, totalGastos,
    lucroLiquido: totalReceitas - totalGastos,
    qtdReceitas: receitas.length,
    qtdGastos: gastos.length,
  };
}

export function getByDay(entries: Entry[]): Record<string, { receitas: number; gastos: number; lucro: number }> {
  const byDay: Record<string, { receitas: number; gastos: number; lucro: number }> = {};
  for (const e of entries) {
    if (!byDay[e.date]) byDay[e.date] = { receitas: 0, gastos: 0, lucro: 0 };
    if (e.type === 'receita') byDay[e.date].receitas += e.amount;
    else byDay[e.date].gastos += e.amount;
    byDay[e.date].lucro = byDay[e.date].receitas - byDay[e.date].gastos;
  }
  return byDay;
}
