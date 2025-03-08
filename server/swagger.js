import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BusfahrerV2 Game API',
      version: '1.0.0',
      description: 'API documentation for the Busfahrer multiplayer game.',
    },
    servers: [
      {
        url: `${process.env.BASE_URL}`,
        description: 'Backend server',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
