import React, { useState } from 'react';
import './Interesses.css'; // Novo CSS para esta tela
import { FaDollarSign, FaTrash, FaPlus } from 'react-icons/fa';

// Lista completa de categorias possíveis
const TODAS_CATEGORIAS = ['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico', 'Eletrônico', 'Outro'];

interface Interesse {
  categoria: string;
  preco: string; // Ex: "R$ 2,50/kg" ou "Sob consulta"
}

const GerenciarInteresses = () => {
  // Estado para guardar os interesses atuais (começa com dados de exemplo)
  const [interesses, setInteresses] = useState<Interesse[]>([
    { categoria: 'Plástico', preco: 'R$ 2,50/kg' },
    { categoria: 'Papel', preco: 'R$ 1,20/kg' },
    { categoria: 'Metal', preco: 'R$ 5,00/kg' },
  ]);

  // Estados para o formulário de adicionar novo interesse
  const [novaCategoria, setNovaCategoria] = useState(TODAS_CATEGORIAS[0]);
  const [novoPreco, setNovoPreco] = useState('');

  const handleAddInteresse = (e: React.FormEvent) => {
    e.preventDefault();
    // Verifica se a categoria já não foi adicionada
    if (interesses.some(i => i.categoria === novaCategoria)) {
      alert(`A categoria "${novaCategoria}" já está na lista.`);
      return;
    }
    if (!novoPreco.trim()) {
       alert(`Por favor, informe o preço ou "Sob consulta".`);
       return;
    }

    const novoInteresse: Interesse = { categoria: novaCategoria, preco: novoPreco };
    setInteresses(prev => [...prev, novoInteresse]); // Adiciona à lista

    // Limpa o formulário
    setNovaCategoria(TODAS_CATEGORIAS[0]);
    setNovoPreco('');
  };

  const handleRemoveInteresse = (categoriaParaRemover: string) => {
    setInteresses(prev => prev.filter(i => i.categoria !== categoriaParaRemover));
  };

  const handleSaveChanges = () => {
      // Lógica para chamar a API e salvar a lista 'interesses' no backend
      console.log("Salvando Interesses:", interesses);
      alert("Lista de interesses salva com sucesso!");
  }

  return (
    <div className="interesses-container">
      <h1>Gerenciar Materiais de Interesse</h1>
      <p>Defina quais materiais sua cooperativa aceita e os preços oferecidos.</p>

      {/* Formulário para Adicionar Novo Interesse */}
      <form className="add-interesse-form" onSubmit={handleAddInteresse}>
        <h3>Adicionar Novo Material</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="novaCategoria">Material</label>
            <select 
              id="novaCategoria" 
              value={novaCategoria} 
              onChange={(e) => setNovaCategoria(e.target.value)}
            >
              {TODAS_CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="novoPreco">Preço Oferecido (ex: R$ 2,50/kg)</label>
            <input 
              type="text" 
              id="novoPreco"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
              placeholder="R$ 0,00/kg ou Sob consulta"
              required
            />
          </div>
          <button type="submit" className="add-button"><FaPlus /> Adicionar</button>
        </div>
      </form>

      {/* Lista de Interesses Atuais */}
      <div className="lista-interesses">
        <h3>Materiais Aceitos Atualmente</h3>
        {interesses.length === 0 ? (
          <p>Nenhum material de interesse cadastrado.</p>
        ) : (
          interesses.map(interesse => (
            <div key={interesse.categoria} className="interesse-item">
              <span className="categoria-nome">{interesse.categoria}</span>
              <span className="categoria-preco"><FaDollarSign /> {interesse.preco}</span>
              <button 
                className="remove-button" 
                onClick={() => handleRemoveInteresse(interesse.categoria)}
              >
                <FaTrash /> Remover
              </button>
            </div>
          ))
        )}
      </div>

      {/* Botão para Salvar Alterações */}
      {interesses.length > 0 && (
          <button className="save-button cta-button" onClick={handleSaveChanges}>
              Salvar Alterações
          </button>
      )}
    </div>
  );
};

export default GerenciarInteresses;