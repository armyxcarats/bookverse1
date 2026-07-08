const connection = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.addressChart = async (req, res) => {
    const sql = 'SELECT count(addressline) as total, addressline FROM customer GROUP BY addressline ORDER BY total DESC';
    try {
        const rows = await connection.query(sql, { type: QueryTypes.SELECT });
        return res.status(200).json({ rows });
    } catch (error) {
        console.error('Address chart error:', error);
        return res.status(500).json({ error: 'Unable to load address chart data' });
    }
};

exports.salesChart = async (req, res) => {
    const sql = 'SELECT monthname(oi.date_placed) as month, sum(ol.quantity * i.sell_price) as total FROM orderinfo oi INNER JOIN orderline ol ON oi.orderinfo_id = ol.orderinfo_id INNER JOIN item i ON i.item_id = ol.item_id GROUP BY month(oi.date_placed)';
    try {
        const rows = await connection.query(sql, { type: QueryTypes.SELECT });
        return res.status(200).json({ rows });
    } catch (error) {
        console.error('Sales chart error:', error);
        return res.status(500).json({ error: 'Unable to load sales chart data' });
    }
};

exports.itemsChart = async (req, res) => {
    const sql = 'SELECT i.title as items, sum(ol.quantity) as total FROM item i INNER JOIN orderline ol ON i.item_id = ol.item_id GROUP BY i.title';
    try {
        const rows = await connection.query(sql, { type: QueryTypes.SELECT });
        return res.status(200).json({ rows });
    } catch (error) {
        console.error('Items chart error:', error);
        return res.status(500).json({ error: 'Unable to load items chart data' });
    }
};