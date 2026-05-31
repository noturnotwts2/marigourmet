import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

interface Entry {
  id: string;
  date: string;
  type: 'receita' | 'gasto';
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface DaySummary { receitas: number; gastos: number; lucro: number; }
interface Summary {
  totalReceitas: number;
  totalGastos: number;
  lucroLiquido: number;
  qtdReceitas: number;
  qtdGastos: number;
}

const CATEGORIAS_RECEITA = ['Total do Dia', 'Geladinho', 'Bolo de Pote', 'Combo', 'Outros'];
const CATEGORIAS_GASTO = ['Total do Dia', 'Ingredientes', 'Embalagens', 'Gás/Energia', 'Transporte', 'Outros'];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const today = () => new Date().toISOString().split('T')[0];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lancamentos' | 'historico' | 'dicas'>('dashboard');
  const [range, setRange] = useState(30);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byDay, setByDay] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    date: today(),
    type: 'receita' as 'receita' | 'gasto',
    category: 'Total do Dia',
    description: '',
    amount: '',
  });
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rangeRes, allRes] = await Promise.all([
        fetch(`/api/entries?range=${range}`),
        fetch('/api/entries?all=true'),
      ]);
      const rangeData = await rangeRes.json();
      const allData = await allRes.json();
      setEntries(rangeData.entries || []);
      setSummary(rangeData.summary || null);
      setByDay(rangeData.byDay || {});
      setAllEntries(allData.entries || []);
    } catch {
      showToast('Erro ao carregar dados', 'error');
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      showToast('Digite um valor válido', 'error'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error();
      showToast(form.type === 'receita' ? '💰 Receita adicionada!' : '🛒 Gasto registrado!');
      setForm({ date: today(), type: 'receita', category: 'Geladinho', description: '', amount: '' });
      fetchData();
    } catch {
      showToast('Erro ao salvar', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
      showToast('Entrada removida');
      fetchData();
    } catch {
      showToast('Erro ao remover', 'error');
    }
    setDeleting(null);
  };

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const formatCalDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedDayEntries = selectedDay ? allEntries.filter(e => e.date === selectedDay) : [];
  const selectedDaySummary = selectedDay ? (() => {
    const r = selectedDayEntries.filter(e => e.type === 'receita').reduce((s, e) => s + e.amount, 0);
    const g = selectedDayEntries.filter(e => e.type === 'gasto').reduce((s, e) => s + e.amount, 0);
    return { receitas: r, gastos: g, lucro: r - g };
  })() : null;

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <>
      <Head>
        <title>MariGourmet — Controle Financeiro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#F2527A" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍡</text></svg>" />
      </Head>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #F2527A 0%, #C73060 60%, #3D1A0A 100%)',
        padding: '0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 24px rgba(61,26,10,0.25)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>🍡</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: 26, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                MariGourmet
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Controle Financeiro
              </div>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {([
            { key: 'dashboard', label: '📊 Dashboard', },
            { key: 'lancamentos', label: '➕ Lançamentos', },
            { key: 'historico', label: '📋 Histórico', },
            { key: 'dicas', label: '💡 Dicas', },
          ] as const).map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '14px 8px', background: 'transparent',
                color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.65)',
                fontWeight: activeTab === tab.key ? 700 : 400,
                fontSize: 13, borderBottom: activeTab === tab.key ? '3px solid white' : '3px solid transparent',
                transition: 'all 0.2s',
              }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: '32px 0 80px', minHeight: 'calc(100vh - 120px)' }}>
        <div className="container">

          {/* ─── DASHBOARD ─── */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Range selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 28, color: 'var(--chocolate)' }}>Visão Geral</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[30, 60, 90].map(d => (
                    <button key={d} onClick={() => setRange(d)}
                      style={{
                        padding: '8px 18px', borderRadius: 10,
                        background: range === d ? 'var(--rosa)' : 'var(--branco)',
                        color: range === d ? 'white' : 'var(--texto)',
                        fontWeight: 600, fontSize: 14,
                        boxShadow: range === d ? '0 4px 12px rgba(242,82,122,0.35)' : 'var(--sombra)',
                      }}>
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--texto-suave)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                  <p>Carregando dados...</p>
                </div>
              ) : (
                <>
                  {/* Cards de resumo */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                    <SummaryCard
                      emoji="💰" label="Receita Bruta"
                      value={summary?.totalReceitas || 0} color="var(--verde)"
                      sub={`${summary?.qtdReceitas || 0} vendas`}
                    />
                    <SummaryCard
                      emoji="🛒" label="Gastos"
                      value={summary?.totalGastos || 0} color="var(--vermelho)"
                      sub={`${summary?.qtdGastos || 0} compras`}
                    />
                    <SummaryCard
                      emoji="✨" label="Lucro Líquido"
                      value={summary?.lucroLiquido || 0}
                      color={(summary?.lucroLiquido || 0) >= 0 ? 'var(--rosa)' : 'var(--vermelho)'}
                      sub={`Últimos ${range} dias`}
                      highlight
                    />
                    <SummaryCard
                      emoji="📈" label="Margem de Lucro"
                      value={summary?.totalReceitas ? ((summary.lucroLiquido / summary.totalReceitas) * 100) : 0}
                      color="var(--dourado)" isPercent
                      sub="Receita líquida / bruta"
                    />
                  </div>

                  {/* Barra de progresso receita vs gasto */}
                  {summary && summary.totalReceitas > 0 && (
                    <div className="card" style={{ marginBottom: 28 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16, color: 'var(--chocolate)' }}>
                        💹 Receita vs. Gastos
                      </div>
                      <div style={{ height: 14, background: 'var(--creme-escuro)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, (summary.totalGastos / summary.totalReceitas) * 100)}%`,
                          background: 'linear-gradient(90deg, var(--vermelho), #ff6b6b)',
                          borderRadius: 99, transition: 'width 1s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--texto-suave)' }}>
                        <span>Gastos: {((summary.totalGastos / summary.totalReceitas) * 100).toFixed(1)}% da receita</span>
                        <span>Sobra: {((summary.lucroLiquido / summary.totalReceitas) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Gráfico de barras por dia */}
                  {Object.keys(byDay).length > 0 && (
                    <div className="card" style={{ marginBottom: 28 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 20, color: 'var(--chocolate)' }}>
                        📅 Desempenho Diário
                      </div>
                      <MiniBarChart byDay={byDay} />
                    </div>
                  )}

                  {/* Calendário */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--chocolate)' }}>
                        📆 Calendário de Receitas
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn-secondary" style={{ padding: '6px 14px' }}
                          onClick={() => setCalMonth(p => {
                            const d = new Date(p.year, p.month - 1, 1);
                            return { year: d.getFullYear(), month: d.getMonth() };
                          })}>‹</button>
                        <span style={{ fontWeight: 600, fontSize: 15, minWidth: 140, textAlign: 'center' }}>
                          {MONTH_NAMES[calMonth.month]} {calMonth.year}
                        </span>
                        <button className="btn-secondary" style={{ padding: '6px 14px' }}
                          onClick={() => setCalMonth(p => {
                            const d = new Date(p.year, p.month + 1, 1);
                            return { year: d.getFullYear(), month: d.getMonth() };
                          })}>›</button>
                      </div>
                    </div>

                    <Calendar
                      year={calMonth.year} month={calMonth.month}
                      byDay={byDay} allByDay={getByDayAll(allEntries)}
                      onSelect={(date) => { setSelectedDay(date); setModalOpen(true); }}
                    />

                    <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 12, color: 'var(--texto-suave)', flexWrap: 'wrap' }}>
                      <span>🟢 Lucro positivo</span>
                      <span>🔴 Prejuízo</span>
                      <span>🟡 Só receitas ou gastos</span>
                      <span style={{ color: 'var(--rosa)' }}>● Hoje</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── LANÇAMENTOS ─── */}
          {activeTab === 'lancamentos' && (
            <div>
              <h2 style={{ fontSize: 28, color: 'var(--chocolate)', marginBottom: 8 }}>Novo Lançamento</h2>
              <p style={{ color: 'var(--texto-suave)', marginBottom: 28, fontSize: 15 }}>
                Registre suas vendas do dia e gastos com materiais
              </p>

              {/* Tipo toggle */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setForm(f => ({ ...f, type: 'receita', category: 'Total do Dia' }))}
                  style={{
                    flex: 1, padding: '18px', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700,
                    background: form.type === 'receita' ? 'linear-gradient(135deg, #4CAF7D, #2E7D52)' : 'var(--branco)',
                    color: form.type === 'receita' ? 'white' : 'var(--texto)',
                    boxShadow: form.type === 'receita' ? '0 4px 20px rgba(76,175,125,0.4)' : 'var(--sombra)',
                    transition: 'all 0.25s',
                  }}>
                  💰 Receita de Venda
                </button>
                <button onClick={() => setForm(f => ({ ...f, type: 'gasto', category: 'Total do Dia' }))}
                  style={{
                    flex: 1, padding: '18px', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700,
                    background: form.type === 'gasto' ? 'linear-gradient(135deg, #E53935, #B71C1C)' : 'var(--branco)',
                    color: form.type === 'gasto' ? 'white' : 'var(--texto)',
                    boxShadow: form.type === 'gasto' ? '0 4px 20px rgba(229,57,53,0.4)' : 'var(--sombra)',
                    transition: 'all 0.25s',
                  }}>
                  🛒 Gasto de Material
                </button>
              </div>

              <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                  <div>
                    <label>📅 Data</label>
                    <input type="date" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      max={today()} />
                  </div>
                  <div>
                    <label>🏷️ Categoria</label>
                    <select value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {(form.type === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_GASTO).map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>💵 Valor (R$)</label>
                    <input type="number" placeholder="0,00" step="0.01" min="0"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label>📝 Descrição (opcional)</label>
                    <input type="text" placeholder={form.type === 'receita' ? 'Ex: 20 geladinhos' : 'Ex: leite condensado'}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={saving}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 24, fontSize: 16, padding: '16px', opacity: saving ? 0.7 : 1 }}>
                  {saving ? '⏳ Salvando...' : form.type === 'receita' ? '💰 Registrar Receita' : '🛒 Registrar Gasto'}
                </button>
              </div>

              {/* Atalhos rápidos */}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--chocolate)', marginBottom: 14 }}>
                  ⚡ Lançamentos Rápidos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { emoji: '📊', label: 'Total do Dia', type: 'receita' as const, cat: 'Total do Dia' },
                    { emoji: '🍡', label: 'Geladinho', type: 'receita' as const, cat: 'Geladinho' },
                    { emoji: '🍫', label: 'Bolo de Pote', type: 'receita' as const, cat: 'Bolo de Pote' },
                    { emoji: '🎁', label: 'Combo', type: 'receita' as const, cat: 'Combo' },
                    { emoji: '🛒', label: 'Total Gastos', type: 'gasto' as const, cat: 'Total do Dia' },
                    { emoji: '🥛', label: 'Ingredientes', type: 'gasto' as const, cat: 'Ingredientes' },
                    { emoji: '📦', label: 'Embalagens', type: 'gasto' as const, cat: 'Embalagens' },
                    { emoji: '🔥', label: 'Gás/Energia', type: 'gasto' as const, cat: 'Gás/Energia' },
                  ].map(q => (
                    <button key={q.label}
                      onClick={() => { setForm(f => ({ ...f, type: q.type, category: q.cat })); }}
                      style={{
                        padding: '14px 10px', borderRadius: 14,
                        background: q.type === 'receita' ? 'linear-gradient(135deg, #E8F8F0, #C8EDD9)' : 'linear-gradient(135deg, #FFF0EE, #FFD5D0)',
                        color: q.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)',
                        fontSize: 13, fontWeight: 600, textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{q.emoji}</div>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── HISTÓRICO ─── */}
          {activeTab === 'historico' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 28, color: 'var(--chocolate)' }}>Histórico Completo</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[30, 60, 90].map(d => (
                    <button key={d} onClick={() => setRange(d)}
                      style={{
                        padding: '8px 18px', borderRadius: 10,
                        background: range === d ? 'var(--rosa)' : 'var(--branco)',
                        color: range === d ? 'white' : 'var(--texto)',
                        fontWeight: 600, fontSize: 14,
                        boxShadow: range === d ? '0 4px 12px rgba(242,82,122,0.35)' : 'var(--sombra)',
                      }}>
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              {entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
                  <p style={{ color: 'var(--texto-suave)', fontSize: 16 }}>Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...entries].reverse().map(entry => (
                    <div key={entry.id} className="card" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', gap: 12,
                      borderLeft: `4px solid ${entry.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 28 }}>
                          {entry.type === 'receita' ? '💰' : '🛒'}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {entry.category}
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 99,
                              background: entry.type === 'receita' ? 'var(--verde-claro)' : 'var(--vermelho-claro)',
                              color: entry.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)',
                              fontWeight: 700, textTransform: 'uppercase',
                            }}>
                              {entry.type}
                            </span>
                          </div>
                          {entry.description && (
                            <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 2 }}>{entry.description}</div>
                          )}
                          <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 2 }}>
                            {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 17, fontWeight: 800,
                          color: entry.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.type === 'receita' ? '+' : '-'}{fmt(entry.amount)}
                        </span>
                        <button className="btn-danger"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          title="Remover">
                          {deleting === entry.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── DICAS ─── */}
          {activeTab === 'dicas' && (
            <div>
              <h2 style={{ fontSize: 28, color: 'var(--chocolate)', marginBottom: 8 }}>💡 Dicas para seu Negócio</h2>
              <p style={{ color: 'var(--texto-suave)', marginBottom: 28 }}>Estratégias para crescer a MariGourmet</p>
              <div style={{ display: 'grid', gap: 16 }}>
                {DICAS.map((d, i) => (
                  <div key={i} className="card" style={{ borderLeft: `4px solid ${d.color}` }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{d.emoji}</span>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--chocolate)', marginBottom: 8 }}>{d.titulo}</div>
                        <p style={{ color: 'var(--texto-suave)', fontSize: 14, lineHeight: 1.7 }}>{d.texto}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal dia */}
      {modalOpen && selectedDay && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(61,26,10,0.55)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          backdropFilter: 'blur(4px)',
        }}
          onClick={() => setModalOpen(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--chocolate)' }}>
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button onClick={() => setModalOpen(false)} style={{
                background: 'var(--creme-escuro)', width: 32, height: 32, borderRadius: 99,
                fontWeight: 700, fontSize: 16, color: 'var(--texto)',
              }}>×</button>
            </div>

            {selectedDaySummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                <MiniStat label="Receita" value={selectedDaySummary.receitas} color="var(--verde)" />
                <MiniStat label="Gastos" value={selectedDaySummary.gastos} color="var(--vermelho)" />
                <MiniStat label="Lucro" value={selectedDaySummary.lucro} color="var(--rosa)" />
              </div>
            )}

            {selectedDayEntries.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: 24 }}>Nenhum lançamento neste dia</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDayEntries.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--creme)', borderRadius: 10,
                    borderLeft: `3px solid ${e.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)'}`,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{e.category}</span>
                      {e.description && <span style={{ color: 'var(--texto-suave)', fontSize: 12, marginLeft: 6 }}>— {e.description}</span>}
                    </div>
                    <span style={{ fontWeight: 700, color: e.type === 'receita' ? 'var(--verde)' : 'var(--vermelho)' }}>
                      {e.type === 'receita' ? '+' : '-'}{fmt(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}

// ─── Componentes auxiliares ───

function SummaryCard({ emoji, label, value, color, sub, highlight, isPercent }:
  { emoji: string; label: string; value: number; color: string; sub?: string; highlight?: boolean; isPercent?: boolean }) {
  return (
    <div className="card" style={{
      background: highlight ? `linear-gradient(135deg, #fff5f7, #ffe0e8)` : undefined,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 13, color: 'var(--texto-suave)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Playfair Display', serif" }}>
        {isPercent ? `${value.toFixed(1)}%` : fmt(value)}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', background: 'var(--creme)', borderRadius: 12, padding: '10px 6px' }}>
      <div style={{ fontSize: 11, color: 'var(--texto-suave)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{fmt(value)}</div>
    </div>
  );
}

function MiniBarChart({ byDay }: { byDay: Record<string, DaySummary> }) {
  const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  if (!days.length) return null;
  const maxVal = Math.max(...days.map(([, d]) => Math.max(d.receitas, 1)));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, overflowX: 'auto' }}>
      {days.map(([date, d]) => (
        <div key={date} style={{ flex: 1, minWidth: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', background: d.lucro >= 0 ? 'var(--verde)' : 'var(--vermelho)',
            borderRadius: '6px 6px 0 0',
            height: `${Math.max(4, (d.receitas / maxVal) * 80)}px`,
            transition: 'height 0.5s ease',
            opacity: 0.85,
          }} title={`${date}: ${fmt(d.receitas)}`} />
          <div style={{ fontSize: 9, color: 'var(--texto-suave)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {date.slice(8)}
          </div>
        </div>
      ))}
    </div>
  );
}

function getByDayAll(entries: Entry[]): Record<string, DaySummary> {
  const byDay: Record<string, DaySummary> = {};
  for (const e of entries) {
    if (!byDay[e.date]) byDay[e.date] = { receitas: 0, gastos: 0, lucro: 0 };
    if (e.type === 'receita') byDay[e.date].receitas += e.amount;
    else byDay[e.date].gastos += e.amount;
    byDay[e.date].lucro = byDay[e.date].receitas - byDay[e.date].gastos;
  }
  return byDay;
}

function Calendar({ year, month, byDay, allByDay, onSelect }: {
  year: number; month: number;
  byDay: Record<string, DaySummary>;
  allByDay: Record<string, DaySummary>;
  onSelect: (date: string) => void;
}) {
  const todayStr = today();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--texto-suave)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const data = allByDay[dateStr];
          const isToday = dateStr === todayStr;
          const hasData = !!data;
          const isPositive = data && data.lucro >= 0;

          return (
            <button key={dateStr} onClick={() => onSelect(dateStr)}
              style={{
                padding: '6px 2px', borderRadius: 10, textAlign: 'center',
                background: isToday
                  ? 'linear-gradient(135deg, var(--rosa), var(--rosa-escuro))'
                  : hasData
                    ? isPositive ? 'linear-gradient(135deg, #e8f8f0, #c8edd9)' : 'linear-gradient(135deg, #fff0ee, #ffd5d0)'
                    : 'var(--creme)',
                color: isToday ? 'white' : 'var(--texto)',
                border: isToday ? 'none' : hasData ? `1.5px solid ${isPositive ? 'var(--verde)' : 'var(--vermelho)'}` : '1.5px solid transparent',
                transition: 'all 0.15s',
                cursor: 'pointer',
                minHeight: 54,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
              <div style={{ fontSize: 14, fontWeight: isToday ? 800 : 500 }}>{day}</div>
              {data && (
                <div style={{ fontSize: 9, fontWeight: 700, color: isToday ? 'rgba(255,255,255,0.9)' : isPositive ? 'var(--verde)' : 'var(--vermelho)', lineHeight: 1 }}>
                  {fmt(data.receitas).replace('R$\u00a0', 'R$')}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DICAS = [
  {
    emoji: '📦', titulo: 'Controle seu estoque', color: 'var(--rosa)',
    texto: 'Antes de fazer compras, verifique o que já tem em casa. Manter um estoque mínimo dos ingredientes mais usados (leite condensado, creme de leite, copinhos) evita desperdício e compras de emergência mais caras.',
  },
  {
    emoji: '💲', titulo: 'Precifique corretamente', color: 'var(--dourado)',
    texto: 'Regra geral: o preço de venda deve ser pelo menos 3x o custo de ingredientes. Ex: se o geladinho custa R$1,00 de ingrediente, venda por no mínimo R$3,00. Isso cobre embalagem, energia, seu tempo e ainda gera lucro.',
  },
  {
    emoji: '📱', titulo: 'Use o WhatsApp a seu favor', color: 'var(--verde)',
    texto: 'Status do WhatsApp todo dia com fotos bonitas dos produtos. Crie uma lista de transmissão com seus clientes. Ofereça encomendas antecipadas com 10% de desconto para quem pedir antes das 18h do dia anterior.',
  },
  {
    emoji: '🗓️', titulo: 'Registre todos os dias', color: 'var(--rosa-escuro)',
    texto: 'Mesmo nos dias que você achar que foi pouco, registre. Só assim você terá uma visão real do seu negócio. Tente registrar logo após fechar as vendas do dia, ainda fresco na memória.',
  },
  {
    emoji: '🎯', titulo: 'Defina uma meta semanal', color: 'var(--chocolate-medio)',
    texto: 'Com seus dados dos últimos 30 dias, calcule sua média diária e defina uma meta 20% acima. Metas claras motivam e ajudam a perceber quando algo está errado antes que vire problema.',
  },
  {
    emoji: '🤝', titulo: 'Parcerias com comércios locais', color: 'var(--verde)',
    texto: 'Negocie com barbearias, salões de beleza e academias próximas para deixar seus produtos à venda. Combine um percentual de 15-20% para eles. Isso expande seu alcance sem custo fixo.',
  },
  {
    emoji: '📊', titulo: 'Acompanhe sua margem', color: 'var(--rosa)',
    texto: 'Margem acima de 60% é excelente para esse tipo de negócio. Se estiver abaixo de 40%, revise seus preços ou busque fornecedores mais baratos. Use o Dashboard para monitorar isso mensalmente.',
  },
];
