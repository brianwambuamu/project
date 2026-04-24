const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crop_db',
  password: 'yobby254', // The one you set during installation
  port: 5432,
});

module.exports = pool;
// pool.connect().then(()=>console.log("connected"))