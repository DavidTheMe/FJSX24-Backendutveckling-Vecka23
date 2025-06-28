const express = require('express');
const cors = require('cors');
const notes = require('./src/API/routes');

const app = express();
const port = 7000;

app.use(express.json());
app.use(cors());

app.use('/', notes);


app.listen(port, () => console.log('App listening on port: ' + port));