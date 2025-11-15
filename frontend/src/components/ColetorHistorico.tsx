import React, { useEffect, useState } from 'react';
import api from '../apiFetch';
import './ColetorDashboard.css'; // Reutilizamos os estilos do Dashboard

// --- Estrutura de Dados do Histórico de Entregas (UI) ---
interface Entrega {
    id: string;
    dataEntrega: string;
    cooperativa: string;
    pesoTotalKg: number;
    status: 'Concluída' | 'Pendente' | 'Cancelada';
    detalhes: {
        material: string;
        pesoKg: number;
    }[];
}

// (Mocks removidos) Os dados agora vêm do backend via `minhasAceitas`.

// --- Componente: Histórico de Entregas (exibe coletas aceitas pelo coletor e mock) ---
const ColetorHistorico: React.FC = () => {
    const [minhasAceitas, setMinhasAceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await api.request('/api/coletas/minhas_coletor/');
                if (!mounted) return;
                if (!resp.ok) {
                    const txt = await resp.text().catch(() => '');
                    setError(`Erro ao buscar coletas do coletor: ${resp.status} ${txt}`);
                    setLoading(false);
                    return;
                }
                const data = await resp.json();
                const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
                setMinhasAceitas(list);
            } catch (err: any) {
                setError(String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const formatDateTime = (value: any, hoursToSubtract = 0) => {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        if (hoursToSubtract) d.setHours(d.getHours() - hoursToSubtract);
        const date = d.toLocaleDateString('pt-BR');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${date} ${hours}h${minutes}`;
    };

    return (
        <div className="historico-entregas-list">
            <h2>Histórico de Entregas à Cooperativa</h2>

            {/* Coletas aceitas pelo coletor logado */}
            <section style={{ marginBottom: '20px' }}>
                <h3>Coletas Aceitas por Você</h3>
                {loading && <div>Carregando suas coletas aceitas...</div>}
                {error && <div style={{ color: 'var(--danger, #c00)' }}>{error}</div>}
                {!loading && !error && minhasAceitas.length === 0 && (
                    <div>Você ainda não possui coletas aceitas.</div>
                )}
                {!loading && minhasAceitas.map((c) => (
                    <div key={c.id} className="entrega-card">
                        <h3>Solicitação #{c.id} <span className={`status-badge status-${String(c.status || '').toLowerCase()}`}>{c.status_display || c.status}</span></h3>
                        <p><strong>Produtor:</strong> {c.produtor?.nome || '—'}</p>
                        <p><strong>Início:</strong> {formatDateTime(c.inicio_coleta, 6)}</p>
                        <div style={{ marginTop: '8px' }}>
                            <strong>Itens:</strong>
                            {/* Se o backend não retornar itens na listagem, tentamos usar c.itens (populado abaixo) */}
                            {Array.isArray(c.itens) ? (
                                <ul>
                                    {c.itens.map((it: any, idx: number) => (
                                        <li key={it.id ?? it.id_item ?? idx}>
                                            {it.tipo_residuo ?? it.categoria ?? it.descricao ?? it.material ?? `Item ${idx + 1}`}
                                            {it.quantidade ? ` — ${it.quantidade}${it.unidade_medida ? ` ${it.unidade_medida}` : ''}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>{c.itens_count ?? 0} item(s)</p>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            {/* Nenhum mock: exibimos somente as coletas reais recuperadas do backend. */}
        </div>
    );
};

export default ColetorHistorico;