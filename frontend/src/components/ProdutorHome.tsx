import React, { useState } from 'react';
import './HomeContent.css'; // Usaremos o mesmo CSS e adicionaremos novos estilos

// Lista de CATEGORIAS (não mais de materiais)
const CATEGORIAS_DISPONIVEIS = [
  'Plástico',
  'Papel',
  'Vidro',
  'Metal',
  'Orgânico',
  'Eletrônico',
  'Outro', // Importante para itens não listados
];

// Tipo para um item que foi adicionado à lista
interface ItemDeColeta {
  id: string; // Para o React poder identificar cada item
  descricao: string;
  categoria: string;
}

const ProdutorHome = () => {
  // --- Estados para o NOVO formulário ---
  
  // Estados para o item que está sendo ADICIONADO AGORA
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemCategoria, setItemCategoria] = useState(CATEGORIAS_DISPONIVEIS[0]);

  // Estado para a LISTA de itens já adicionados
  const [listaItens, setListaItens] = useState<ItemDeColeta[]>([]);

  // Estados para os outros campos do formulário
  const [observacoes, setObservacoes] = useState('');
  const [feedback, setFeedback] = useState('');

  // --- Funções do Formulário ---

  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede o botão de submeter o formulário inteiro
    if (!itemDescricao.trim()) {
      setFeedback('Erro: Por favor, descreva o item antes de adicionar.');
      return;
    }

    const novoItem: ItemDeColeta = {
      id: new Date().toISOString(), // ID único baseado no tempo
      descricao: itemDescricao,
      categoria: itemCategoria,
    };

    setListaItens(prevLista => [...prevLista, novoItem]); // Adiciona o novo item à lista
    
    // Limpa os campos de input
    setItemDescricao('');
    setItemCategoria(CATEGORIAS_DISPONIVEIS[0]);
    setFeedback('');
  };

  const handleRemoveItem = (idParaRemover: string) => {
    setListaItens(prevLista => prevLista.filter(item => item.id !== idParaRemover));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (listaItens.length === 0) {
      setFeedback('Erro: Por favor, adicione pelo menos um item à lista de coleta.');
      return;
    }

    const solicitacaoDeColeta = {
      itens: listaItens,
      observacoes: observacoes,
      dataSolicitacao: new Date().toISOString()
    };

    // --- SIMULAÇÃO DA CHAMADA DE API ---
    console.log("NOVA SOLICITAÇÃO DE COLETA:", solicitacaoDeColeta);
    
    setFeedback(`Solicitação com ${listaItens.length} tipo(s) de item enviada com sucesso!`);
    
    // Limpar o formulário
    setListaItens([]);
    setObservacoes('');
  };

  return (
    <div className="home-content">
      <h1>Solicitar Nova Coleta</h1>
      <p>Adicione os itens que você separou, um por um, e classifique-os.</p>
      
      <form className="coleta-form" onSubmit={handleSubmit}>
        
        {/* Seção 1: Adicionar Itens */}
        <fieldset className="form-section">
          <legend>1. Adicionar Itens</legend>
          <div className="add-item-form">
            <div className="form-group-vertical" style={{ flexGrow: 2 }}>
              <label htmlFor="itemDescricao">Descrição do Item (ex: "5 garrafas PET", "1 caixa de papelão")</label>
              <input 
                type="text" 
                id="itemDescricao"
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
              />
            </div>
            <div className="form-group-vertical" style={{ flexGrow: 1 }}>
              <label htmlFor="itemCategoria">Categoria</label>
              <select 
                id="itemCategoria" 
                value={itemCategoria} 
                onChange={(e) => setItemCategoria(e.target.value)}
              >
                {CATEGORIAS_DISPONIVEIS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                    <span className="item-descricao">{item.descricao}</span>
                    <span className="item-categoria">{item.categoria}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="remove-item-btn">
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </fieldset>

        {/* Seção 3: Detalhes Finais */}
        <fieldset className="form-section">
          <legend>3. Detalhes Finais</legend>
          <div className="form-group-vertical">
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