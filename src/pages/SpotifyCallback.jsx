import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { handleSpotifyCallback } from '../redux/loginSlice'; 

export default function SpotifyCallback() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(handleSpotifyCallback())
            .unwrap()
            .then(() => {
                navigate('/', { replace: true }); 
            })
            .catch((error) => {
                console.error("Erro no callback do Spotify:", error);
                navigate('/login', { state: { error: 'Falha na autenticação Spotify.' }, replace: true });
            });
    }, [dispatch, navigate]);

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Carregando sua conta...</h1>
            <p>Aguarde enquanto iniciamos sua sessão com Spotify.</p>
        </div>
    );
}