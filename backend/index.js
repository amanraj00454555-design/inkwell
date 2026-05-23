const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

// ─── DATABASE ───────────────────────────────────────
const db = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root123',
  database: 'blog_db',
  waitForConnections: true,
  connectionLimit: 10,
});
db.getConnection((err, connection) => {
  if (err) { console.log('Database connection failed:', err); return; }
  console.log('MySQL connected successfully!');
  connection.release();
});

// ─── MIDDLEWARE ─────────────────────────────────────
const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  const token = auth?.split(' ')[1] || auth;
  if (!token) return res.json({ message: 'No token provided' });
  jwt.verify(token, 'blogplatformsecret2026', (err, decoded) => {
    if (err) return res.json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// ─── AUTH ────────────────────────────────────────────

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ message: 'All fields required' });
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed], (err) => {
    if (err) return res.json({ message: 'Email already exists' });
    res.json({ message: 'Registered successfully' });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (!results.length) return res.json({ message: 'User not found' });
    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.json({ message: 'Wrong password' });
    const token = jwt.sign({ id: results[0].id, name: results[0].name }, 'blogplatformsecret2026', { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, name: results[0].name, id: results[0].id });
  });
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
  db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (!results.length) return res.json({ message: 'User not found' });
    res.json(results[0]);
  });
});

// ─── POSTS ───────────────────────────────────────────

// Get all posts
app.get('/api/posts', (req, res) => {
  const sql = `
    SELECT p.*, u.name as author_name,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `;
  db.query(sql, (err, results) => res.json(results));
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
  const sql = `
    SELECT p.*, u.name as author_name,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (!results.length) return res.json({ message: 'Post not found' });
    res.json(results[0]);
  });
});

// Create post
app.post('/api/posts', verifyToken, (req, res) => {
  const { title, content, category, cover_emoji } = req.body;
  if (!title || !content) return res.json({ message: 'Title and content required' });
  const sql = 'INSERT INTO posts (user_id, title, content, category, cover_emoji) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [req.user.id, title, content, category || 'General', cover_emoji || '📝'], (err, result) => {
    res.json({ message: 'Post created successfully', id: result.insertId });
  });
});

// Update post
app.put('/api/posts/:id', verifyToken, (req, res) => {
  const { title, content, category, cover_emoji } = req.body;
  db.query('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, results) => {
    if (!results.length) return res.json({ message: 'Post not found' });
    if (results[0].user_id !== req.user.id) return res.json({ message: 'Not authorized' });
    const sql = 'UPDATE posts SET title=?, content=?, category=?, cover_emoji=? WHERE id=?';
    db.query(sql, [title, content, category, cover_emoji, req.params.id], () => {
      res.json({ message: 'Post updated successfully' });
    });
  });
});

// Delete post
app.delete('/api/posts/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, results) => {
    if (!results.length) return res.json({ message: 'Post not found' });
    if (results[0].user_id !== req.user.id) return res.json({ message: 'Not authorized' });
    db.query('DELETE FROM posts WHERE id = ?', [req.params.id], () => {
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Get posts by user
app.get('/api/users/:id/posts', (req, res) => {
  const sql = `
    SELECT p.*, u.name as author_name,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ? ORDER BY p.created_at DESC
  `;
  db.query(sql, [req.params.id], (err, results) => res.json(results));
});

// ─── COMMENTS ────────────────────────────────────────

// Get comments for post
app.get('/api/posts/:id/comments', (req, res) => {
  const sql = `
    SELECT c.*, u.name as author_name
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `;
  db.query(sql, [req.params.id], (err, results) => res.json(results));
});

// Add comment
app.post('/api/posts/:id/comments', verifyToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.json({ message: 'Comment cannot be empty' });
  const sql = 'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)';
  db.query(sql, [req.params.id, req.user.id, content], (err, result) => {
    res.json({ message: 'Comment added', id: result.insertId });
  });
});

// Delete comment
app.delete('/api/comments/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM comments WHERE id = ?', [req.params.id], (err, results) => {
    if (!results.length) return res.json({ message: 'Comment not found' });
    if (results[0].user_id !== req.user.id) return res.json({ message: 'Not authorized' });
    db.query('DELETE FROM comments WHERE id = ?', [req.params.id], () => {
      res.json({ message: 'Comment deleted' });
    });
  });
});

// ─── START ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));