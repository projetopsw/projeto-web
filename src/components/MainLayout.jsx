// src/components/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // 💡 Importar useDispatch
import { skipNext } from '../redux/playerSlice'; // 💡 Importar skipNext (Ajuste o caminho se necessário!)
import Header from './Header';
import Footer from './Footer';
import Player from './Player'; // 💡 Importar Player

// Importa Box para usar o sistema de layout do MUI e facilitar o posicionamento fixo
import { Box } from '@mui/material'; 

const MainLayout = () => {
    const dispatch = useDispatch();

    // 💡 Lógica de controle de fim de música para o Player Universal
    const handleSongEnd = () => {
        console.log("Música atual finalizada. Disparando skipNext.");
        dispatch(skipNext());
    };

    return (
        // 💡 Usamos o Box para garantir o layout vertical e forçar o Player a ficar fixo no final
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            <Header />

            {/* 💡 Conteúdo Principal: Adiciona padding-bottom para compensar o player fixo. 
                 Remova o Footer, pois o Player ocupará esse espaço ou mova o Player para o Footer. 
                 Se o Footer é um componente visual que deve ficar acima do Player, ajuste.
                 Neste exemplo, vamos assumir que o Player substitui o Footer, ou que o Footer 
                 é apenas um placeholder. Se o Footer for importante, mova o Player para DENTRO dele.
                 
                 Vou **remover o Footer** para usar o espaço para o Player Fixo.
            */}
            <main className="main-content-area" style={{ flexGrow: 1, paddingBottom: '80px' }}> 
                <Outlet />
            </main>

            {/* 💡 PLAYER UNIVERSAL FIXO */}
            <Box 
                sx={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000, 
                    backgroundColor: 'var(--card-bg)', // Cor de fundo do seu tema
                    borderTop: '1px solid var(--border-color)',
                    padding: '10px 0'
                }}
            >
                {/* O Player Universal que não desmonta entre as páginas */}
                <Player onSongEnd={handleSongEnd} />
            </Box>

            {/* ❌ REMOVIDO: <Footer /> - (Opcional) Removido para liberar espaço ou porque o Player o substitui visualmente */}

        </Box>
    );
};

export default MainLayout;