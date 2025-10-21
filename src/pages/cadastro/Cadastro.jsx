import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import '../login/login.css'

export default function Cadastro() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
 
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setError(''); 

        if (!username || !email || !password) {
            setError('Todos os campos são obrigatórios!');
            return;
        }

        try {
            const checkEmailResponse = await fetch(`http://localhost:3001/users?email=${email}`);
            const existingUsers = await checkEmailResponse.json();

            if (existingUsers.length > 0) {
                setError('Este email já está em uso. Tente outro.');
                return; 
            }

            const newUser = {
                username,
                email,
                password,
                playlists: 0,
                friends: 0,
            };

            const createUserResponse = await fetch('http://localhost:3001/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            if (!createUserResponse.ok) {
                throw new Error('Não foi possível criar o usuário.');
            }

            alert('Cadastro realizado com sucesso! Agora você pode entrar no pasto.');
            navigate('/login');

        } catch (err) {
            setError('Ocorreu um erro ao conectar com o servidor. Tente novamente.');
            console.error(err);
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
                    />

                    <label htmlFor="user-email">Email</label>
                    <input 
                        id="user-email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label htmlFor="user-password">Senha</label>
                    <input 
                        id="user-password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    
                    <button type="submit" className="btn orange-btn">Entrar no pasto</button>
                </form>            
            </div>

            <div className="footer">
                <span className="lighter-text">Já é da fazenda?</span>
                <Link to="/login">Abra a porteira aqui</Link>
            </div>
        </div>
    );
}