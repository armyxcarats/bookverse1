const db = require('../models');
const { Op } = require('sequelize');
const Item = db.Item;
const Stock = db.Stock;
const ItemImage = db.ItemImage;
const Sequelize = db.Sequelize;
const path = require('path');

function normalizePath(value) {
    return value?.replace(/\\/g, '/') || value;
}

function toWebPath(value) {
    if (!value) return null;
    const p = normalizePath(value);
    // If already a URL or absolute web path containing /images/, return the web segment
    if (/^https?:\/\//.test(p)) return p;
    const idx = p.indexOf('/images/');
    if (idx !== -1) return p.slice(idx);
    // If it already starts with a single slash and looks like a web path, return as-is
    if (p.startsWith('/')) return p;
    // Fallback: construct web path using the filename under /images
    return '/images/' + path.basename(p);
}

// Get all items with stock and images
exports.getAllItems = async (req, res) => {
    try {
        const { search, category } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { description: { [Op.like]: `%${search}%` } },
                { description_text: { [Op.like]: `%${search}%` } },
                { genre: { [Op.like]: `%${search}%` } }
            ];
        }
        if (category) {
            where.genre = category;
        }

        const items = await Item.findAll({
            where,
            include: [{ model: Stock }, { model: ItemImage }]
        });

        // Convert stored filesystem paths to web-accessible paths before sending
        const normalized = items.map(i => {
            const obj = i.toJSON();
            obj.img_path = toWebPath(obj.img_path);
            if (Array.isArray(obj.ItemImages)) {
                obj.ItemImages = obj.ItemImages.map(im => ({ ...im, file_path: toWebPath(im.file_path) }));
            }
            return obj;
        });

        return res.status(200).json({ rows: normalized });
    } catch (error) {
        console.error({ message: error && error.message, original: error && error.original, parent: error && error.parent, stack: error && error.stack });
        return res.status(500).json({ error: 'Error fetching items' });
    }
};

exports.getItemCategories = async (req, res) => {
    try {
        const categories = await Item.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('genre')), 'genre']],
            raw: true
        });
        const result = categories.map(r => r.genre).filter(Boolean);
        return res.status(200).json({ categories: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching categories' });
    }
};

// Get single item with stock and images
exports.getSingleItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id, {
            include: [{ model: Stock }, { model: ItemImage }]
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        return res.status(200).json({ success: true, result: item });
    } catch (error) {
        console.error({ message: error && error.message, original: error && error.original, parent: error && error.parent, stack: error && error.stack });
        return res.status(500).json({ error: 'Error fetching item' });
    }
};

// Create item with stock and optional images
exports.createItem = async (req, res, next) => {
    try {
        const { description, description_text, cost_price, sell_price, quantity, img_path, genre, on_sale, sale_price } = req.body;
        const files = req.files || [];
        const imagePath = files.length ? toWebPath(files[0].path) : toWebPath(img_path) || null;
        const isOnSale = !!Number(on_sale);

        if (!description || !cost_price || !sell_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (isOnSale && !sale_price) {
            return res.status(400).json({ error: 'Sale price is required when item is on sale' });
        }

        const item = await Item.create({
            description,
            description_text: description_text || null,
            genre: genre || null,
            cost_price,
            sell_price,
            on_sale: isOnSale,
            sale_price: isOnSale ? sale_price : null,
            img_path: imagePath
        });

        await Stock.create({
            item_id: item.item_id,
            quantity: quantity || 0
        });

        if (files.length) {
            const images = files.map((file) => ({
                item_id: item.item_id,
                file_path: toWebPath(file.path)
            }));
            await ItemImage.bulkCreate(images);
        }

        return res.status(201).json({
            success: true,
            itemId: item.item_id,
            item
        });
    } catch (error) {
        console.error({ message: error && error.message, original: error && error.original, parent: error && error.parent, stack: error && error.stack });
        return res.status(500).json({ error: 'Error creating item', details: error.message });
    }
};

// Update item with stock and optional new images
exports.updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description, description_text, cost_price, sell_price, quantity, img_path, genre, on_sale, sale_price } = req.body;
        const files = req.files || [];
        const imagePath = files.length ? toWebPath(files[0].path) : toWebPath(img_path) || null;
        const isOnSale = !!Number(on_sale);

        if (!description || !cost_price || !sell_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (isOnSale && !sale_price) {
            return res.status(400).json({ error: 'Sale price is required when item is on sale' });
        }

        const updateData = {
            description,
            description_text: description_text || null,
            genre: genre || null,
            cost_price,
            sell_price,
            on_sale: isOnSale,
            sale_price: isOnSale ? sale_price : null
        };
        if (imagePath) {
            updateData.img_path = imagePath;
        }

        await Item.update(updateData, { where: { item_id: id } });

        await Stock.update(
            { quantity: quantity || 0 },
            { where: { item_id: id } }
        );

        if (files.length) {
            const images = files.map((file) => ({
                item_id: id,
                file_path: toWebPath(file.path)
            }));
            await ItemImage.bulkCreate(images);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error({ message: error && error.message, original: error && error.original, parent: error && error.parent, stack: error && error.stack });
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

// Delete item and related stock/images
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        await ItemImage.destroy({ where: { item_id: id } });
        await Stock.destroy({ where: { item_id: id } });
        await Item.destroy({ where: { item_id: id } });

        return res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error({ message: error && error.message, original: error && error.original, parent: error && error.parent, stack: error && error.stack });
        return res.status(500).json({ error: 'Error deleting item', details: error.message });
    }
};