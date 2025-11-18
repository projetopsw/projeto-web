import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import api from '../../services/api'; 
import '../login/login.css'

export default function Cadastro() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
 
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setError(''); 
        setIsLoading(true);

        if (!username || !email || !password) {
            setError('Todos os campos são obrigatórios!');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/users/register', {
                name: username,
                email,
                password,
            });

            alert('Cadastro realizado com sucesso! Agora você pode entrar no pasto.');
            navigate('/login');

        } catch (err) {
            const mensagemErro = err.response?.data?.message || 'Ocorreu um erro ao criar a conta.';
            setError(mensagemErro);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="logo-container">
                <img className="logo" src="/assets/img/vaca-logo.png" alt="Logo da Vaca" />
                <h1>Junte-se ao rebanho!</h1>
            </div>

            <div className="login-container">
                <form className="login-form" onSubmit={handleCadastro}>
                    <label htmlFor="user-name">Seu nome de boiadeiro</label>
                    <input 
                        id="user-name" 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />

                    <label htmlFor="user-email">Email</label>
                    <input 
                        id="user-email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />

                    <label htmlFor="user-password">Senha</label>
                    <input 
                        id="user-password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />

                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    
                    <button type="submit" className="btn orange-btn" disabled={isLoading}>
                        {isLoading ? 'Abrindo porteira...' : 'Entrar no pasto'}
                    </button>
                </form>            
            </div>

            <div className="footer">
                <span className="lighter-text">Já é da fazenda?</span>
                <Link to="/login">Abra a porteira aqui</Link>
            </div>
        </div>
    );
}