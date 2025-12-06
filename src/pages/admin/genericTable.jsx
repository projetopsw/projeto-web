import React, { useState, useEffect, useMemo } from 'react'; 
import api from '../../services/api'; 

const GenericAdminTable = ({ config, searchTerm, refreshKey, onEdit, onDelete }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Busca os dados do endpoint configurado
                const response = await api.get(`/${config.endpoint}`);
                console.log(`Dados recebidos de ${config.endpoint}:`, response.data); // OLHE O CONSOLE F12
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [config.endpoint, config.plural, refreshKey]); 

    // --- FUNÇÃO CORRIGIDA PARA EXIBIR DADOS ---
    const renderCell = (row, accessor) => {
        const value = row[accessor];

        if (value === null || value === undefined) return '';

        // Se for um ARRAY (Lista), ex: artists: [{name: 'Gaga'}, {name: 'Bruno'}]
        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object') {
                    // Tenta achar o nome dentro do objeto
                    return item.name || item.title || item.username || 'Item sem nome';
                }
                return item;
            }).join(', ');
        }

        // Se for um OBJETO único, ex: album: { title: 'Chromatica' }
        if (typeof value === 'object') {
            // Tenta pegar o nome/título. Se falhar, mostra o JSON para a gente ler e corrigir.
            return value.name || value.title || value.username || JSON.stringify(value); 
        }

        return String(value);
    };
    // ------------------------------------------

    const filteredData = useMemo(() => {
        if (!searchTerm) return data; 
        const lowerCaseSearch = searchTerm.toLowerCase();

        return data.filter(row => {
            return config.columns.some(col => {
                const text = renderCell(row, col.accessor);
                return text.toLowerCase().includes(lowerCaseSearch);
            });
        });
    }, [data, searchTerm, config.columns]); 

    if (loading) return <div>Carregando {config.plural}...</div>;
    if (error) return <div style={{color: 'red'}}>Erro: {error}</div>;

    return (
        <table className="admin-table">
            <thead className="admin-table-head">
                <tr>
                    {config.columns.map((col) => (
                        <th key={col.accessor}>{col.header}</th>
                    ))}
                    <th className="text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="admin-table-body">
                {filteredData.map((row) => {
                    const rowId = row._id || row.id;
                    return (
                        <tr key={rowId}>
                            {config.columns.map((col) => (
                                <td key={col.accessor}>
                                    {/* Chama a função que limpa o [object Object] */}
                                    {renderCell(row, col.accessor)}
                                </td>
                            ))}
                            <td className="text-right">
                                <button className="admin-action-button edit" onClick={() => onEdit(row)}>
                                    Editar
                                </button>
                                <button className="admin-action-button delete" onClick={() => onDelete(rowId)}>
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default GenericAdminTable;