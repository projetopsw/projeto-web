import SearchModel from '../models/search.model.js'; 

const VALID_CATEGORIES = ['tudo', 'musica', 'album', 'usuario', 'playlist', 'artista'];

class SearchService {
    async executeSearch(term, category) {
        const normalized_category = category.toLowerCase().trim();
        const search_term = term.toLowerCase().trim();

        if (!VALID_CATEGORIES.includes(normalized_category)) {
            throw new Error(`Categoria inválida: ${category}. As opções válidas são: ${VALID_CATEGORIES.join(', ')}.`);
        }

        if (normalized_category === 'tudo') {
            const allResults = await SearchModel.searchAll(search_term);
            return allResults;
        } else {
            const specificResults = await SearchModel.searchByCategory(search_term, normalized_category);
            return specificResults;
        }
    }
}

export default new SearchService();