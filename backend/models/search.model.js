import MusicaModel from './song.model.js';
import AlbumModel from './album.model.js';
import ArtistaModel from './artist.model.js';
import PlaylistModel from './playlist.model.js';
import UserModel from './user.model.js';

class SearchModel {
    
    static async searchByCategory(searchRegexStart, searchRegexContains, category) {
        let results = [];
        
        switch (category) {
            case 'musica':
                results = await MusicaModel.searchByTerm(searchRegexStart, searchRegexContains);
                break;
            case 'album':
                results = await AlbumModel.searchByTerm(searchRegexStart, searchRegexContains);
                break;
            case 'artista':
                results = await ArtistaModel.searchByTerm(searchRegexStart, searchRegexContains);
                break;
            case 'playlist':
                results = await PlaylistModel.searchByTerm(searchRegexStart, searchRegexContains);
                break;
            case 'usuario':
                results = await UserModel.searchByTerm(searchRegexStart, searchRegexContains);
                break;
            default:
                results = { priority: [], related: [] }; 
        }
        return results;
    }

    static async searchAll(searchRegexStart, searchRegexContains) {

        const [musica, album, artista, usuario, playlist] = await Promise.all([
            this.searchByCategory(searchRegexStart, searchRegexContains, 'musica'),
            this.searchByCategory(searchRegexStart, searchRegexContains, 'album'),
            this.searchByCategory(searchRegexStart, searchRegexContains, 'artista'),
            this.searchByCategory(searchRegexStart, searchRegexContains, 'usuario'),
            this.searchByCategory(searchRegexStart, searchRegexContains, 'playlist')
        ]);
        
        return {
            musicas: musica,
            albuns: album,
            artistas: artista,
            usuarios: usuario,
            playlists: playlist,
        };
    }
}

export default SearchModel;