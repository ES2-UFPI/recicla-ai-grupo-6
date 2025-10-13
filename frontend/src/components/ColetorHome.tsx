import React from 'react';
import './HomeContent.css';

const ColetorHome = () => {
  return (
    <div className="home-content">
      <h1>Coletas Disponíveis</h1>
      <p>Aqui você verá um mapa com as solicitações de coleta próximas a você.</p>
      <div className="placeholder-box">Área do Mapa</div>
    </div>
  );
};

export default ColetorHome;