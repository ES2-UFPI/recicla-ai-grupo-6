import React, { useState } from 'react';
    import './Inventario.css'; // Nosso novo arquivo CSS
    import { FaWarehouse, FaCheckSquare, FaMoneyBillWave } from 'react-icons/fa';

    // --- DADOS DE EXEMPLO (MOCK DATA) ---
    // No futuro, isso viria de um estado global ou API,
    // com base nas coletas que o usuário "Aceitou"
    const mockInventario = [
      { id: 'mat1', material: 'Plástico', quantidade: 15, unidade: 'Sacos', valorEstimado: 'R$ 37,50' },
      { id: 'mat2', material: 'Papel', quantidade: 5, unidade: 'Fardos', valorEstimado: 'R$ 6,75' },
      { id: 'mat3', material: 'Metal', quantidade: 30, unidade: 'Unidades (latas)', valorEstimado: 'R$ 15,00' },
      { id: 'mat4', material: 'Vidro', quantidade: 50, unidade: 'Unidades (garrafas)', valorEstimado: 'R$ 4,00' },
    ];

    // Simula as cooperativas para onde ele pode levar
    const cooperativasDestino = [
      { id: 'coop01', nome: 'Cooperativa Recicla Bem' },
      { id: 'coop02', nome: 'Central Verde' },
    ];

    const ColetorInventario = () => {
      const [destino, setDestino] = useState(cooperativasDestino[0].id);

      const handleEntregarMateriais = () => {
        // Lógica para chamar a API e "esvaziar" o inventário,
        // registrando a entrega na cooperativa selecionada.
        console.log(`Entregando inventário na cooperativa ${destino}...`);
        alert("Entrega registrada com sucesso! (Simulação)");
        // Aqui, no futuro, nós limparíamos o estado do inventário.
      };

      return (
        <div className="inventario-container">
          <h1>Meu Inventário Atual</h1>
          <p>Materiais que você coletou e que estão aguardando entrega na cooperativa.</p>

          <table className="inventario-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantidade Acumulada</th>
                <th>Valor Estimado</th>
              </tr>
            </thead>
            <tbody>
              {mockInventario.map(item => (
                <tr key={item.id}>
                  <td>{item.material}</td>
                  <td>{item.quantidade} {item.unidade}</td>
                  <td>{item.valorEstimado}</td>
                </tr>
              ))}
              <tr className="table-footer-total">
                <td colSpan={2}>Valor Total Estimado:</td>
                <td className="total-value">R$ 63,25</td>
              </tr>
            </tbody>
          </table>

          <div className="entrega-section">
            <h3>Registrar Entrega na Cooperativa</h3>
            <div className="entrega-form">
              <div className="form-group-vertical">
                <label htmlFor="cooperativaDestino"><FaWarehouse /> Selecionar Cooperativa de Destino</label>
                <select 
                  id="cooperativaDestino" 
                  value={destino} 
                  onChange={(e) => setDestino(e.target.value)}
                >
                  {cooperativasDestino.map(coop => (
                    <option key={coop.id} value={coop.id}>{coop.nome}</option>
                  ))}
                </select>
              </div>
              <button className="confirm-entrega-btn" onClick={handleEntregarMateriais}>
                <FaCheckSquare /> Confirmar Entrega e Esvaziar Inventário
              </button>
            </div>
          </div>
        </div>
      );
    };

    export default ColetorInventario;