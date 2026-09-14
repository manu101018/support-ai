import { pool } from './pool';

export async function getOrderById(orderId: number) {
    const result = await pool.query(
        `SELECT o.id, o.status, o.payment_status, o.total_amount, o.created_at,
            u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
        [orderId]
    );
    return result.rows[0] ?? null;
}

export async function getPaymentByOrderId(orderId: number) {
    const result = await pool.query(
        `SELECT p.id, p.status, p.transaction_id, p.amount, p.created_at,
            o.id AS order_id, o.status AS order_status
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     WHERE p.order_id = $1`,
        [orderId]
    );
    return result.rows[0] ?? null;
}