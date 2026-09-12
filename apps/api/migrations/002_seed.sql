INSERT INTO users (name, email, phone) VALUES
('Manjeet Singh', 'manjeet@example.com', '+91-9000000001'),
('Priya Sharma', 'priya@example.com', '+91-9000000002'),
('Arjun Rao', 'arjun@example.com', '+91-9000000003');

-- Order 1: fully successful flow
INSERT INTO orders (user_id, status, total_amount, payment_status) VALUES
(1, 'delivered', 2499.00, 'paid');
INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(1, 101, 'Wireless Mouse', 1, 999.00),
(1, 102, 'USB-C Hub', 1, 1500.00);
INSERT INTO payments (order_id, user_id, status, transaction_id, amount) VALUES
(1, 1, 'success', 'TXN-1001', 2499.00);

-- Order 2: the classic support scenario — paid but stuck processing
INSERT INTO orders (user_id, status, total_amount, payment_status) VALUES
(2, 'processing', 4999.00, 'paid');
INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(2, 103, 'Mechanical Keyboard', 1, 4999.00);
INSERT INTO payments (order_id, user_id, status, transaction_id, amount) VALUES
(2, 2, 'success', 'TXN-1002', 4999.00);

-- Order 3: payment failed, order never confirmed — matches roadmap's Day 2 example query
INSERT INTO orders (user_id, status, total_amount, payment_status) VALUES
(3, 'placed', 1299.00, 'failed');
INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(3, 104, 'Phone Case', 1, 1299.00);
INSERT INTO payments (order_id, user_id, status, transaction_id, amount) VALUES
(3, 3, 'failed', 'TXN-1003', 1299.00);

-- Order 4: shipped, will be used for damaged-product scenario later
INSERT INTO orders (user_id, status, total_amount, payment_status) VALUES
(1, 'shipped', 799.00, 'paid');
INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(4, 105, 'Bluetooth Speaker', 1, 799.00);
INSERT INTO payments (order_id, user_id, status, transaction_id, amount) VALUES
(4, 1, 'success', 'TXN-1004', 799.00);