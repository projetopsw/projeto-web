import Artist from "../models/artist.model.js";
import Album from "../models/album.model.js"; 
import { spotifyGet } from "../services/spotifyService.js";
import mongoose from "mongoose"; 
import Song from "../models/song.model.js"; 
import { mapArtist, mapAlbum, mapTrack } from "../services/spotifyMapper.js";

async function upsertArtist(spArtist) {
    if (!spArtist) return null;
    const data = mapArtist(spArtist);
    const updateData = { ...data };
    if (!data.image) delete updateData.image; 
    return await Artist.findOneAndUpdate({ spotifyId: data.spotifyId }, { $set: updateData }, { new: true, upsert: true });
}

export const getArtistById = async (req, res) => {
    const { id } = req.params;

    try {
        const isMongoId = mongoose.Types.ObjectId.isValid(id);
        
        let query = isMongoId ? { _id: id } : { spotifyId: id };
        let artist = await Artist.findOne(query);

        if (artist && artist.image) {
            return res.json(artist);
        }

        if (isMongoId && !artist) {
            return res.status(404).json({ message: "Artista não encontrado no banco de dados." });
        }

        const spotifyIdToFetch = artist ? artist.spotifyId : id;
        
        console.log(`Buscando artista no Spotify: ${spotifyIdToFetch}`);
        const spArtist = await spotifyGet(`/artists/${spotifyIdToFetch}`);
        
        if (!spArtist) return res.status(404).json({ message: "Artista não encontrado no Spotify" });

        const savedArtist = await upsertArtist(spArtist);
        res.json(savedArtist);

    } catch (err) {
        console.error("Erro no getArtistById:", err); 
        res.status(500).json({ message: "Erro ao buscar artista", error: err.message });
    }
};

export const getArtistAlbums = async (req, res) => {
    const { id } = req.params; 

    try {
        const isMongoId = mongoose.Types.ObjectId.isValid(id);
        let query = isMongoId ? { _id: id } : { spotifyId: id };
        
        let artist = await Artist.findOne(query);
        
        if (!artist && !isMongoId) {
            const spArtist = await spotifyGet(`/artists/${id}`);
            if(spArtist) artist = await upsertArtist(spArtist);
        }

        if (!artist) {
            return res.status(404).json({ message: "Artista não encontrado para buscar álbuns" });
        }

        let albums = await Album.find({ artists: artist._id })
            .populate('artists', 'name')
            .sort({ releaseDate: -1 });

        if (albums.length < 1 && artist.spotifyId) {
            console.log(`Baixando discografia de ${artist.name}...`);
            const spAlbums = await spotifyGet(`/artists/${artist.spotifyId}/albums?include_groups=album,single&limit=20`);
            
            if (spAlbums && spAlbums.items) {
                 await Promise.all(spAlbums.items.map(async (spItem) => {
                     const artistPromises = spItem.artists.map(a => upsertArtist(a));
                     const artistDocs = await Promise.all(artistPromises);
                     const artistIds = artistDocs.map(d => d._id);
                     
                     const albumData = mapAlbum(spItem, artistIds);
                     await Album.findOneAndUpdate(
                         { spotifyId: albumData.spotifyId },
                         { $set: albumData },
                         { new: true, upsert: true }
                     );
                 }));

                 albums = await Album.find({ artists: artist._id })
                    .populate('artists', 'name')
                    .sort({ releaseDate: -1 });
            }
        }

        res.json(albums);

    } catch (err) {
        console.error("Erro no getArtistAlbums:", err);
        res.status(500).json({ message: "Erro ao buscar álbuns", error: err.message });
    }
};

export const getArtistTopTracks = async (req, res) => {
    const { id } = req.params; 

    try {
        // Melhor usar o validador do Mongoose para consistência
        const isMongoId = mongoose.Types.ObjectId.isValid(id);
        let query = isMongoId ? { _id: id } : { spotifyId: id };
        
        let artist = await Artist.findOne(query);

        if (!artist && !isMongoId) {
             const spArtist = await spotifyGet(`/artists/${id}`);
             if(spArtist) artist = await upsertArtist(spArtist);
        }

        if (!artist) return res.status(404).json({ message: "Artista não encontrado" });

        if (artist.spotifyId) {
            const spTopTracks = await spotifyGet(`/artists/${artist.spotifyId}/top-tracks?market=BR`);

            if (spTopTracks && spTopTracks.tracks) {
                const trackPromises = spTopTracks.tracks.map(async (spTrack) => {
                    // 1. Garante/Atualiza os artistas da música
                    const artistPromises = spTrack.artists.map(a => upsertArtist(a));
                    const artistDocs = await Promise.all(artistPromises);
                    const artistIds = artistDocs.map(d => d._id);

                    // 2. CORREÇÃO: Lógica do Álbum preenchida
                    let albumId = null;
                    if (spTrack.album) {
                        // Precisamos garantir que os artistas do álbum existam
                        const albumArtistPromises = spTrack.album.artists.map(a => upsertArtist(a));
                        const albumArtistDocs = await Promise.all(albumArtistPromises);
                        const albumArtistIds = albumArtistDocs.map(d => d._id);

                        // Mapeia e salva o álbum no banco
                        const albumData = mapAlbum(spTrack.album, albumArtistIds);
                        const savedAlbum = await Album.findOneAndUpdate(
                            { spotifyId: albumData.spotifyId },
                            { $set: albumData },
                            { new: true, upsert: true }
                        );
                        
                        // Pega o ID do Mongo do álbum salvo
                        albumId = savedAlbum._id;
                    }

                    // 3. Cria a música vinculando o ID do álbum correto
                    const trackData = mapTrack(spTrack, artistIds, albumId);
                    
                    return await Song.findOneAndUpdate(
                        { spotifyId: trackData.spotifyId },
                        { $set: trackData },
                        { new: true, upsert: true }
                    ).populate('artists', 'name').populate('album', 'title cover');
                });

                const topSongs = await Promise.all(trackPromises);
                return res.json(topSongs);
            }
        }

        const localTopSongs = await Song.find({ artists: artist._id })
            .sort({ popularity: -1 })
            .limit(10)
            .populate('artists', 'name')
            .populate('album', 'title cover');

        res.json(localTopSongs);

    } catch (err) {
        console.error("Erro ao buscar top tracks:", err);
        res.status(500).json({ message: "Erro ao buscar sucessos do artista" });
    }
};

export const updateArtist = async (req, res) => {
    const { id } = req.params;
    const { name, genre, image } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "ID de artista inválido." });
        }

        const updatedArtist = await Artist.findByIdAndUpdate(
            id,
            { 
                $set: { 
                    name, 
                    genres: genre ? [genre] : undefined,
                    image 
                } 
            },
            { new: true } 
        );

        if (!updatedArtist) {
            return res.status(404).json({ message: "Artista não encontrado." });
        }

        res.status(200).json(updatedArtist);

    } catch (error) {
        console.error("Erro ao atualizar artista:", error);
        res.status(500).json({ message: "Erro interno ao atualizar artista." });
    }
};

// Se você tiver uma função de deletar, adicione também:
export const deleteArtist = async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('ID Inválido');

        await Artist.findByIdAndDelete(id);
        res.json({ message: "Artista excluído com sucesso." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

