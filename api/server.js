const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const SECRET = 'dev_secret_key';

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Login (Fixed: Returns user ID in token)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    // Simple check: In production use bcrypt.compare
    if (user && user.password_hash === password) { 
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET);
      res.json({ token, role: user.role, name: user.name });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' }); 
  }
});

// 2. Add New Agent (ADMIN ONLY)
app.post('/api/agents', async (req, res) => {
  const { name, email, password } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create agents' });
    }

    // Explicitly check for missing fields before hitting the DB
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, email, password) are required' });
    }

    const query = `
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ($1, $2, $3, 'AGENT') 
      RETURNING id, name, email, role`;
      
    const result = await pool.query(query, [name, email, password]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("DEBUG AGENT ERROR:", err.message);
    
    if (err.code === '23505') {
      return res.status(400).json({ error: 'This email is already registered.' });
    }
    if (err.code === '42703') {
      return res.status(500).json({ error: 'Database schema error: "role" column missing' });
    }
    
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
});

// 3. Add New Field (AGENT ONLY)
app.post('/api/fields', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    const { name, crop_type } = req.body;
    
    const query = `
      INSERT INTO fields (name, crop_type, agent_id, current_stage, planting_date)
      VALUES ($1, $2, $3, 'Planted', CURRENT_DATE)
      RETURNING *`;
    
    const result = await pool.query(query, [name, crop_type, user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { 
    console.error(err);
    res.status(401).json({ error: 'Session expired or unauthorized' }); 
  }
});

// 4. Get Fields
app.get('/api/fields', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    let query = 'SELECT f.*, u.name as agent_name FROM fields f JOIN users u ON f.agent_id = u.id';
    let params = [];
    if (user.role === 'AGENT') {
      query += ' WHERE f.agent_id = $1';
      params = [user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(403).json({ error: 'Access denied' }); }
});
app.get('/api/observations', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, SECRET);
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admins only' });

    const query = `
      SELECT o.*, f.name as field_name, u.name as agent_name 
      FROM observations o
      JOIN fields f ON o.field_id = f.id
      JOIN users u ON f.agent_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 20;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});
app.patch('/api/fields/:id', async (req, res) => {
  const { id } = req.params;
  const { stage, note } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE fields SET current_stage = $1 WHERE id = $2', [stage, id]);
      await client.query('INSERT INTO observations (field_id, note) VALUES ($1, $2)', [id, note]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { res.status(400).json({ error: 'Update failed' }); }
});

app.listen(5000, () => console.log('✅ Server active on port 5000'));