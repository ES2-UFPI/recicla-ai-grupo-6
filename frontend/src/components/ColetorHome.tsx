import React, { useState } from 'react';
import './Coletas.css'; // Usaremos o mesmo CSS e adicionaremos novos estilos
import { FaMapMarkerAlt, FaBoxOpen, FaInfoCircle, FaTimes, FaWarehouse, FaCheck, FaStar } from 'react-icons/fa';

// --- NOVAS ESTRUTURAS DE DADOS DE EXEMPLO (MOCK DATA) ---

// Lista de Cooperativas disponíveis na região, com seus interesses e preços
const mockCooperativasDisponiveis = [
  {
    id: 'coop01',
    nome: 'Cooperativa Recicla Bem',
    endereco: 'Av. Industrial, 500, Bairro Industrial',
    materiaisInteresse: [
      { categoria: 'Plástico', preco: 'R$ 2,50/kg' },
      { categoria: 'Papel', preco: 'R$ 1,20/kg' },
      { categoria: 'Metal', preco: 'R$ 5,00/kg' },
    ],
  },
  {
    id: 'coop02',
    nome: 'Central Verde',
    endereco: 'Rua das Árvores, 99, Bairro Ecológico',
    materiaisInteresse: [
      { categoria: 'Vidro', preco: 'R$ 0,80/kg' },
      { categoria: 'Eletrônico', preco: 'Sob consulta' },
      { categoria: 'Papel', preco: 'R$ 1,35/kg' }, // Paga mais por Papel
    ],
  },
];

// Lista de Coletas, agora sem um destino pré-definido
const mockColetasDisponiveis = [
  {
    id: 'c001',
    distancia: '1.2 km',
    produtor: {
      nome: 'Ana Luiza',
      endereco: 'Rua das Flores, 123, Bairro Centro',
    },
    itens: [
      { id: 'i1', descricao: 'Cerca de 10 garrafas PET', categoria: 'Plástico' },
      { id: 'i2', descricao: 'Jornais e 1 caixa de papelão', categoria: 'Papel' },
    ],
  },
  {
    id: 'c002',
    distancia: '3.5 km',
    produtor: {
      nome: 'Mercado Bom Preço',
      endereco: 'Av. Principal, 1020, Bairro Sul',
    },
    itens: [
      { id: 'i3', descricao: 'Muitas caixas de papelão desmontadas', categoria: 'Papel' },
      { id: 'i4', descricao: 'Latas de alumínio (aprox. 2 sacos)', categoria: 'Metal' },
    ],
  },
];


const ColetorHome = () => {
  const [coletaSelecionada, setColetaSelecionada] = useState<typeof mockColetasDisponiveis[0] | null>(null);

  const handleAceitarColeta = (coletaId: string, cooperativaId: string) => {
    // Lógica para a chamada de API que aceita a coleta, agora informando o destino
    console.log(`Coleta ${coletaId} aceita! Destino: Cooperativa ${cooperativaId}`);
    alert(`Coleta ${coletaId} foi aceita com sucesso!`);
    setColetaSelecionada(null); // Fecha o modal após aceitar
  };

  return (
    <div className="coletas-disponiveis-container">
      <h1>Coletas Disponíveis Próximas a Você</h1>
      <div className="coletas-grid">
        {/* O grid de cards continua visualmente o mesmo */}
        {mockColetasDisponiveis.map((coleta) => (
          <div key={coleta.id} className="coleta-card">
            <div className="card-header">
              <h3>{coleta.produtor.nome}</h3>
              <span className="distancia-badge"><FaMapMarkerAlt /> {coleta.distancia}</span>
            </div>
            <p className="endereco-produtor">{coleta.produtor.endereco}</p>
            <div className="itens-preview"><FaBoxOpen /> {coleta.itens.length} tipo(s) de material</div>
            <div className="card-actions">
              <button className="details-button" onClick={() => setColetaSelecionada(coleta)}>
                <FaInfoCircle /> Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL ATUALIZADO DE DETALHES DA COLETA --- */}
      {coletaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setColetaSelecionada(null)}><FaTimes /></button>
            <h2>Detalhes da Coleta #{coletaSelecionada.id}</h2>

            <div className="modal-section">
              <h4>Produtor</h4>
              <p><strong>Nome:</strong> {coletaSelecionada.produtor.nome}</p>
              <p><strong>Endereço:</strong> {coletaSelecionada.produtor.endereco}</p>
            </div>

            <div className="modal-section">
              <h4>Itens a Coletar</h4>
              <ul className="modal-itens-list">
                {coletaSelecionada.itens.map(item => (
                  <li key={item.id}>
                    <span className="item-descricao">{item.descricao}</span>
                    <span className="item-categoria">{item.categoria}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- NOVA SEÇÃO: ESCOLHA DA COOPERATIVA --- */}
            <div className="modal-section">
              <h4><FaWarehouse /> Escolha uma Cooperativa para a Entrega</h4>
              <div className="cooperativas-sugeridas-list">
                {mockCooperativasDisponiveis.map(coop => {
                  // Lógica para encontrar quais itens desta coleta são de interesse da cooperativa
                  const itensDeInteresseNestaColeta = coletaSelecionada.itens.filter(itemDaColeta =>
                    coop.materiaisInteresse.some(itemDeInteresse => itemDeInteresse.categoria === itemDaColeta.categoria)
                  );

                  return (
                    <div key={coop.id} className="cooperativa-sugerida-card">
                      <div className="coop-card-header">
                        <h5>{coop.nome}</h5>
                        <span>{coop.endereco}</span>
                      </div>
                      <div className="coop-card-body">
                        <strong>Itens de interesse nesta coleta:</strong>
                        {itensDeInteresseNestaColeta.length > 0 ? (
                          <div className="itens-interesse-list">
                            {itensDeInteresseNestaColeta.map(item => {
                              const interesse = coop.materiaisInteresse.find(i => i.categoria === item.categoria);
                              return (
                                <div key={item.id} className="item-interesse">
                                  <FaStar className="star-icon" /> {item.categoria}
                                  <span className="preco-tag">{interesse?.preco}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="nenhum-interesse-msg">Nenhum item de alto interesse nesta coleta.</p>
                        )}
                      </div>
                      <div className="coop-card-footer">
                        <button className="accept-button" onClick={() => handleAceitarColeta(coletaSelecionada.id, coop.id)}>
                          Aceitar e Levar para esta Cooperativa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColetorHome;