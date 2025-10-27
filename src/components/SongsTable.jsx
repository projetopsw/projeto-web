import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

const SongsTable = ({ searchTerm }) => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/allSongs')
            .then(response => {
                setSongs(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar músicas:", error);
                setLoading(false);
            });
    }, []);

    const filteredSongs = useMemo(() => {
        if (!searchTerm) return songs;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return songs.filter(song => 
            song.title?.toLowerCase().includes(lowerCaseSearch) ||
            song.artist?.toLowerCase().includes(lowerCaseSearch) ||
            song.album?.toLowerCase().includes(lowerCaseSearch) ||
            song.id?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [songs, searchTerm]);

    if (loading) return <div className="text-center py-4 text-lg">Carregando Músicas...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="admin-table">
                <thead className="admin-table-head">
                    <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Artista</th>
                        <th>Duração</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="admin-table-body">
                    {filteredSongs.map((song) => (
                        <tr key={song.id}>
                            <td>{song.id}</td>
                            <td>{song.title}</td>
                            <td>{song.artist}</td>
                            <td>{song.duration}</td>
                            <td className="text-right">
                                <button 
                                    onClick={() => console.log(`Ação: Editar Música ${song.id}`)}
                                    className="admin-action-button edit"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => console.log(`Ação: Deletar Música ${song.id}`)}
                                    className="admin-action-button delete"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredSongs.length === 0 && !loading && (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                {searchTerm ? `Nenhuma música encontrada para "${searchTerm}".` : "Nenhuma música cadastrada."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SongsTable;