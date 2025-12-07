// controllers/SearchController.js
import SearchService from '../services/searchService.js';

class SearchController {
    static async index(req, res) {
        let { query, category } = req.query;

        // Fallback para 'q' se 'query' não vier
        if (!query && req.query.q) query = req.query.q;

        if (!query) {
             return res.status(400).json({ error: 'O parâmetro "query" é obrigatório.' });
        }
        
        if (!category) category = 'tudo';

        try {
            // A mágica acontece aqui dentro
            const results = await SearchService.executeSearch(query, category);

            // Função auxiliar para contar resultados (mantive a sua lógica)
            const calculateTotalCount = (resObj) => {
                let total = 0;
                // Se for resultado específico (ex: só musicas)
                if (resObj.priority || resObj.related) {
                     return (resObj.priority?.length || 0) + (resObj.related?.length || 0);
                }
                // Se for 'tudo'
                for (const key in resObj) {
                    if (resObj[key]?.priority) total += resObj[key].priority.length;
                    if (resObj[key]?.related) total += resObj[key].related.length;
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