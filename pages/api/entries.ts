import type { NextApiRequest, NextApiResponse } from 'next';
import { readEntries, addEntry, deleteEntry, getEntriesByDateRange, getSummary, getByDay } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { range, all } = req.query;

      if (all === 'true') {
        const entries = await readEntries();
        return res.status(200).json({ entries });
      }

      const days = range ? parseInt(range as string) : 30;
      const entries = await getEntriesByDateRange(days);
      const summary = getSummary(entries);
      const byDay = getByDay(entries);

      return res.status(200).json({ entries, summary, byDay });
    }

    if (req.method === 'POST') {
      const { date, type, category, description, amount } = req.body;

      if (!date || !type || !amount) {
        return res.status(400).json({ error: 'Campos obrigatórios: date, type, amount' });
      }

      if (type !== 'receita' && type !== 'gasto') {
        return res.status(400).json({ error: 'type deve ser receita ou gasto' });
      }

      const entry = await addEntry({
        date, type, amount: parseFloat(amount),
        category: category || (type === 'receita' ? 'Venda' : 'Material'),
        description: description || '',
      });

      return res.status(201).json({ entry });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });

      const deleted = await deleteEntry(id as string);
      if (!deleted) return res.status(404).json({ error: 'Entrada não encontrada' });

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
