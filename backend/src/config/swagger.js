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
                url: 'http://localhost:8000',
                description: 'Development server',
            },
            {
                url: 'https://api.hoperxpharma.com',
                description: 'Production server',
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
