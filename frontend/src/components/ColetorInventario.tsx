import React, { useState, useMemo } from 'react';
import './Inventario.css'; 
import { FaWarehouse, FaCheck, FaExchangeAlt, FaBoxOpen } from 'react-icons/fa';

// --- DADOS DE MOCK ---

// 1. Inventário que o coletor tem "na bolsa/caminhão"
const INVENTARIO_INICIAL = [
  { id: 'mat1', material: 'Plástico', quantidade: 15, unidade: 'Sacos' },
  { id: 'mat2', material: 'Papel', quantidade: 5, unidade: 'Fardos' },
  { id: 'mat3', material: 'Metal', quantidade: 30, unidade: 'Unidades (latas)' },
  { id: 'mat4', material: 'Vidro', quantidade: 50, unidade: 'Unidades (garrafas)' },
];

// 2. Cooperativas e suas tabelas de preço (Isso fará os valores mudarem)
const COOPERATIVAS = [
  {
    id: 'coop01',
    nome: 'Cooperativa Recicla Bem',
    tabelaPrecos: {
      'Plástico': 2.50, // Preço por unidade/saco
      'Papel': 1.35,
      'Metal': 0.50,
      'Vidro': 0.08
    }
  },
  {
    id: 'coop02',
    nome: 'Central Verde',
    tabelaPrecos: {
      'Plástico': 2.80, // Paga melhor no plástico
      'Papel': 1.20,
      'Metal': 0.55,
      'Vidro': 0.10
    }
  },
];

const ColetorInventario = () => {
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [coopId, setCoopId] = useState(COOPERATIVAS[0].id);

  // Encontra a cooperativa selecionada para pegar os preços
  const cooperativaSelecionada = COOPERATIVAS.find(c => c.id === coopId) || COOPERATIVAS[0];

  // Calcula os valores dinamicamente baseado na cooperativa escolhida
  const inventarioComValores = useMemo(() => {
    return inventario.map(item => {
      // Pega o preço unitário da tabela da cooperativa (ou 0 se não tiver)
      // @ts-ignore - ignorando erro de tipagem estrita do mock para agilidade
      const precoUnitario = cooperativaSelecionada.tabelaPrecos[item.material] || 0;
      const valorTotal = item.quantidade * precoUnitario;
      
      return {
        ...item,
        precoUnitario,
        valorTotalFormatted: `R$ ${valorTotal.toFixed(2).replace('.', ',')}`
      };
    });
  }, [inventario, cooperativaSelecionada]);

  // Calcula o total geral
  const valorTotalGeral = inventarioComValores.reduce((acc, item) => {
    // @ts-ignore
    return acc + (item.quantidade * (cooperativaSelecionada.tabelaPrecos[item.material] || 0));
  }, 0);

  // Ação de entregar um item específico
  const handleEntregarItem = (item: any) => {
    const confirmacao = window.confirm(
      `Confirmar entrega de ${item.quantidade} ${item.unidade} de ${item.material} para ${cooperativaSelecionada.nome}?`
    );

    if (confirmacao) {
      // Remove o item da lista local (Simulando a entrega)
      setInventario(prev => prev.filter(i => i.id !== item.id));
      alert(`Entrega de ${item.material} registrada com sucesso!`);
    }
  };

  return (
    <div className="inventario-container">
      <h1>Meu Inventário Atual</h1>
      <p>Materiais sob sua posse. Selecione a cooperativa para ver a cotação atual.</p>

      {/* SELETOR DE COOPERATIVA (Agora no topo) */}
      <div className="coop-selector-card">
        <label><FaWarehouse /> Cotação para entrega em:</label>
        <div className="select-wrapper">
            <select value={coopId} onChange={(e) => setCoopId(e.target.value)}>
            {COOPERATIVAS.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
            </select>
        </div>
        <p className="coop-info-text">
            <FaExchangeAlt style={{ marginRight: 5 }}/> 
            Os valores estimados mudam conforme a tabela de preços desta cooperativa.
        </p>
      </div>

      {/* TABELA DE ITENS */}
      <table className="inventario-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Quantidade</th>
            <th>Valor Estimado</th>
            <th style={{ textAlign: 'center' }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {inventarioComValores.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                <FaBoxOpen size={30} style={{ marginBottom: '10px', display: 'block', margin: '0 auto' }}/>
                Seu inventário está vazio. Você entregou tudo!
              </td>
            </tr>
          ) : (
            inventarioComValores.map(item => (
              <tr key={item.id}>
                <td><strong>{item.material}</strong></td>
                <td>{item.quantidade} {item.unidade}</td>
                <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>{item.valorTotalFormatted}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn-entregar-item" 
                    onClick={() => handleEntregarItem(item)}
                    title="Entregar este item e remover do inventário"
                  >
                    <FaCheck /> Entregar
                  </button>
                </td>
              </tr>
            ))
          )}
          
          {/* Rodapé com Total */}
          {inventarioComValores.length > 0 && (
            <tr className="table-footer-total">
                <td colSpan={2} style={{ textAlign: 'right' }}>Total Estimado nesta Cooperativa:</td>
                <td colSpan={2} className="total-value">
                    R$ {valorTotalGeral.toFixed(2).replace('.', ',')}
                </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ColetorInventario;