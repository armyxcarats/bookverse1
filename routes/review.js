const express = require('express');
const router = express.Router();
const { listReviews, createReview } = require('../controllers/review');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/reviews', listReviews);
router.post('/reviews', isAuthenticatedUser, createReview);

module.exports = router;
