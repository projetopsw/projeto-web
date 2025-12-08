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
                const response = await api.get(`/${config.endpoint}`);
                console.log(`Dados recebidos de ${config.endpoint}:`, response.data);
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

    const renderCell = (row, accessor) => {
        const value = row[accessor];

        if (value === null || value === undefined) return '';

        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object') {
                    return item.name || item.title || item.username || 'Item sem nome';
                }
                return item;
            }).join(', ');
        }

        if (typeof value === 'object') {
            return value.name || value.title || value.username || JSON.stringify(value); 
        }

        return String(value);
    };

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