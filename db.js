const Pool = require('pg').Pool;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "notesapp",
    password: "12345",
    port: 8000,
});

module.exports = pool;