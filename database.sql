CREATE DATABASE IF NOT EXISTS kirana_store;
USE kirana_store;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  items JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, unit, category) VALUES
('Atta', 45.00, 'kg', 'Groceries'),
('Rice', 60.00, 'kg', 'Groceries'),
('Milk', 28.00, 'litre', 'Dairy'),
('Eggs', 8.00, 'dozen', 'Dairy');
