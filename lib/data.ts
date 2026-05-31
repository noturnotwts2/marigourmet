import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export type EntryType = 'receita' | 'gasto';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  type: EntryType;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'entries.csv');

const HEADERS = ['id', 'date', 'type', 'category', 'description', 'amount', 'createdAt'];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, HEADERS.join(',') + '\n', 'utf-8');
  }
}

export function readEntries(): Entry[] {
  ensureDataDir();
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  if (!content.trim() || content.trim() === HEADERS.join(',')) return [];
  
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (context.column === 'amount') return parseFloat(value) || 0;
        return value;
      },
    });
    return records as Entry[];
  } catch {
    return [];
  }
}

export function writeEntries(entries: Entry[]) {
  ensureDataDir();
  const output = stringify(entries, { header: true, columns: HEADERS });
  fs.writeFileSync(CSV_PATH, output, 'utf-8');
}

export function addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): Entry {
  const entries = readEntries();
  const newEntry: Entry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  entries.push(newEntry);
  writeEntries(entries);
  return newEntry;
}

export function deleteEntry(id: string): boolean {
  const entries = readEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  writeEntries(filtered);
  return true;
}

export function getEntriesByDateRange(days: number): Entry[] {
  const entries = readEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return entries.filter(e => e.date >= cutoffStr);
}

export function getSummary(entries: Entry[]) {
  const receitas = entries.filter(e => e.type === 'receita');
  const gastos = entries.filter(e => e.type === 'gasto');
  
  const totalReceitas = receitas.reduce((sum, e) => sum + e.amount, 0);
  const totalGastos = gastos.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    totalReceitas,
    totalGastos,
    lucroLiquido: totalReceitas - totalGastos,
    qtdReceitas: receitas.length,
    qtdGastos: gastos.length,
  };
}

export function getByDay(entries: Entry[]): Record<string, { receitas: number; gastos: number; lucro: number }> {
  const byDay: Record<string, { receitas: number; gastos: number; lucro: number }> = {};
  
  for (const entry of entries) {
    if (!byDay[entry.date]) {
      byDay[entry.date] = { receitas: 0, gastos: 0, lucro: 0 };
    }
    if (entry.type === 'receita') {
      byDay[entry.date].receitas += entry.amount;
    } else {
      byDay[entry.date].gastos += entry.amount;
    }
    byDay[entry.date].lucro = byDay[entry.date].receitas - byDay[entry.date].gastos;
  }
  
  return byDay;
}
