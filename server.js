const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fallbackProducts = [
  { id: 1, name: 'Atta', price: 45, unit: 'kg', category: 'Groceries' },
  { id: 2, name: 'Rice', price: 60, unit: 'kg', category: 'Groceries' },
  { id: 3, name: 'Milk', price: 28, unit: 'litre', category: 'Dairy' },
  { id: 4, name: 'Eggs', price: 8, unit: 'dozen', category: 'Dairy' }
];

let dbPool = null;
let orderStore = [];
const dbName = process.env.DB_NAME || 'kirana_store';

async function initializeDatabase() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.log('MySQL env vars not set. Running with fallback in-memory data.');
    return;
  }

  try {
    const initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await initialConnection.end();

    dbPool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(80) NOT NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(120) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        items JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [existingProducts] = await dbPool.query('SELECT COUNT(*) AS count FROM products');
    if (existingProducts[0].count === 0) {
      const inserts = fallbackProducts.map((item) =>
        dbPool.query('INSERT INTO products (name, price, unit, category) VALUES (?, ?, ?, ?)', [item.name, item.price, item.unit, item.category])
      );
      await Promise.all(inserts);
    }

    console.log('MySQL connected successfully.');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.log('Falling back to in-memory storage.');
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: dbPool ? 'mysql' : 'fallback' });
});

app.get('/api/products', async (req, res) => {
  if (dbPool) {
    try {
      const [rows] = await dbPool.query('SELECT * FROM products ORDER BY id');
      return res.json(rows);
    } catch (error) {
      console.error(error);
    }
  }

  res.json(fallbackProducts);
});

app.post('/api/orders', async (req, res) => {
  const { customerName, phone, address, items } = req.body;

  if (!customerName || !phone || !address || !items?.length) {
    return res.status(400).json({ success: false, message: 'Please complete all required order details.' });
  }

  const payload = {
    customerName,
    phone,
    address,
    items,
    createdAt: new Date().toISOString()
  };

  if (dbPool) {
    try {
      await dbPool.query(
        'INSERT INTO orders (customer_name, phone, address, items) VALUES (?, ?, ?, ?)',
        [customerName, phone, address, JSON.stringify(items)]
      );
      return res.json({ success: true, message: 'Home delivery request received.', payload });
    } catch (error) {
      console.error(error);
    }
  }

  orderStore.push(payload);
  res.json({ success: true, message: 'Home delivery request received.', payload });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Kirana store running at http://localhost:${port}`);
  });
});
