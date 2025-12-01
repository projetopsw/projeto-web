const MAX_LIKES_TO_ANALYZE = 5;
const PREFERENCE_COOKIE_KEY = 'user_music_preferences';
const LIKES_COOKIE_KEY = 'pending_likes';

class PreferenceService {

    async recordLike(req, res, songId) {
        let pendingLikes = req.cookies[LIKES_COOKIE_KEY] || [];
        
        if (!pendingLikes.includes(songId)) {
            pendingLikes.push(songId);
        }
        
        res.cookie(LIKES_COOKIE_KEY, pendingLikes, { httpOnly: true, maxAge: 900000 }); 

        if (pendingLikes.length >= MAX_LIKES_TO_ANALYZE) {
            return this.analyzeAndSetPreference(res, pendingLikes);
        }

        return { analyzed: false, count: pendingLikes.length };
    }

    async analyzeAndSetPreference(res, songIds) {
        const MusicaModel = (await import('../models/song.model.js')).default; 
        
        const allDetailsPromises = songIds.map(id => MusicaModel.getDetailsForPreference(id));
        const allDetails = (await Promise.all(allDetailsPromises)).filter(d => d);
        
        const genreCounts = {};
        const artistCounts = {};

        allDetails.forEach(detail => {
            detail.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
            detail.artistNames.forEach(artist => {
                artistCounts[artist] = (artistCounts[artist] || 0) + 1;
            });
        });

        const topGenres = Object.entries(genreCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([genre]) => genre);
        
        const topArtists = Object.entries(artistCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([artist]) => artist);

        const analysisResult = {
            topGenres,
            topArtists,
            timestamp: new Date().toISOString()
        };

        res.cookie(PREFERENCE_COOKIE_KEY, JSON.stringify(analysisResult), { 
            maxAge: 30 * 24 * 60 * 60 * 1000, 
            httpOnly: true, 
            sameSite: 'Lax'
        });

        res.clearCookie(LIKES_COOKIE_KEY);

        return { analyzed: true, preferences: analysisResult };
    }
        getPreferences(req) {
        const preferences = req.cookies[PREFERENCE_COOKIE_KEY];
        return preferences ? JSON.parse(preferences) : null;
    }
}

export default new PreferenceService();