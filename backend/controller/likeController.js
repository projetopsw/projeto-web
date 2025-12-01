import PreferenceService from '../services/preferenceService.js';

class LikeController {
    static async likeSong(req, res) {
        const { songId } = req.body;
        const userId = req.user.id; 
        
        if (!songId) {
            return res.status(400).json({ error: 'O ID da música é obrigatório.' });
        }

        try {
            const analysisResult = await PreferenceService.recordLike(req, res, songId);
            
            if (analysisResult.analyzed) {
                return res.status(200).json({ 
                    message: 'Preferências analisadas e salvas!', 
                    preferences: analysisResult.preferences 
                });
            }

            return res.status(200).json({ 
                message: `Like registrado. Faltam ${5 - analysisResult.count} para análise.`,
                count: analysisResult.count
            });

        } catch (error) {
            console.error('Erro ao processar like:', error);
            return res.status(500).json({ error: 'Erro interno ao processar o like.' });
        }
    }
}

export default LikeController;