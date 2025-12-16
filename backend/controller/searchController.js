import SearchService from '../services/searchService.js';

const POSSIBLE_FILTER_PARAMS = ['category', 'filter', 'type', 'scope'];

const CATEGORY_MAP = {
    'musica': 'musica',
    'music': 'musica',
    'song': 'musica',
    'album': 'album',
    'artista': 'artista',
    'artist': 'artista',
    'playlist': 'playlist',
    'usuario': 'usuario',
    'user': 'usuario',
    'tudo': 'tudo',
    'all': 'tudo',
};

class SearchController {
    static async index(req, res) {
        let { query } = req.query;
        let category = 'tudo'; 

        if (!query && req.query.q) query = req.query.q;

        if (!query) {
            return res.status(400).json({ error: 'O parâmetro "query" é obrigatório.' });
        }
        
        for (const paramName of POSSIBLE_FILTER_PARAMS) {
            const frontendValue = req.query[paramName]?.toLowerCase();
            if (frontendValue) {
                category = CATEGORY_MAP[frontendValue] || 'tudo';
                break; 
            }
        }

        try {
            const results = await SearchService.executeSearch(query, category);

            const calculateTotalCount = (resObj) => {
                let total = 0;
                for (const key in resObj) {
                    const categoryResults = resObj[key];
                    if (categoryResults && (categoryResults.priority || categoryResults.related)) {
                        total += (categoryResults.priority?.length || 0) + (categoryResults.related?.length || 0);
                    }
                }
                return total;
            };

            const count = calculateTotalCount(results);

            return res.status(200).json({ 
                category,
                query,
                results,
                count
            });

        } catch (error) {
            console.error('Erro no SearchController:', error);
            return res.status(500).json({ error: 'Erro interno ao processar a busca.' });
        }
    }
}

export default SearchController;