const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Faltam variáveis de ambiente: SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias');
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('vast_events')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com Supabase:', error.message);
        return false;
    }
}

module.exports = {
    supabase,
    testConnection
};