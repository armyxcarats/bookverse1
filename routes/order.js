const express = require('express');

const router = express.Router();

const { createOrder, listOrders, deleteOrder, updateOrderStatus, updateShippingDetails, getOrderItems, cancelOrder } = require('../controllers/order');
const { isAuthenticatedUser, isAdminUser } = require('../middlewares/auth');

router.post('/create-order', isAuthenticatedUser, createOrder);
router.get('/orders', isAuthenticatedUser, listOrders);
router.get('/orders/:orderId/items', isAuthenticatedUser, getOrderItems);
router.put('/orders/:orderId/shipping', isAuthenticatedUser, updateShippingDetails);
router.put('/orders/:orderId/status', isAuthenticatedUser, isAdminUser, updateOrderStatus);
router.put('/orders/:orderId/cancel', isAuthenticatedUser, cancelOrder);
router.delete('/orders/:orderId', isAuthenticatedUser, deleteOrder);

module.exports = router;