import React from 'react';
import './HomeContent.css'; // Reutiliza estilos de container
import { FaStar } from 'react-icons/fa';
import HistoricoAvaliacoes from './HistoricoAvaliacoes';

// MOCK DE DADOS
const MOCK_AVALIACOES = [
  { id: 1, data: '20/11/2025', autor: 'Carlos Coletor', nota: 5, comentario: 'Muito organizado, materiais limpos.' },
  { id: 2, data: '18/11/2025', autor: 'Maria Coletora', nota: 4, comentario: 'Demorou um pouco para atender.' },
  { id: 3, data: '10/11/2025', autor: 'João Silva', nota: 5, comentario: 'Excelente!' },
  { id: 4, data: '05/11/2025', autor: 'Cooperativa Verde', nota: 5, comentario: 'Separação impecável.' },
];

const ProdutorAvaliacoes = () => {
  // Cálculo da média
  const media = MOCK_AVALIACOES.reduce((acc, curr) => acc + curr.nota, 0) / MOCK_AVALIACOES.length;

  return (
    <div className="home-content">
      <h1>Minha Reputação</h1>
      <p>Veja como você está sendo avaliado pelos coletores e cooperativas.</p>

      {/* Card de Destaque da Nota */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: 0, color: '#555', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Média Geral</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#2c3e50' }}>
                {media.toFixed(1)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ color: '#ffc107', fontSize: '1.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                        <FaStar key={i} color={i < Math.round(media) ? "#ffc107" : "#cbd3da"} />
                    ))}
                </div>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                    Baseado em {MOCK_AVALIACOES.length} avaliações
                </span>
            </div>
        </div>
      </div>

      {/* Lista de Histórico */}
      <HistoricoAvaliacoes 
        titulo="Histórico Completo" 
        avaliacoes={MOCK_AVALIACOES} 
      />
    </div>
  );
};

export default ProdutorAvaliacoes;