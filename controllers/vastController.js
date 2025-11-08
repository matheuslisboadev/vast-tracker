const { supabase } = require('../config/supabase');

async function saveVastEvent(req, res) {
    try {
        const {
            url,
            creative,
            ad,
            ts,
            placement,
            package: packageName
        } = { ...req.query, ...req.body };

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL é obrigatória'
            });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const referer = req.get('referer');
        const acceptLanguage = req.get('accept-language');
        
        let deviceType = 'desktop';
        if (userAgent) {
            if (/mobile/i.test(userAgent)) deviceType = 'mobile';
            else if (/tablet/i.test(userAgent)) deviceType = 'tablet';
        }

        const eventData = {
            url,
            creative,
            ad,
            ts,
            placement,
            package: packageName,
            ip_address: ipAddress,
            user_agent: userAgent,
            referer,
            accept_language: acceptLanguage,
            device_type: deviceType
        };

        const { data, error } = await supabase
            .from('vast_events')
            .insert([eventData])
            .select();

        if (error) {
            console.error('Erro ao inserir evento VAST:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao salvar evento',
                details: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Evento VAST salvo com sucesso',
            data: data[0]
        });

    } catch (error) {
        console.error('Erro no saveVastEvent:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
}

async function getVastEvents(req, res) {
    try {
        const {
            creative,
            ad,
            placement,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query;

        let query = supabase
            .from('vast_events')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, parseInt(offset) + parseInt(limit) - 1);

        if (creative) query = query.eq('creative', creative);
        if (ad) query = query.eq('ad', ad);
        if (placement) query = query.eq('placement', placement);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error, count } = await query;

        if (error) {
            console.error('Erro ao buscar eventos:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar eventos'
            });
        }

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Erro no getVastEvents:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
}

async function getVastStats(req, res) {
    try {
        const { startDate, endDate } = req.query;

        let query = supabase
            .from('vast_stats')
            .select('*');

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas'
            });
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Erro no getVastStats:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
}

async function healthCheck(req, res) {
    try {
        const { error } = await supabase
            .from('vast_events')
            .select('count')
            .limit(1);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'API funcionando corretamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            message: 'Erro na conexão com o banco',
            error: error.message
        });
    }
}

module.exports = {
    saveVastEvent,
    getVastEvents,
    getVastStats,
    healthCheck
};