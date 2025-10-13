import React from 'react';
import './HomeContent.css';

const ProdutorHome = () => {
  return (
    <div className="home-content">
      <h1>Olá, Produtor!</h1>
      <p>Pronto para dar o primeiro passo para um mundo mais limpo?</p>
      <button className="cta-button">Solicitar Nova Coleta</button>
    </div>
  );
};

export default ProdutorHome;