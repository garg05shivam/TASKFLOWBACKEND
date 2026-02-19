const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description: "API documentation for TaskFlow Backend",
      tags: [
  { name: "Auth", description: "Authentication APIs" },
  { name: "Projects", description: "Project management APIs" },
  { name: "Tasks", description: "Task management APIs" },
],

    },
    servers: [
  {
    url: process.env.BASE_URL || "http://localhost:5000",
  },
],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
