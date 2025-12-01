import MusicaModel from './song.model.js';
import AlbumModel from './album.model.js';
import ArtistaModel from './artist.model.js';
import PlaylistModel from './playlist.model.js';
import UserModel from './user.model.js';

class SearchModel {
    
    static async searchByCategory(term, category) {
        let results = [];
        
        switch (category) {
            case 'musica':
                results = await MusicaModel.searchByTerm(term);
                break;
            case 'album':
                results = await AlbumModel.searchByTerm(term);
                break;
            case 'artista':
                results = await ArtistaModel.searchByTerm(term);
                break;
            case 'playlist':
                results = await PlaylistModel.searchByTerm(term);
                break;
            case 'usuario':
                results = await UserModel.searchByTerm(term);
                break;
            default:
                results = [];
        }
        return results;
    }

    static async searchAll(term) {

        const [musica, album, artista, usuario, playlist] = await Promise.all([
            this.searchByCategory(term, 'musica'),
            this.searchByCategory(term, 'album'),
            this.searchByCategory(term, 'artista'),
            this.searchByCategory(term, 'usuario'),
            this.searchByCategory(term, 'playlist')
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