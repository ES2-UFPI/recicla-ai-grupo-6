import React, { useState } from 'react';
import './CadastroLoginProdutor.css'; // Vamos criar este arquivo de estilo a seguir

const CadastroLoginProdutor = () => {
  // Estado para controlar se estamos na tela de Login (true) ou Cadastro (false)
  const [isLogin, setIsLogin] = useState<boolean>(true);

  // Estados para controlar os valores dos campos do formulário
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [nome, setNome] = useState<string>('');       // Apenas para cadastro
  const [endereco, setEndereco] = useState<string>(''); // Apenas para cadastro
  
  // Estado para feedback ao usuário
  const [feedback, setFeedback] = useState<string>('');

  // Função para alternar entre os formulários de login e cadastro
  const toggleForm = (event: React.MouseEvent) => {
    event.preventDefault(); // Impede que o link recarregue a página
    setIsLogin(!isLogin);
    setFeedback(''); // Limpa o feedback ao trocar de formulário
  };

  // Função chamada ao submeter o formulário
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Impede que a página recarregue ao submeter
    setFeedback('Processando...');

    if (isLogin) {
      // --- LÓGICA DE LOGIN ---
      console.log('Tentativa de Login com:', { email, senha });
      // AQUI, NO FUTURO, VOCÊ FARIA A CHAMADA PARA A API DE LOGIN
      setFeedback('Login realizado com sucesso! (Simulação)');
    } else {
      // --- LÓGICA DE CADASTRO ---
      console.log('Tentativa de Cadastro com:', { nome, email, senha, endereco });
      // AQUI, NO FUTURO, VOCÊ FARIA A CHAMADA PARA A API DE CADASTRO
      setFeedback('Cadastro realizado com sucesso! (Simulação)');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Login' : 'Cadastro'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Campos que aparecem apenas no formulário de cadastro */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="nome">Nome Completo</label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endereco">Endereço para Coleta</label>
                <input
                  type="text"
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Campos que aparecem em ambos os formulários */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>

          {feedback && <p className="feedback-message">{feedback}</p>}
        </form>

        <p className="toggle-link">
          {isLogin ? 'Ainda não tem uma conta? ' : 'Já tem uma conta? '}
            <button type="button" className="link-button" onClick={toggleForm}>
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default CadastroLoginProdutor;