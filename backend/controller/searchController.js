import SearchService from '../services/searchService.js';

class SearchController {
    static async index(req, res) {
        const { query, category } = req.query;

        if (!query || !category) {
            return res.status(400).json({ 
                error: 'Os parâmetros "query" e "category" (música, album, artista, etc.) são obrigatórios.' 
            });
        }

        try {
            const results = await SearchService.executeSearch(query, category);

            return res.status(200).json({ 
                category: category,
                query: query,
                results: results,
                count: Array.isArray(results) ? results.length : Object.values(results).flat().length
            });

        } catch (error) {
            console.error('Erro ao processar pesquisa:', error);
            if (error.message.includes('Categoria inválida')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ 
                error: 'Erro interno do servidor ao buscar resultados.' 
            });
        }
    }
}

export default SearchController;