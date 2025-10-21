import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importando todas as nossas "páginas" e componentes de layout
import AuthScreen from './components/AuthScreen';
import DashboardLayout from './components/DashboardLayout';
import ProdutorHome from './components/ProdutorHome';
import ColetorHome from './components/ColetorHome';
import CooperativaHome from './components/CooperativaHome';
import ProdutorSolicitacoes from './components/ProdutorSolicitacoes'; // A nova página que criámos

// Definindo os tipos para nosso estado de login
type User = {
  name: string;
  type: 'produtor' | 'coletor' | 'cooperativa';
};

function App() {
  // Para testar, vamos começar com um usuário "produtor" já logado!
  const [loggedInUser, setLoggedInUser] = useState<User | null>({ name: 'Carlos Santana', type: 'produtor' });
  
  // Função para fazer logout
  const handleLogout = () => {
    setLoggedInUser(null);
  };
  
  // No futuro, a tela de login vai chamar esta função
  // const handleLogin = (user: User) => setLoggedInUser(user);

  /**
   * Esta função renderiza o layout do dashboard e decide qual conteúdo 
   * (sub-página) mostrar dentro dele, com base na URL.
   */
  const renderDashboard = () => {
    if (!loggedInUser) return null;

    // A "casca" do nosso dashboard (menu lateral verde)
    return (
      <DashboardLayout user={loggedInUser} onLogout={handleLogout}>
        {/* O "recheio" do dashboard é decidido por estas rotas aninhadas */}
        <Routes>
          {/* Rotas específicas para cada tipo de usuário */}
          {loggedInUser.type === 'produtor' && (
            <>
              <Route path="/" element={<ProdutorHome />} />
              <Route path="/minhas-solicitacoes" element={<ProdutorSolicitacoes />} />
              {/* Outras futuras rotas do produtor viriam aqui */}
            </>
          )}

          {loggedInUser.type === 'coletor' && (
            <>
              <Route path="/" element={<ColetorHome />} />
              {/* <Route path="/minhas-coletas" element={<ColetorMinhasColetas />} /> */}
            </>
          )}

          {loggedInUser.type === 'cooperativa' && (
            <>
              <Route path="/" element={<CooperativaHome />} />
              {/* <Route path="/gerenciar-coletores" element={<GerenciarColetores />} /> */}
            </>
          )}

          {/* Uma rota para caso nenhuma outra combine dentro do dashboard */}
          <Route path="*" element={<div>Página não encontrada.</div>} />
        </Routes>
      </DashboardLayout>
    );
  };

  return (
    <BrowserRouter>
      {/* Este é o roteador principal da aplicação */}
      <Routes>
        
        {/* Rota para a página de Login */}
        <Route path="/login" element={
          !loggedInUser ? <AuthScreen /> : <Navigate to="/" />
        }/>
        
        {/* Rota "coringa" para o dashboard */}
        {/* O "/*" é o que permite que as rotas aninhadas dentro de renderDashboard() funcionem */}
        <Route path="/*" element={
          loggedInUser ? renderDashboard() : <Navigate to="/login" />
        }/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
