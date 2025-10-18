import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Nossas "páginas"
import AuthScreen from './components/AuthScreen';
import DashboardLayout from './components/DashboardLayout';
import ProdutorHome from './components/ProdutorHome';
import ColetorHome from './components/ColetorHome';
import CooperativaHome from './components/CooperativaHome';

// Definindo os tipos para nosso estado de login
type User = {
  name: string;
  type: 'produtor' | 'coletor' | 'cooperativa';
};

function App() {
  // Para testar, vamos começar com um usuário já logado!
  const [loggedInUser, setLoggedInUser] = useState<User | null>({ name: '>nome< Produtor', type: 'cooperativa' });
  
  const handleLogout = () => {
    setLoggedInUser(null);
  };
  
  // Função que a tela de login vai chamar no futuro
  // const handleLogin = (user: User) => setLoggedInUser(user);

  const renderDashboard = () => {
    if (!loggedInUser) return null;

    let homeContent;
    switch (loggedInUser.type) {
      case 'produtor':
        homeContent = <ProdutorHome />;
        break;
      case 'coletor':
        homeContent = <ColetorHome />;
        break;
      case 'cooperativa':
        homeContent = <CooperativaHome />;
        break;
      default:
        homeContent = <div>Página não encontrada</div>;
    }

    return (
      <DashboardLayout user={loggedInUser} onLogout={handleLogout}>
        {homeContent}
      </DashboardLayout>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !loggedInUser ? <AuthScreen /> : <Navigate to="/" />
        }/>
        <Route path="/" element={
          loggedInUser ? renderDashboard() : <Navigate to="/login" />
        }/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;