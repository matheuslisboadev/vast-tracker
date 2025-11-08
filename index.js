/**
 * Servidor principal da API de VAST Tracking
 * Inicializa o Express e configura middlewares
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const vastRoutes = require('./routes/vast');
const { testConnection } = require('./config/supabase');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES DE SEGURANÇA =====

// Helmet: proteção contra vulnerabilidades conhecidas
app.use(helmet());

// CORS: permitir requisições cross-origin
app.use(cors({
    origin: '*', // Em produção, especifique os domínios permitidos
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: prevenir abuso da API
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ===== MIDDLEWARES DE PARSING =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// ===== LOGGING MIDDLEWARE =====
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ===== ROTAS =====
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'VAST Tracking API',
        version: '1.0.0',
        endpoints: {
            'POST /api/vast/event': 'Registrar evento VAST',
            'GET /api/vast/event': 'Registrar evento VAST (via GET)',
            'GET /api/vast/events': 'Listar eventos',
            'GET /api/vast/stats': 'Obter estatísticas',
            'GET /api/vast/health': 'Health check'
        }
    });
});

app.use('/api/vast', vastRoutes);

// ===== TRATAMENTO DE ERROS =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
    });
});

app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
async function startServer() {
    try {
        console.log('🔍 Testando conexão com Supabase...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('❌ Falha na conexão com Supabase. Verifique as credenciais no .env');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL local: http://localhost:${PORT}`);
            console.log(`\n📝 Endpoints disponíveis:`);
            console.log(`   POST http://localhost:${PORT}/api/vast/event`);
            console.log(`   GET  http://localhost:${PORT}/api/vast/events`);
            console.log(`   GET  http://localhost:${PORT}/api/vast/stats`);
            console.log(`   GET  http://localhost:${PORT}/api/vast/health\n`);
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'razão:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
    process.exit(1);
});