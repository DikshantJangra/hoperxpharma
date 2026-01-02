const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HopeRxPharma API',
            version: '1.0.0',
            description: 'Comprehensive Pharmacy Management System API',
            contact: {
                name: 'HopeRxPharma',
                email: 'support@hoperxpharma.com',
            },
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:8000',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/**/*.js', './src/controllers/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
