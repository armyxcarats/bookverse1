const connection = require('../config/_database');
const path = require('path');

exports.getAllItems = (req, res) => {
    const sql = 'SELECT * FROM item i INNER JOIN stock s ON i.item_id = s.item_id';

    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }

            // console.log(rows);
            // console.log(fields);
            return res.status(200).json({
                rows,
            })
        });
    } catch (error) {
        console.log(error)
    }
};

exports.getSingleItem = (req, res,) => {
    const sql = 'SELECT * FROM item i INNER JOIN stock s ON i.item_id = s.item_id  WHERE i.item_id = ?'
    console.log(req.params)
    const values = [parseInt(req.params.id)];
    try {
        connection.execute(sql, values, (err, result, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }

            return res.status(200).json({
                success: true,
                result
            })
        });
    } catch (error) {
        console.log(error)
    }
}

exports.createItem = (req, res, next) => {

    console.log(req.body, req.file)
    // const item = req.body
    const image = req.file
    // console.log(item, image)
    const { description, cost_price, sell_price, quantity } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = '/images/' + path.basename(req.file.path);
    }

    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = 'INSERT INTO item (title, cost_price, sell_price, img_path) VALUES (?, ?, ?, ?)';
    const values = [description, cost_price, sell_price, imagePath];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error inserting item', details: err });
        }

        const itemId = result.insertId
        console.log('item id', itemId)

        const stockSql = 'INSERT INTO stock (item_id, quantity) VALUES (?, ?)';
        const stockValues = [itemId, quantity];

        connection.execute(stockSql, stockValues, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error inserting item', details: err });
            }

            return res.status(201).json({
                success: true,
                itemId: result.insertId,
                image: imagePath,
                quantity,
                result
            });
        });
    });
}

exports.updateItem = (req, res, next) => {

    console.log(req.file)
    const item = req.body
    const image = req.file
    const id = req.params.id

    const { description, cost_price, sell_price, quantity } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = '/images/' + path.basename(req.file.path);
    }

    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = 'UPDATE item SET title = ?, cost_price = ?, sell_price = ?, img_path = ? WHERE item_id = ?';
    const values = [description, cost_price, sell_price, imagePath, id];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error inserting item', details: err });
        }
    });

    const stockSql = 'UPDATE stock SET quantity = ? WHERE item_id = ?';
    const stockValues = [quantity, id];

    connection.execute(stockSql, stockValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error updating item', details: err });
        }

    });

    return res.status(201).json({
        success: true,
    });
}

exports.deleteItem = (req, res,) => {

    const id = req.params.id
    const sql = 'DELETE FROM item WHERE item_id = ?';
    const values = [id];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error deleting item', details: err });
        }
    });

    return res.status(201).json({
        success: true,
        message: 'item deleted'
    });
}

