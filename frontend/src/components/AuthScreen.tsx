import React, { useState } from 'react';
import './AuthScreen.css';
import { FaEnvelope, FaLock, FaRecycle, FaUser, FaIdCard, FaMapMarkerAlt, FaCity, FaHashtag, FaBuilding, FaPhone, FaTruck, FaWarehouse, FaUsers } from 'react-icons/fa';

type UserType = 'produtor' | 'coletor' | 'cooperativa';

// NOVO: Objeto para guardar as descrições de cada tipo de usuário
const userDescriptions: Record<UserType, string> = {
  produtor: "Ideal para cidadãos e empresas que geram resíduos e precisam solicitar coletas.",
  coletor: "Para profissionais autônomos que realizam a coleta dos resíduos e os transportam.",
  cooperativa: "Destinado a cooperativas e centros de triagem que recebem e processam os materiais coletados."
};

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<UserType>('produtor');

  // --- Estados para os campos do formulário (sem alterações) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cnpj, setCnpj] = useState('');

  const toggleForm = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLogin(!isLogin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    // ... (Nenhuma alteração na função handleSubmit)
    e.preventDefault();
    if (isLogin) {
      console.log("Tentativa de Login:", { email, password });
    } else {
      if (password !== confirmPassword) {
        alert("As senhas não coincidem!");
        return;
      }
      const commonData = { name, email, password, phone };
      let specificData = {};
      switch (userType) {
        case 'produtor':
          specificData = { userType, cpf, cep, street, number, neighborhood, city, state };
          break;
        case 'coletor':
          specificData = { userType, cpf, cep, city, state };
          break;
        case 'cooperativa':
          specificData = { userType, cnpj, cep, street, number, neighborhood, city, state };
          break;
      }
      const registrationData = { ...commonData, ...specificData };
      console.log("Enviando para cadastro:", registrationData);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">

        <div className="left-panel">
          <div className="logo-section">
            <FaRecycle className="logo-icon" />
            <h1>ReciclaAi</h1>
          </div>
          <h2>{isLogin ? 'Bem-vindo de volta!' : 'Junte-se a nós!'}</h2>
          <p>{isLogin ? 'Faça o login para continuar.' : 'Crie sua conta e ajude o meio ambiente.'}</p>
        </div>

        <div className="right-panel">
          <form onSubmit={handleSubmit}>
            <h3>{isLogin ? 'Entre na sua conta' : 'Crie sua Conta'}</h3>

            {isLogin ? (
              // --- CAMPOS DE LOGIN ---
              <>
                <div className="input-group">
                  <FaEnvelope className="input-icon" /><input type="email" placeholder="E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <FaLock className="input-icon" /><input type="password" placeholder="SENHA" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <a href="#" className="forgot-password">Esqueceu sua senha?</a>
              </>
            ) : (
              // --- CAMPOS DE CADASTRO ---
              <>
                <div className="input-group">
                  <FaUsers className="input-icon" />
                  <select value={userType} onChange={(e) => setUserType(e.target.value as UserType)} required>
                    <option value="produtor">Produtor de Resíduos</option>
                    <option value="coletor">Coletor</option>
                    <option value="cooperativa">Cooperativa</option>
                  </select>
                </div>

                {/* NOVO: Bloco da Descrição Dinâmica */}
                <div className="user-description">
                  <p>{userDescriptions[userType]}</p>
                </div>

                {/* Campos Comuns de Cadastro (sem alterações) */}
                <div className="input-group"><FaUser className="input-icon" /><input type="text" placeholder={userType === 'cooperativa' ? 'Nome da Empresa' : 'Nome Completo'} value={name} onChange={(e) => setName(e.target.value)} required /></div>
                {/* ... (resto dos campos de cadastro sem alteração) ... */}
                <div className="input-group"><FaEnvelope className="input-icon" /><input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="input-group"><FaPhone className="input-icon" /><input type="text" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>

                {userType === 'produtor' && <>
                  <div className="input-group"><FaIdCard className="input-icon" /><input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required /></div>
                  <div className="input-group"><FaMapMarkerAlt className="input-icon" /><input type="text" placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} required /></div>
                  <div className="input-group"><FaMapMarkerAlt className="input-icon" /><input type="text" placeholder="Rua, Av..." value={street} onChange={(e) => setStreet(e.target.value)} required /></div>
                  <div className="input-group"><FaHashtag className="input-icon" /><input type="text" placeholder="Número" value={number} onChange={(e) => setNumber(e.target.value)} required /></div>
                </>}
                {userType === 'coletor' && <>
                  <div className="input-group"><FaIdCard className="input-icon" /><input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required /></div>
                  <div className="input-group"><FaCity className="input-icon" /><input type="text" placeholder="Cidade de Atuação" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                  <div className="input-group"><FaTruck className="input-icon" /><input type="text" placeholder="Estado de Atuação" value={state} onChange={(e) => setState(e.target.value)} required /></div>
                </>}
                {userType === 'cooperativa' && <>
                  <div className="input-group"><FaBuilding className="input-icon" /><input type="text" placeholder="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required /></div>
                  <div className="input-group"><FaWarehouse className="input-icon" /><input type="text" placeholder="CEP da Sede" value={cep} onChange={(e) => setCep(e.target.value)} required /></div>
                  <div className="input-group"><FaMapMarkerAlt className="input-icon" /><input type="text" placeholder="Endereço da Sede" value={street} onChange={(e) => setStreet(e.target.value)} required /></div>
                </>}
              </>
            )}

            <button type="submit" className="login-btn">{isLogin ? 'Entrar' : 'Criar Conta'}</button>

            <div className="register-link">
              {isLogin ? 'Não tem conta? ' : 'Já tem uma conta? '}
              <a href="#" onClick={toggleForm}>{isLogin ? 'Se cadastre!' : 'Faça Login'}</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;