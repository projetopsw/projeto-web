import SearchService from '../services/searchService.js';

class SearchController {
    static async index(req, res) {
        let { query, category } = req.query;

        if (!query && req.query.q) {
            query = req.query.q;
        }

        if (!query) {
             return res.status(400).json({ 
                 error: 'O parâmetro "query" é obrigatório.' 
             });
        }
        
        if (!category) {
            category = 'tudo'; 
        }

        try {
            const results = await SearchService.executeSearch(query, category);

            const calculateTotalCount = (resObj) => {
                if (Array.isArray(resObj)) {
                    return resObj.length;
                }
                
                if (resObj && resObj.priority && resObj.related) {
                    return resObj.priority.length + resObj.related.length;
                }

                let totalCount = 0;
                for (const key in resObj) {
                    const categoryResults = resObj[key];
                    if (categoryResults && categoryResults.priority && categoryResults.related) {
                        totalCount += categoryResults.priority.length + categoryResults.related.length;
                    }
                }
                return totalCount;
            };

            const totalCount = calculateTotalCount(results);

            return res.status(200).json({ 
                category: category,
                query: query,
                results: results,
                count: totalCount
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