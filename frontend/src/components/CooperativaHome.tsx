import React, { useState } from 'react';
import './CooperativaHome.css'; // Importando o CSS novo
import { FaTruck, FaUser, FaMapMarkerAlt, FaCheckCircle, FaBoxOpen, FaClock, FaClipboardCheck } from 'react-icons/fa';

// ==========================================
// DADOS MOCKADOS (Simulando o Backend)
// ==========================================
const MOCK_ENTREGAS_PENDENTES = [
  {
    id: 101,
    status: 'AGUARDANDO', // Status que vem do Coletor
    horario_chegada: 'Há 5 minutos',
    coletor: {
      nome: 'Carlos Oliveira',
      veiculo: 'Caminhão VUC - Placa ABC-1234',
      telefone: '(86) 99999-1111',
      foto: 'https://via.placeholder.com/50'
    },
    produtor: {
      nome: 'Mercadinho do João',
      endereco: 'Rua das Flores, 123, Centro',
      tipo: 'Comércio'
    },
    itens: [
      { tipo: 'Papelão', quantidade: '50kg' },
      { tipo: 'Plástico PET', quantidade: '20kg' }
    ]
  },
  {
    id: 102,
    status: 'AGUARDANDO',
    horario_chegada: 'Há 15 minutos',
    coletor: {
      nome: 'Maria Santos',
      veiculo: 'Fiat Fiorino - Placa XYZ-9876',
      telefone: '(86) 98888-2222',
      foto: 'https://via.placeholder.com/50'
    },
    produtor: {
      nome: 'Condomínio Jardins',
      endereco: 'Av. Principal, 500, Zona Leste',
      tipo: 'Residencial'
    },
    itens: [
      { tipo: 'Vidro', quantidade: '30kg' },
      { tipo: 'Metal', quantidade: '10kg' },
      { tipo: 'Papel Branco', quantidade: '15kg' }
    ]
  }
];

const CooperativaHome = () => {
  // Estado com os dados mockados
  const [entregas, setEntregas] = useState(MOCK_ENTREGAS_PENDENTES);

  // Função para confirmar recebimento
  const handleConfirmarRecebimento = (id: number, nomeColetor: string) => {
    const confirmacao = window.confirm(`Confirma o recebimento dos materiais de ${nomeColetor}?`);
    
    if (confirmacao) {
      // Simula uma chamada API
      console.log(`Enviando PATCH para /api/coletas/${id}/status/ com { status: 'CONCLUIDA' }`);
      
      // Remove da lista visualmente
      setEntregas(prev => prev.filter(item => item.id !== id));
      
      alert("Entrega confirmada com sucesso! O status foi atualizado para CONCLUÍDA.");
    }
  };

  return (
    <div className="coop-container">
      <div className="coop-header">
        <h1><FaClipboardCheck style={{ marginRight: '10px' }}/>Recebimento de Entregas</h1>
        <p>Confirme a chegada dos coletores e o recebimento dos materiais.</p>
      </div>

      {entregas.length === 0 ? (
        <div className="empty-state">
          <FaCheckCircle size={50} color="#28a745" style={{ marginBottom: '20px' }} />
          <h3>Tudo limpo por aqui!</h3>
          <p>Não há entregas aguardando confirmação no momento.</p>
        </div>
      ) : (
        <div className="entregas-list">
          {entregas.map((entrega) => (
            <div className="entrega-card" key={entrega.id}>
              
              {/* CABEÇALHO DO CARD */}
              <div className="card-header">
                <div className="status-badge">
                  <FaTruck /> Aguardando Confirmação
                </div>
                <div className="time-badge">
                  <FaClock /> Chegou: {entrega.horario_chegada}
                </div>
              </div>

              {/* CORPO DO CARD */}
              <div className="card-body">
                
                {/* LADO ESQUERDO: INFO DO COLETOR */}
                <div className="info-section">
                  <h4><FaUser /> Dados do Coletor</h4>
                  <div className="info-row">
                    <strong>Nome:</strong> {entrega.coletor.nome}
                  </div>
                  <div className="info-row">
                    <strong>Veículo:</strong> {entrega.coletor.veiculo}
                  </div>
                  <div className="info-row">
                    <strong>Contato:</strong> {entrega.coletor.telefone}
                  </div>
                </div>

                {/* LADO DIREITO: INFO DA COLETA */}
                <div className="info-section">
                  <h4><FaBoxOpen /> Detalhes da Carga</h4>
                  <div className="info-row">
                    <FaMapMarkerAlt /> 
                    <span>Origem: <strong>{entrega.produtor.nome}</strong><br/>
                    <small>{entrega.produtor.endereco}</small></span>
                  </div>
                  
                  <div className="itens-list">
                    <strong>Materiais declarados:</strong><br/>
                    <div style={{ marginTop: '8px' }}>
                      {entrega.itens.map((item, idx) => (
                        <span key={idx} className="item-tag">
                          {item.tipo} ({item.quantidade})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* RODAPÉ: AÇÃO */}
              <div className="card-actions">
                <button 
                  className="btn-confirmar" 
                  onClick={() => handleConfirmarRecebimento(entrega.id, entrega.coletor.nome)}
                >
                  <FaCheckCircle /> Confirmar Recebimento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CooperativaHome;