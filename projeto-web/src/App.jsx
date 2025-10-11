import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import FilaPage from './components/FilaPage'
import Home from './pages/home/Home'
import Playlists from './pages/playlists/Playlists'
import PlaylistDetalhe from './pages/playlists/PlaylistDetalhe'
import Pesquisa from './pages/pesquisa/Pesquisa'
import Login from './pages/login/Login'
import Cadastro from './pages/cadastro/Cadastro'
import TelaMusica from './pages/musicas/TelaMusica.jsx'
import Grupos from './pages/grupos/Grupos.jsx'
import GrupoDetalhe from './pages/grupos/GrupoDetalhe.jsx'
import AlbumDetail from './pages/albuns/AlbumDetail'
import Artist from './pages/artists/Artist'
import SongDetail from './pages/musicas/SongDetail.jsx'
import Perfil from './pages/perfil/Perfil.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import ProfileEdition from "./components/ProfileEdition.jsx";
import Conexoes from './components/Conexoes';


function App() {
  return (
    <Router>
      <Routes>    
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
          <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetalhe /></ProtectedRoute>} /> 
          <Route path="/pesquisa" element={<ProtectedRoute><Pesquisa /></ProtectedRoute>} />
          <Route path="/musica/:id" element={<ProtectedRoute><TelaMusica /></ProtectedRoute>} />
          <Route path="/grupos" element={<ProtectedRoute><Grupos /></ProtectedRoute>} />
          <Route path="/grupos/:id" element={<ProtectedRoute><GrupoDetalhe /></ProtectedRoute>} />
          <Route path="/artista/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/song/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
          <Route path="/albumDetail/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
          <Route path="/album/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
          <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetalhe /></ProtectedRoute>} />
          <Route path="/artistDetail/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} />
          <Route path="/artist/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} />
          <Route path="/fila" element={<ProtectedRoute><FilaPage /></ProtectedRoute>} />
          <Route path="/perfil/editar" element={<ProfileEdition />} /> 
          <Route path="/perfil/:userId" element={<Perfil />} /> 
          <Route path="/conexoes" element={<ProtectedRoute><Conexoes /></ProtectedRoute>} /> 
          
        </Route>
        <Route path="*" element={<main><h1>Página Não Encontrada (404)</h1></main>} />
      </Routes>
    </Router>
  );
}

export default App;