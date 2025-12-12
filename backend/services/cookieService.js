class CookieService {
    
    updateRecentPlays(currentHistoryString, musicId, limit = 10) {
        let historyArray = [];
        
        if (currentHistoryString) {
            historyArray = currentHistoryString.split(',').filter(id => id.length > 0);
        }
        
        const newMusicId = String(musicId); 
        
        historyArray = historyArray.filter(id => id !== newMusicId);
        
        historyArray.unshift(newMusicId);
        
        historyArray = historyArray.slice(0, limit);

        return historyArray.join(',');
    }

    getCookieOptions() {
        const ONE_WEEK = 604800; 

        return {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Lax', 
            maxAge: ONE_WEEK * 1000 
        };
    }
}

export default new CookieService();