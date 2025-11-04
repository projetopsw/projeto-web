import React, { useState, useEffect, useMemo } from 'react'; 

const GenericAdminTable = ({ config, searchTerm, refreshKey, onEdit, onDelete }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/${config.endpoint}`);
                
                if (!response.ok) throw new Error(`Falha ao buscar ${config.plural}`);
                
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

    }, [config.endpoint, config.plural, refreshKey]); 

    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return data; 
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return data.filter(row => {
            return config.columns.some(col => {
                const value = row[col.accessor]; 
                
                return value != null && String(value).toLowerCase().includes(lowerCaseSearch);
            });
        });
    }, [data, searchTerm, config.columns]); 

    if (loading) return <div>Carregando {config.plural}...</div>;
    if (error) return <div>Erro: {error}</div>;

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
                {filteredData.map((row) => (
                    <tr key={row.id}>
                        {config.columns.map((col) => (
                            <td key={col.accessor}>{String(row[col.accessor])}</td>
                        ))}
                        <td className="text-right">
                            <button
                                className="admin-action-button edit"
                                onClick={() => onEdit(row)}
                            >
                                Editar
                            </button>
                            <button
                                className="admin-action-button delete"
                                onClick={() => onDelete(row.id)} 
                            >
                                Excluir
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default GenericAdminTable;