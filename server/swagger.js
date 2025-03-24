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
        url: "https://localhost:3001",
        description: "Local backend server",
      },
      {
        url: "http://www.busfahrer.life:3001",
        description: "Production server"
      }
    ],
  }, 
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
