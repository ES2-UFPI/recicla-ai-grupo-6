import React from 'react';
import './HomeContent.css'; // Reutilizamos o estilo
import { FaBoxes, FaClipboardList } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Para criar links internos

const CooperativaHome = () => {
  // Dados de exemplo (viriam da API)
  const pendingDeliveriesCount = 3;
  const acceptedMaterialsCount = 5;

  return (
    <div className="home-content cooperativa-dashboard">
      <h1>Dashboard da Cooperativa</h1>
      <p>Visão geral das suas operações.</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <FaClipboardList className="stat-icon deliveries" />
          <span className="stat-number">{pendingDeliveriesCount}</span>
          <span className="stat-label">Entregas Aguardando Confirmação</span>
          <Link to="/confirmar-entregas" className="stat-link">Ver Entregas</Link>
        </div>
        <div className="stat-card">
          <FaBoxes className="stat-icon materials" />
          <span className="stat-number">{acceptedMaterialsCount}</span>
          <span className="stat-label">Materiais de Interesse Cadastrados</span>
          <Link to="/meus-interesses" className="stat-link">Gerenciar Materiais</Link>
        </div>
      </div>
    </div>
  );
};

export default CooperativaHome;