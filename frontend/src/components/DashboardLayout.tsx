import React from 'react';
import './DashboardLayout.css'; // O CSS para o nosso novo layout
import { FaRecycle, FaSignOutAlt, FaPlusCircle, FaListAlt, FaMapMarkedAlt, FaChartBar, FaUsers } from 'react-icons/fa';

// Definindo as propriedades que o layout receberá
interface DashboardLayoutProps {
  user: {
    name: string;
    type: 'produtor' | 'coletor' | 'cooperativa';
  };
  onLogout: () => void; // A função de logout que virá do App.tsx
  children: React.ReactNode; // O conteúdo principal da página
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout, children }) => {

  const renderNavLinks = () => {
    switch (user.type) {
      case 'produtor':
        return (
          <>
            <a href="#" className="nav-link active"><FaPlusCircle /> Solicitar Coleta</a>
            <a href="#" className="nav-link"><FaListAlt /> Minhas Solicitações</a>
          </>
        );
      case 'coletor':
        return (
          <>
            <a href="#" className="nav-link active"><FaMapMarkedAlt /> Coletas Disponíveis</a>
            <a href="#" className="nav-link"><FaListAlt /> Minhas Coletas</a>
          </>
        );
      case 'cooperativa':
        return (
          <>
            <a href="#" className="nav-link active"><FaChartBar /> Dashboard</a>
            <a href="#" className="nav-link"><FaUsers /> Gerenciar Coletores</a>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page-container">
      {/* --- PAINEL ESQUERDO (NAVEGAÇÃO) --- */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <FaRecycle className="logo-icon" />
          <h1>ReciclaAi</h1>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-type">{user.type.charAt(0).toUpperCase() + user.type.slice(1)}</span>
          </div>
        </div>
        <div className="nav-links">
          {renderNavLinks()}
        </div>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </nav>

      {/* --- PAINEL DIREITO (CONTEÚDO PRINCIPAL) --- */}
      <main className="main-content">
        {children} {/* Aqui é onde o conteúdo específico de cada página será renderizado */}
      </main>
    </div>
  );
};

export default DashboardLayout;