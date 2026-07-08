const fs = require('fs');
const path = require('path');
const connection = require('../config/_database');

const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.execute(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const loadBadWords = () => {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'badwords.json');
    const file = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(file);
    if (Array.isArray(parsed)) {
      return parsed.map(word => word.toString().trim().toLowerCase()).filter(Boolean);
    }
  } catch (error) {
    console.warn('Unable to load bad words file:', error.message);
  }
  return [];
};

const badWords = loadBadWords();

const sanitizeBadWords = (text) => {
  if (!text || typeof text !== 'string') return text;
  return badWords.reduce((current, badWord) => {
    const pattern = new RegExp(`\\b${badWord.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
    return current.replace(pattern, match => '*'.repeat(match.length));
  }, text);
};

const getCustomerIdForUser = async (userId) => {
  const sql = 'SELECT customer_id FROM customer WHERE user_id = ? LIMIT 1';
  const results = await executeQuery(sql, [userId]);
  return Array.isArray(results) && results.length ? results[0].customer_id : null;
};

exports.listReviews = async (req, res) => {
  try {
    const itemId = parseInt(req.query.itemId, 10);
    const params = [];
    const whereClause = itemId ? 'WHERE item_id = ?' : '';
    if (itemId) params.push(itemId);

    const sql = `
      SELECT r.review_id AS id,
             r.rating,
             r.review_text AS comment,
             r.created_at,
             i.item_id AS bookId,
             COALESCE(NULLIF(i.title, ''), NULLIF(i.description_text, ''), 'Unnamed book') AS bookTitle,
             CONCAT(c.fname, ' ', c.lname) AS reviewer
      FROM review r
      INNER JOIN (
        SELECT item_id, customer_id, MAX(created_at) AS max_created
        FROM review
        ${whereClause}
        GROUP BY item_id, customer_id
      ) latest ON latest.customer_id = r.customer_id AND latest.item_id = r.item_id AND latest.max_created = r.created_at
      INNER JOIN item i ON r.item_id = i.item_id
      INNER JOIN customer c ON r.customer_id = c.customer_id
      ${itemId ? 'WHERE r.item_id = ?' : ''}
      ORDER BY r.created_at DESC
    `;

    if (itemId) params.push(itemId);
    const results = await executeQuery(sql, params);
    return res.status(200).json(results || []);
  } catch (error) {
    console.error('Error listing reviews:', error);
    return res.status(500).json({ error: 'Unable to list reviews', details: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const itemId = parseInt(req.body.item_id, 10);
    const rating = parseInt(req.body.rating, 10);
    const reviewText = typeof req.body.review_text === 'string' ? req.body.review_text.trim() : '';

    if (!userId) {
      return res.status(401).json({ error: 'User authentication missing' });
    }
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ error: 'item_id is required and must be a valid number' });
    }
    if (!rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating is required and must be between 1 and 5' });
    }
    if (!reviewText) {
      return res.status(400).json({ error: 'review_text is required' });
    }

    const verifySql = `
      SELECT 1
      FROM orderinfo oi
      INNER JOIN customer c ON oi.customer_id = c.customer_id
      INNER JOIN users u ON u.id = c.user_id
      INNER JOIN orderline ol ON ol.orderinfo_id = oi.orderinfo_id
      WHERE u.id = ?
        AND ol.item_id = ?
        AND oi.status = 'delivered'
      LIMIT 1
    `;

    const verified = await executeQuery(verifySql, [userId, itemId]);
    if (!Array.isArray(verified) || !verified.length) {
      return res.status(403).json({ error: 'Reviews are only allowed for items from your delivered orders.' });
    }

    const customerId = await getCustomerIdForUser(userId);
    if (!customerId) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const sanitizedText = sanitizeBadWords(reviewText);

    const existingReviewSql = 'SELECT review_id FROM review WHERE item_id = ? AND customer_id = ? LIMIT 1';
    const existingReviews = await executeQuery(existingReviewSql, [itemId, customerId]);
    if (Array.isArray(existingReviews) && existingReviews.length) {
      const reviewId = existingReviews[0].review_id;
      const updateSql = 'UPDATE review SET rating = ?, review_text = ?, created_at = NOW() WHERE review_id = ?';
      await executeQuery(updateSql, [rating, sanitizedText, reviewId]);
      return res.status(200).json({ success: true, updated: true, message: 'Review updated successfully.' });
    }

    const insertSql = 'INSERT INTO review(item_id, customer_id, rating, review_text) VALUES (?, ?, ?, ?)';
    await executeQuery(insertSql, [itemId, customerId, rating, sanitizedText]);

    return res.status(201).json({ success: true, updated: false, message: 'Review submitted successfully.' });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: 'Unable to submit review', details: error.message });
  }
};
