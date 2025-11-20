import React, { useState } from 'react';
import './CooperativaHome.css'; // Reutilizando o CSS dos cards para manter o padrão
import { FaHistory, FaSearch, FaCalendarAlt, FaUser, FaBox, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// ==========================================
// DADOS MOCKADOS (Histórico)
// ==========================================
const MOCK_HISTORICO = [
  {
    id: 501,
    data: '19/11/2025 14:30',
    coletor: 'Carlos Oliveira',
    veiculo: 'Caminhão VUC - ABC-1234',
    itens: ['Papelão (50kg)', 'Plástico (20kg)'],
    status: 'CONCLUIDA',
    observacao: 'Recebido conforme o combinado.'
  },
  {
    id: 502,
    data: '19/11/2025 10:15',
    coletor: 'Maria Santos',
    veiculo: 'Fiat Fiorino - XYZ-9876',
    itens: ['Vidro (30kg)', 'Metal (10kg)'],
    status: 'CONCLUIDA',
    observacao: ''
  },
  {
    id: 498,
    data: '18/11/2025 16:45',
    coletor: 'João da Silva',
    veiculo: 'Kombi - KLJ-4567',
    itens: ['Eletrônicos (5un)'],
    status: 'REJEITADA',
    observacao: 'Material misturado com lixo orgânico. Impróprio para reciclagem.'
  },
  {
    id: 495,
    data: '18/11/2025 09:00',
    coletor: 'Carlos Oliveira',
    veiculo: 'Caminhão VUC - ABC-1234',
    itens: ['Papel Branco (100kg)'],
    status: 'CONCLUIDA',
    observacao: ''
  }
];

const CooperativaDashboard = () => {
  const [historico, setHistorico] = useState(MOCK_HISTORICO);
  const [filtro, setFiltro] = useState('');

  // Filtra por nome do coletor ou ID
  const historicoFiltrado = historico.filter(item => 
    item.coletor.toLowerCase().includes(filtro.toLowerCase()) ||
    item.id.toString().includes(filtro)
  );

  return (
    <div className="coop-container">
      {/* CABEÇALHO */}
      <div className="coop-header">
        <h1><FaHistory style={{ marginRight: '10px' }}/> Histórico de Operações</h1>
        <p>Consulte todas as entregas que já foram processadas pela sua cooperativa.</p>
      </div>

      {/* BARRA DE FILTRO */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FaSearch style={{ position: 'absolute', left: '15px', top: '14px', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Buscar por coletor ou ID..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      {/* LISTA DE HISTÓRICO */}
      <div className="entregas-list">
        {historicoFiltrado.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum registro encontrado.</p>
          </div>
        ) : (
          historicoFiltrado.map((item) => (
            <div className="entrega-card" key={item.id} style={{ borderLeft: item.status === 'REJEITADA' ? '5px solid #dc3545' : '5px solid #28a745' }}>
              
              {/* TOPO DO CARD */}
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>#{item.id}</span>
                  {item.status === 'CONCLUIDA' ? (
                    <span className="status-badge" style={{ background: '#d4edda', color: '#155724' }}>
                      <FaCheckCircle /> Concluída
                    </span>
                  ) : (
                    <span className="status-badge" style={{ background: '#f8d7da', color: '#721c24' }}>
                      <FaTimesCircle /> Rejeitada
                    </span>
                  )}
                </div>
                <div className="time-badge">
                  <FaCalendarAlt /> {item.data}
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="card-body" style={{ paddingBottom: '15px' }}>
                <div className="info-section">
                  <h4 style={{ fontSize: '0.95rem', color: '#777' }}>COLETOR</h4>
                  <div className="info-row" style={{ fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
                    <FaUser style={{ color: '#555' }} /> {item.coletor}
                  </div>
                  <div className="info-row" style={{ fontSize: '0.9rem' }}>
                    <small>{item.veiculo}</small>
                  </div>
                </div>

                <div className="info-section">
                  <h4 style={{ fontSize: '0.95rem', color: '#777' }}>CARGA</h4>
                  <div className="info-row">
                    <FaBox style={{ color: '#555' }} /> 
                    <span>{item.itens.join(', ')}</span>
                  </div>
                  {item.observacao && (
                    <div style={{ marginTop: '10px', background: '#fff3cd', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', color: '#856404' }}>
                      <strong>Obs:</strong> {item.observacao}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CooperativaDashboard;