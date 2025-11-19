import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginUserAsync } from '../../redux/loginSlice'; 
import { useNavigate, Link } from 'react-router-dom';
import { FaSpotify } from "react-icons/fa";
import './login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const resultAction = await dispatch(loginUserAsync({ email, password })).unwrap()
            navigate('/')
        } catch (err) {
            setError(err || 'Email ou senha inválidos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="logo-container">
                <img
                    className="logo"
                    src="/assets/img/vaca-logo.png"
                    alt="Logo da Vaca"
                />
                <h1>Bem-vindo de volta ao rebanho!</h1>
            </div>

            <div className="login-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <label htmlFor="user-email">Email</label>
                    <input
                        id="user-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <label htmlFor="user-password">Senha</label>
                    <input
                        id="user-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    {error && <p className="error-text" style={{color: 'red'}}>{error}</p>}

                    <button type="submit" className="btn orange-btn" disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Entrar no pasto'}
                    </button>
                </form>

                {/* BOTÃO DE LOGIN COM SPOTIFY */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <a 
                        href="http://127.0.0.1:3000/api/auth/spotify" 
                        className="btn spotify-btn" 
                        style={{ 
                            backgroundColor: '#1DB954', 
                            color: 'white', 
                            padding: '10px 20px',
                            borderRadius: '25px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FaSpotify size={20} />
                        Logar com Spotify
                    </a>
                </div>
            </div>

            <div className="footer">
                <span className="lighter-text">Não tem uma conta?</span>
                <Link to="/cadastro">Inscrever-se</Link>
            </div>
        </div>
    );
}