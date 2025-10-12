import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Importações de componentes e páginas (caminhos relativos mantidos)
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
        {/* Rotas Abertas (Login/Cadastro) */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rotas Protegidas (dentro do layout principal) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
          <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetalhe /></ProtectedRoute>} /> 
          <Route path="/pesquisa" element={<ProtectedRoute><Pesquisa /></ProtectedRoute>} />
          <Route path="/musica/:id" element={<ProtectedRoute><TelaMusica /></ProtectedRoute>} />
          <Route path="/grupos" element={<ProtectedRoute><Grupos /></ProtectedRoute>} />
          <Route path="/grupos/:id" element={<ProtectedRoute><GrupoDetalhe /></ProtectedRoute>} />
          <Route path="/artista/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} /> 
          <Route path="/song/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
          <Route path="/albumDetail/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
          <Route path="/album/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
          <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetalhe /></ProtectedRoute>} />
          <Route path="/artistDetail/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} />
          <Route path="/artist/:id" element={<ProtectedRoute><Artist /></ProtectedRoute>} />
          <Route path="/fila" element={<ProtectedRoute><FilaPage /></ProtectedRoute>} />
          
          {/* Rota Corrigida: Acessar o perfil próprio sem ID, que redireciona internamente. */}
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} /> 
          
          {/* Rota de edição (deve vir antes da dinâmica :id) */}
          <Route path="/perfil/editar" element={<ProtectedRoute><ProfileEdition /></ProtectedRoute>} /> 
          
          {/* Rota dinâmica: Acessar o perfil de outros usuários com ID. */}
          <Route path="/perfil/:id" element={<ProtectedRoute><Perfil /></ProtectedRoute>} /> 

          <Route path="/conexoes" element={<ProtectedRoute><Conexoes /></ProtectedRoute>} /> 
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<main><h1>Página Não Encontrada (404)</h1></main>} />
      </Routes>
    </Router>
  );
}

export default App;
