import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/loginSlice'; 
import { useNavigate, Link } from 'react-router-dom';
import './login.css'
import { setUserData } from '../../redux/userSlice'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`http://localhost:3001/users?email=${email}&password=${password}`);
            const data = await response.json();

            if (data.length > 0) {
                const userFromDb = data[0]; 

                
                const userDataForRedux = {
                  id: userFromDb.id,
                  name: userFromDb.name,
                  email: userFromDb.email,
                  likedSongs: userFromDb.likedSongs || [],
                  following: userFromDb.following || [],
                  friends: (userFromDb.friends || []).map(String).filter(Boolean),
                };

                dispatch(setUserData(userDataForRedux));


                dispatch(
                  loginSuccess({
                    user: userDataForRedux,
                    token: 'fake-jwt-token-for-simulation',
                  })
                );

                navigate('/');

            } else {
                setError('Email ou senha inválidos.');
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
            console.error(err);
        }
    };

  return (
        <div className="container">
            <div className="logo-container">
                <img className="logo" src="assets/img/vaca-logo.png" alt="Logo da Vaca" />
                <h1>Bem vindo de volta ao rebanho!</h1>
            </div>

            <div className="login-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <label htmlFor="user-email">Email ou nome de boiadeiro</label>
                    <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                    <label htmlFor="user-password">Senha</label>
                    <input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button type='submit' className="btn orange-btn">Entrar no pasto</button>
                </form>            
            </div>

            <div className="footer">
                <span className="lighter-text">Não tem uma conta?</span>
                <Link to="/cadastro" >Inscrever-se</Link>
            </div>
        </div>
    );
}