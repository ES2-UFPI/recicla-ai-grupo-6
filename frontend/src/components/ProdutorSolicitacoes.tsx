import React from 'react';
import './Solicitacoes.css'; // Novo CSS para esta tela

// Dados de exemplo (mock data) - No futuro, virão da API
const mockSolicitacoes = [
  { id: 's001', data: '2025-10-18', status: 'Coletado', coletor: 'Carlos Silva', itens: 3 },
  { id: 's002', data: '2025-10-19', status: 'Aguardando Coletor', coletor: null, itens: 5 },
  { id: 's003', data: '2025-10-20', status: 'Em Rota', coletor: 'Maria Souza', itens: 2 },
  { id: 's004', data: '2025-10-20', status: 'Cancelado', coletor: null, itens: 1 },
];

const ProdutorSolicitacoes = () => {
  return (
    <div className="solicitacoes-container">
      <h1>Minhas Solicitações de Coleta</h1>
      <p>Acompanhe o status das suas solicitações recentes.</p>

      <table className="solicitacoes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Status</th>
            <th>Coletor</th>
            <th>Itens</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {mockSolicitacoes.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada.</td>
            </tr>
          ) : (
            mockSolicitacoes.map(sol => (
              <tr key={sol.id}>
                <td>{sol.id}</td>
                <td>{new Date(sol.data).toLocaleDateString('pt-BR')}</td>
                <td>
                  <span className={`status-badge status-${sol.status.toLowerCase().replace(' ', '-')}`}>
                    {sol.status}
                  </span>
                </td>
                <td>{sol.coletor || '-'}</td>
                <td>{sol.itens}</td>
                <td>
                  <button className="action-button details-button">Detalhes</button>
                  {sol.status === 'Aguardando Coletor' && (
                     <button className="action-button cancel-button">Cancelar</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProdutorSolicitacoes;