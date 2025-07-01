const express = require('express');
const cors = require('cors');
const notes = require('./src/API/routes');
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Notes App API",
            version: "1.0.0",
            description: "A simple app for boards with notes"
        },
        servers: [
            {
                url: "http://localhost:7000"
            }
        ],
    },
    apis: ["./src/API/routes.js"],
}

const specs = swaggerJsDoc(options);

const app = express();
const port = 7000;

app.use(express.json());
app.use(cors());

app.use('/', notes);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));


app.listen(port, () => console.log('App listening on port: ' + port));