import React, { useState } from 'react';
import './HomeContent.css';
import { FaTrash } from 'react-icons/fa6';

// ATUALIZADO: Mapeamento de Categorias (apenas as 4 principais)
// Isso define o que o usuário VÊ (a Unidade)
const UNIDADES_VISUAIS: Record<string, string> = {
  'Plástico': 'Sacos (Volume)',
  'Papel': 'Sacos (Volume)',
  'Vidro': 'Unidades',
  'Metal': 'Unidades',
};
// Pega apenas os nomes das categorias para o <select>
const CATEGORIAS_DISPONIVEIS = Object.keys(UNIDADES_VISUAIS);

// Interface para um item na lista (frontend)
interface ItemDeColeta {
  id: string; // ID local, apenas para o React
  categoria: string;
  quantidade: number;
  unidade: string;
}

const ProdutorHome = () => {
  // --- Estados para o NOVO formulário ---
  
  const [itemCategoria, setItemCategoria] = useState(CATEGORIAS_DISPONIVEIS[0]);
  const [itemQuantidade, setItemQuantidade] = useState(1);
  const [listaItens, setListaItens] = useState<ItemDeColeta[]>([]);
  const [inicioColeta, setInicioColeta] = useState('');
  const [fimColeta, setFimColeta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [feedback, setFeedback] = useState('');

  // --- Funções do Formulário ---

  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    const unidadeVisual = UNIDADES_VISUAIS[itemCategoria];
    
    const novoItem: ItemDeColeta = {
      id: new Date().toISOString(),
      categoria: itemCategoria,
      quantidade: itemQuantidade,
      unidade: unidadeVisual,
    };

    setListaItens(prevLista => [...prevLista, novoItem]);
    
    setItemCategoria(CATEGORIAS_DISPONIVEIS[0]);
    setItemQuantidade(1);
    setFeedback('');
  };

  const handleRemoveItem = (idParaRemover: string) => {
    setListaItens(prevLista => prevLista.filter(item => item.id !== idParaRemover));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (listaItens.length === 0) {
      setFeedback('Erro: Adicione pelo menos um item à lista de coleta.');
      return;
    }
    if (!inicioColeta || !fimColeta) {
        setFeedback('Erro: Preencha os horários de início e fim da coleta.');
        return;
    }

    const itensParaAPI = listaItens.map(item => ({
      nome_residuo: item.categoria,
      quantidade: item.quantidade 
    }));

    const solicitacaoDeColeta = {
      itens: itensParaAPI,
      observacoes: observacoes,
      inicio_coleta: inicioColeta,
      fim_coleta: fimColeta,
    };

    console.log("NOVA SOLICITAÇÃO DE COLETA (enviando para API):", solicitacaoDeColeta);
    
    setFeedback(`Solicitação com ${listaItens.length} tipo(s) de item enviada com sucesso!`);
    
    setListaItens([]);
    setObservacoes('');
    setInicioColeta('');
    setFimColeta('');
  };

  return (
    <div className="home-content">
      <h1>Solicitar Nova Coleta</h1>
      <p>Adicione os materiais que você separou, um por um, e defina a quantidade.</p>
      
      <form className="coleta-form" onSubmit={handleSubmit}>
        
        {/* Seção 1: Adicionar Itens */}
        <fieldset className="form-section">
          <legend>1. Adicionar Itens</legend>
          <div className="add-item-form">
            
            <div className="form-group-vertical" style={{ flexGrow: 2 }}>
              <label htmlFor="itemCategoria">Categoria do Material</label>
              <select 
                id="itemCategoria" 
                value={itemCategoria} 
                onChange={(e) => setItemCategoria(e.target.value)}
              >
                {/* Esta lista agora só terá as 4 opções */}
                {CATEGORIAS_DISPONIVEIS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group-vertical" style={{ flexGrow: 1 }}>
              <label htmlFor="itemQuantidade">Quantidade</label>
              <input 
                type="number" 
                id="itemQuantidade"
                value={itemQuantidade}
                min="1"
                onChange={(e) => setItemQuantidade(Math.max(1, parseInt(e.target.value)))}
              />
            </div>

            <div className="form-group-vertical unit-display">
              <label>Unidade</label>
              <span>{UNIDADES_VISUAIS[itemCategoria]}</span>
            </div>

            <button type="button" onClick={handleAddItem} className="add-item-btn">Adicionar</button>
          </div>
        </fieldset>

        {/* Seção 2: Lista de Itens a Coletar */}
        <fieldset className="form-section">
          <legend>2. Itens a Coletar</legend>
          <div className="itens-list">
            {listaItens.length === 0 ? (
              <p className="lista-vazia-msg">Sua lista de coleta está vazia.</p>
            ) : (
              listaItens.map((item) => (
                <div key={item.id} className="item-adicionado">
                  <div className="item-info">
                    <span className="item-descricao">
                      {item.quantidade} {item.unidade}
                    </span>
                    <span className="item-categoria">{item.categoria}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="remove-item-btn">
                    <FaTrash /> Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </fieldset>

        {/* Seção 3: Detalhes Finais (COM CAMPOS DE HORA) */}
        <fieldset className="form-section">
          <legend>3. Detalhes Finais</legend>
          
          <div className="form-row-horizontal">
            <div className="form-group-vertical">
              <label htmlFor="inicioColeta">Disponível a partir de:</label>
              <input type="datetime-local" id="inicioColeta" value={inicioColeta} onChange={(e) => setInicioColeta(e.target.value)} required />
            </div>
            <div className="form-group-vertical">
              <label htmlFor="fimColeta">Disponível até:</label>
              <input type="datetime-local" id="fimColeta" value={fimColeta} onChange={(e) => setFimColeta(e.target.value)} required />
            </div>
          </div>

          <div className="form-group-vertical" style={{ marginTop: '20px' }}>
            <label htmlFor="observacoes">Observações (opcional):</label>
            <textarea 
              id="observacoes"
              placeholder="Ex: Sacos pesados, deixar na portaria, item frágil..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Seção 4: Envio */}
        <button type="submit" className="cta-button">Confirmar e Solicitar Coleta</button>

        {feedback && (
          <p className={`form-feedback ${feedback.includes('Erro') ? 'error' : 'success'}`}>
            {feedback}
          </p>
        )}
      </form>
    </div>
  );
};

export default ProdutorHome;