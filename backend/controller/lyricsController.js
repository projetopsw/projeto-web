import Song from "../models/song.model.js";
import { Client } from "genius-lyrics"; 

const genius = new Client(); 

export const getSongLyrics = async (req, res) => {
    const { id } = req.params; 

    try {
        const song = await Song.findById(id).populate('artists');

        if (!song) return res.status(404).json({ message: "Música não encontrada" });

        if (song.lyrics && song.lyrics.length > 10) {
            return res.json({ lyrics: song.lyrics });
        }

        const artistName = song.artists && song.artists[0] ? song.artists[0].name : "";
        const searchTerm = `${song.title} ${artistName}`;
        
        console.log(`Buscando letra para: ${searchTerm}`);

        const searches = await genius.songs.search(searchTerm);

        if (!searches || searches.length === 0) {
            return res.status(404).json({ message: "Letra não encontrada" });
        }

        const firstSong = searches[0];
        const lyrics = await firstSong.lyrics();

        song.lyrics = lyrics;
        await song.save();

        res.json({ lyrics: lyrics });

    } catch (error) {
        console.error("Erro ao buscar letra:", error);
        res.status(500).json({ message: "Erro ao processar letra" });
    }
};