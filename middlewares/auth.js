const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

exports.isAuthenticatedUser = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ error: 'Login first to access this resource' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ where: { id: decoded.id, deleted_at: null } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.body = req.body || {};
        req.body.user = { id: user.id, role: user.role };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

exports.isAdminUser = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

