import React from 'react';
    import './ColetorDashboard.css'; // Reutilizamos os estilos do Dashboard

    // --- Estrutura de Dados do Histórico de Entregas ---
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

    // --- Dados Setados para o Histórico (Mock Data) ---
    const mockHistoricoEntregas: Entrega[] = [
        {
            id: 'E001',
            dataEntrega: '2025-10-25',
            cooperativa: 'Reciclagem Teresina Sul',
            pesoTotalKg: 35.8,
            status: 'Concluída',
            detalhes: [
                { material: 'Plástico PET', pesoKg: 15.2 },
                { material: 'Papelão', pesoKg: 20.6 },
            ],
        },
        {
            id: 'E002',
            dataEntrega: '2025-10-18',
            cooperativa: 'Cooperativa Verde Piauí',
            pesoTotalKg: 51.0,
            status: 'Concluída',
            detalhes: [
                { material: 'Vidro', pesoKg: 45.0 },
                { material: 'Metal (Alumínio)', pesoKg: 6.0 },
            ],
        },
        {
            id: 'E003',
            dataEntrega: '2025-10-10',
            cooperativa: 'Reciclagem Teresina Sul',
            pesoTotalKg: 22.5,
            status: 'Pendente',
            detalhes: [
                { material: 'Plástico PET', pesoKg: 10.0 },
                { material: 'Papel Misto', pesoKg: 12.5 },
            ],
        },
    ];

    // --- Componente: Histórico de Entregas ---
    const ColetorHistorico: React.FC = () => {
        return (
            <div className="historico-entregas-list">
                <h2>Histórico de Entregas à Cooperativa</h2>
                {mockHistoricoEntregas.map((entrega) => (
                    <div key={entrega.id} className="entrega-card">
                        <h3>
                            Entrega #{entrega.id}
                            <span className={`status-badge status-${entrega.status.toLowerCase()}`}>{entrega.status}</span>
                        </h3>
                        <p>
                            <strong>Data:</strong> {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR')}
                        </p>
                        <p>
                            <strong>Cooperativa:</strong> {entrega.cooperativa}
                        </p>
                        <p>
                            <strong>Peso Total:</strong> {entrega.pesoTotalKg.toFixed(2)} Kg
                        </p>
                        <div style={{ marginTop: '10px' }}>
                            <strong>Materiais:</strong>
                            <ul>
                                {entrega.detalhes.map((det, index) => (
                                    <li key={index}>
                                        {det.material}: {det.pesoKg.toFixed(2)} Kg
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
                {mockHistoricoEntregas.length === 0 && (
                    <p>Nenhuma entrega registrada ainda.</p>
                )}
            </div>
        );
    };

    export default ColetorHistorico;