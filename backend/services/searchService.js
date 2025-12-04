import SearchModel from '../models/search.model.js'; 

const VALID_CATEGORIES = ['tudo', 'musica', 'album', 'usuario', 'playlist', 'artista'];

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class SearchService {
    async executeSearch(term, category) {
        const normalized_category = category.toLowerCase().trim();
        const search_term = term.trim(); 
        
        if (!search_term) {
            return normalized_category === 'tudo' ? {} : [];
        }

        const escaped_term = escapeRegExp(search_term);
        
        const searchRegexStart = new RegExp('^' + escaped_term, 'i');
        
        const searchRegexContains = new RegExp(escaped_term, 'i'); 
        
        if (!VALID_CATEGORIES.includes(normalized_category)) {
            throw new Error(`Categoria inválida: ${category}. As opções válidas são: ${VALID_CATEGORIES.join(', ')}.`);
        }

        if (normalized_category === 'tudo') {
            const allResults = await SearchModel.searchAll(searchRegexStart, searchRegexContains);
            return allResults;
        } else {
            const specificResults = await SearchModel.searchByCategory(searchRegexStart, searchRegexContains, normalized_category);
            return specificResults;
        }
    }
}

export default new SearchService();