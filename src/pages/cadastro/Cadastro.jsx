import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import mongoApi from '../../services/mongoApi'; 
import '../login/login.css'

import ConfirmationModal from '../../components/ConfirmationModal'; 

export default function Cadastro() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
 
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    const [modal, setModal] = useState({
        open: false,
        title: '',
        message: '',
        isConfirmation: false,
        onConfirmAction: () => {}, 
        cancelText: "Fechar"
    });

    const navigate = useNavigate();

    const handleOpenModal = (title, message, isSuccess = false) => {
        setModal({
            open: true,
            title: title,
            message: message,
            isConfirmation: false, 
            cancelText: isSuccess ? "Ir para Login" : "Entendi",
            onConfirmAction: isSuccess ? () => navigate('/login') : () => handleCloseModal(),
        });
    };

    const handleCloseModal = () => {
        setModal({ ...modal, open: false });
    };

    const handleCadastro = async (e) => {
        e.preventDefault();
        setError(''); 
        setIsLoading(true);

        if (!username || !email || !password) {
            const requiredError = 'Todos os campos são obrigatórios!';
            setError(requiredError);
            setIsLoading(false);
            handleOpenModal("Erro de Cadastro", requiredError);
            return;
        }

        try {
            await mongoApi.post('/users/register', {
                name: username,
                email,
                password,
            });

            handleOpenModal(
                "Cadastro Concluído!", 
                'Cadastro realizado com sucesso! Clique para entrar no pasto.',
                true
            );

        } catch (err) {
            const mensagemErro = err.response?.data?.message || 'Ocorreu um erro ao criar a conta.';
            setError(mensagemErro);
            handleOpenModal("Erro", mensagemErro);
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
            
            <ConfirmationModal
                open={modal.open}
                onClose={handleCloseModal}
                title={modal.title}
                message={modal.message}
                isConfirmation={modal.isConfirmation}
                onConfirm={modal.onConfirmAction}
                cancelText={modal.cancelText} 
            />
        </div>
    );
}