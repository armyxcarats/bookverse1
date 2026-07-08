const connection = require('../config/_database');
const sendEmail = require('../utils/sendEmail');
const generateReceiptPdf = require('../utils/generateReceiptPdf');
const VALID_ORDER_STATUSES = ['pending', 'shipping', 'on delivery', 'cancelled', 'delivered'];
const VALID_PAYMENT_METHODS = ['gcash', 'paymaya', 'cash on delivery'];

const normalizePaymentMethod = (value) => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'gcash') return 'gcash';
    if (normalized === 'paymaya') return 'paymaya';
    if (normalized === 'cash on delivery' || normalized === 'cashondelivery' || normalized === 'cod') return 'cash on delivery';
    return null;
};

const ensurePaymentMethodColumn = () => {
    return new Promise((resolve, reject) => {
        connection.query("SHOW COLUMNS FROM orderinfo LIKE 'payment_method'", (err, results) => {
            if (err) return reject(err);
            if (results && results.length) return resolve();

            connection.query("ALTER TABLE orderinfo ADD COLUMN payment_method VARCHAR(32) DEFAULT NULL", (alterErr) => {
                if (alterErr) {
                    if (/duplicate column|already exists/i.test(alterErr.message)) {
                        return resolve();
                    }
                    return reject(alterErr);
                }
                resolve();
            });
        });
    });
};

const fetchOrderDetails = (orderId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT oi.orderinfo_id AS order_id,
                   oi.date_placed,
                   oi.date_shipped,
                   oi.shipping,
                   oi.shipping_address,
                   oi.shipping_zipcode,
                   oi.shipping_phone,
                   oi.payment_method,
                   oi.status,
                   c.customer_id,
                   c.fname,
                   c.lname,
                   u.id AS user_id,
                   u.email AS customer_email
            FROM orderinfo oi
            INNER JOIN customer c ON oi.customer_id = c.customer_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE oi.orderinfo_id = ?
            LIMIT 1
        `;
        connection.execute(sql, [orderId], (err, results) => {
            if (err) return reject(err);
            if (!results || !results.length) return resolve(null);
            resolve(results[0]);
        });
    });
};

const fetchOrderItems = (orderId) => {
    return new Promise((resolve, reject) => {
        const itemsSql = `
            SELECT ol.quantity,
                   i.item_id,
                   i.title AS description,
                   i.sell_price,
                   i.img_path
            FROM orderline ol
            INNER JOIN item i ON ol.item_id = i.item_id
            WHERE ol.orderinfo_id = ?
        `;
        connection.execute(itemsSql, [orderId], (err, items) => {
            if (err) return reject(err);
            resolve(items || []);
        });
    });
};

const sendStatusUpdateReceipt = async (orderId, status) => {
    const order = await fetchOrderDetails(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const items = await fetchOrderItems(orderId);
    const pdfBuffer = await generateReceiptPdf(order, items);

    const subtotal = items.reduce((sum, item) => {
        const price = Number(item.sell_price || 0);
        const qty = Number(item.quantity || 0);
        return sum + price * qty;
    }, 0);

    const itemsHtml = items.map(item => {
        const price = Number(item.sell_price || 0).toFixed(2);
        const qty = Number(item.quantity || 0);
        const lineTotal = (price * qty).toFixed(2);
        return `
            <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">${item.description || 'Item'}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center;">${qty}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right;">₱${price}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right;">₱${lineTotal}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1f2937; background:#f8fafc; padding:24px;">
            <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 18px 50px rgba(15,23,42,0.08);">
                <div style="background:#640D14; color:#ffffff; padding:28px 32px; text-align:center;">
                    <h1 style="margin:0;font-size:28px;">Bookverse</h1>
                    <p style="margin:8px 0 0; font-size:15px; opacity:0.85;">Order status update</p>
                </div>
                <div style="padding:32px 32px 24px;">
                    <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">Hello ${order.fname || ''} ${order.lname || ''},</p>
                    <p style="margin:0 0 24px; font-size:16px; line-height:1.7;">
                        Your order <strong>#${orderId}</strong> status has been updated to <strong style="color:#640D14; text-transform:capitalize;">${status}</strong>.
                    </p>
                    <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:16px; padding:18px; margin-bottom:24px;">
                        <p style="margin:0 0 8px; font-size:14px; color:#6b7280; letter-spacing:0.02em; text-transform:uppercase;">Order details</p>
                        <p style="margin:0; font-size:15px;"><strong>Order number:</strong> #${orderId}</p>
                        <p style="margin:6px 0 0; font-size:15px;"><strong>Payment method:</strong> ${order.payment_method || 'N/A'}</p>
                        <p style="margin:6px 0 0; font-size:15px;"><strong>Shipping address:</strong> ${order.shipping_address || 'N/A'}</p>
                        <p style="margin:6px 0 0; font-size:15px;"><strong>Zip code:</strong> ${order.shipping_zipcode || 'N/A'}</p>
                        <p style="margin:6px 0 0; font-size:15px;"><strong>Delivery status:</strong> ${status}</p>
                    </div>
                    <table width="100%" style="border-collapse:collapse; margin-bottom:24px;">
                        <thead>
                            <tr style="background:#f3e8ef; text-align:left;">
                                <th style="padding:12px; font-size:14px; color:#6b7280;">Item</th>
                                <th style="padding:12px; font-size:14px; color:#6b7280; text-align:center;">Qty</th>
                                <th style="padding:12px; font-size:14px; color:#6b7280; text-align:right;">Price</th>
                                <th style="padding:12px; font-size:14px; color:#6b7280; text-align:right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
                        <div style="color:#4b5563; font-size:15px;">Subtotal</div>
                        <div style="font-weight:700; font-size:18px; color:#111827;">₱${subtotal.toFixed(2)}</div>
                    </div>
                    <div style="margin-top:24px; padding:20px; background:#f8fafc; border-radius:18px; border:1px solid #e5e7eb;">
                        <p style="margin:0 0 8px; font-size:15px; font-weight:700; color:#111827;">What happens next?</p>
                        <p style="margin:0; font-size:15px; line-height:1.7; color:#4b5563;">You can check the status of your order in your Bookverse account. If you need help, reply to this email or visit our support page.</p>
                    </div>
                </div>
                <div style="background:#111827; color:#f8fafc; padding:18px 32px; text-align:center; font-size:13px;">
                    <p style="margin:0;">Bookverse • A better way to buy books online.</p>
                </div>
            </div>
        </div>
    `;

    await sendEmail({
        email: order.customer_email,
        subject: `Bookverse Order #${orderId} status updated to ${status}`,
        html,
        attachments: [
            {
                filename: `receipt_order_${orderId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });
};

const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.execute(sql, params, (err, results) => {
            if (err) return reject(err);
            return resolve(results);
        });
    });
};

const decrementStockForOrder = async (orderId) => {
    const items = await fetchOrderItems(orderId);
    for (const item of items) {
        const quantity = Number(item.quantity || 0);
        if (!Number.isInteger(quantity) || quantity <= 0) continue;
        await executeQuery('UPDATE stock SET quantity = GREATEST(quantity - ?, 0) WHERE item_id = ?', [quantity, item.item_id]);
    }
};

const getUserRole = async (userId) => {
    const results = await executeQuery('SELECT role FROM users WHERE id = ? LIMIT 1', [parseInt(userId, 10)]);
    return Array.isArray(results) && results.length > 0 ? results[0].role : null;
};

const getCustomerDeliveryDetails = async (userId) => {
    const sql = 'SELECT addressline, zipcode, phone FROM customer WHERE user_id = ? LIMIT 1';
    const results = await executeQuery(sql, [parseInt(userId, 10)]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
};

const isAdminUser = async (userId) => {
    const role = await getUserRole(userId);
    return role === 'admin';
};

exports.createOrder = async (req, res, next) => {
    try {
        const { cart, shipping_cost, payment_amount, payment_method } = req.body;
        const user = req.body.user;

        if (!user || !user.id) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const shippingValue = Number.parseFloat(shipping_cost);
        const shippingAmount = Number.isFinite(shippingValue) ? Number(shippingValue.toFixed(2)) : 0;

        let computedTotal = 0;
        for (const it of cart) {
            const itemId = Number(it.item_id || it.id);
            const qty = Number.parseInt(it.quantity, 10) || 1;
            const price = Number.parseFloat(it.sell_price || it.price || 0);

            if (!Number.isInteger(itemId) || itemId <= 0) {
                return res.status(400).json({ error: `Invalid item_id for cart item`, item: it });
            }
            if (!Number.isInteger(qty) || qty <= 0) {
                return res.status(400).json({ error: `Invalid quantity for item_id: ${itemId}` });
            }
            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({ error: `Invalid price for item_id: ${itemId}` });
            }

            computedTotal += price * qty;
        }
        computedTotal = Number((computedTotal + shippingAmount).toFixed(2));

        const normalizedPaymentMethod = normalizePaymentMethod(payment_method);
        if (!normalizedPaymentMethod || !VALID_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
            return res.status(400).json({ error: 'payment_method is required and must be one of: GCash, PayMaya, Cash on Delivery' });
        }
        const deliveryDetails = await getCustomerDeliveryDetails(user.id);
        if (!deliveryDetails || !deliveryDetails.addressline || !deliveryDetails.zipcode || !deliveryDetails.phone) {
            return res.status(400).json({ error: 'Delivery address, zip code, and phone number are required on your profile before payment.' });
        }
        let payVal = Number.parseFloat(payment_amount);
        if (!Number.isFinite(payVal)) {
            if (normalizedPaymentMethod === 'cash on delivery') {
                payVal = 0;
            } else {
                return res.status(400).json({ error: 'payment_amount is required and must be numeric' });
            }
        }

        await ensurePaymentMethodColumn();

        const paymentCents = Math.round(payVal * 100);
        const totalCents = Math.round(computedTotal * 100);
        if (normalizedPaymentMethod !== 'cash on delivery' && paymentCents < totalCents) {
            console.log('PAYMENT DEBUG:', {
                payment_amount: payVal,
                computedTotal,
                paymentCents,
                totalCents,
                cart
            });
            return res.status(400).json({ error: 'Insufficient payment amount', payment_amount: Number(payVal.toFixed(2)), computedTotal, paymentCents, totalCents });
        }

                        // continue to create order transaction
                        const dateOrdered = new Date();
                        const dateShipped = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                        connection.beginTransaction(err => {
                if (err) return res.status(500).json({ error: 'Transaction error', details: err });

                const customerSql = 'SELECT c.customer_id, u.email FROM customer c INNER JOIN users u ON u.id = c.user_id WHERE u.id = ? LIMIT 1';
                connection.execute(customerSql, [parseInt(user.id, 10)], (err, results) => {
                    if (err || !results || results.length === 0) {
                        return connection.rollback(() => {
                            return res.status(500).json({ error: 'Customer not found', details: err });
                        });
                    }

                    const { customer_id, email } = results[0];
                    const orderInfoSql = 'INSERT INTO orderinfo (customer_id, date_placed, date_shipped, shipping, shipping_address, shipping_zipcode, shipping_phone, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                    connection.execute(orderInfoSql, [customer_id, dateOrdered, dateShipped, shippingAmount, deliveryDetails.addressline, deliveryDetails.zipcode, deliveryDetails.phone, normalizedPaymentMethod, 'pending'], (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                return res.status(500).json({ error: 'Error inserting orderinfo', details: err });
                            });
                        }

                        const order_id = result.insertId;
                        const values = cart.map(item => [order_id, Number(item.item_id || item.id), Number(item.quantity || 1)]);
                        if (values.length === 0) {
                            connection.commit(err => {
                                if (err) return connection.rollback(() => res.status(500).json({ error: 'Commit error', details: err }));
                                return res.status(201).json({ success: true, order_id, datePlaced: dateOrdered, dateShipped, cart });
                            });
                            return;
                        }

                        // Build multi-row insert
                        const placeholders2 = values.map(() => '(?,?,?)').join(',');
                        const orderLineSql = `INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ${placeholders2}`;
                        const params = values.flat();

                        connection.execute(orderLineSql, params, (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    return res.status(500).json({ error: 'Error inserting orderline', details: err });
                                });
                            }

                            connection.commit(async err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        return res.status(500).json({ error: 'Commit error', details: err });
                                    });
                                }

                                try {
                                    await sendEmail({
                                        email,
                                        subject: 'Order Successful',
                                        message: `Your order #${order_id} has been received and is being processed.`
                                    });
                                } catch (emailErr) {
                                    console.log('Email error:', emailErr);
                                }

                                const total_due = Number(computedTotal).toFixed(2);
                                const change_due = Number(payVal - computedTotal).toFixed(2);
                                return res.status(201).json({
                                    success: true,
                                    order_id,
                                    datePlaced: dateOrdered,
                                    dateShipped,
                                    shipping: shippingAmount,
                                    status: 'pending',
                                    total_due,
                                    payment_amount: Number(payVal).toFixed(2),
                                    payment_method: normalizedPaymentMethod,
                                    change_due,
                                    cart
                                });
                            });
                        });
                    });
                });
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating order', details: error.message });
    }
};

exports.listOrders = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }

        const admin = await isAdminUser(userId);
        const whereClause = admin ? '' : 'WHERE u.id = ?';
        const params = admin ? [] : [userId];

        const sql = `
            SELECT oi.orderinfo_id AS order_id,
                   c.customer_id,
                   CONCAT(c.fname, ' ', c.lname) AS customer_name,
                   u.email AS customer_email,
                   oi.date_placed,
                   oi.date_shipped,
                   oi.shipping,
                   oi.shipping_address,
                   oi.shipping_zipcode,
                   oi.payment_method,
                   oi.status,
                     GROUP_CONCAT(CONCAT(ol.quantity, ' x ', i.description_text) SEPARATOR ', ') AS items,
                   SUM(ol.quantity * i.sell_price) AS total_amount
            FROM orderinfo oi
            INNER JOIN orderline ol ON oi.orderinfo_id = ol.orderinfo_id
            INNER JOIN item i ON i.item_id = ol.item_id
            INNER JOIN customer c ON c.customer_id = oi.customer_id
            INNER JOIN users u ON u.id = c.user_id
            ${whereClause}
            GROUP BY oi.orderinfo_id
            ORDER BY oi.date_placed DESC
        `;

        connection.execute(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to list orders', details: err });
            }
            console.log(`Listed ${Array.isArray(results) ? results.length : 0} order(s) for user ${userId}`);
            return res.status(200).json(results);
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error listing orders', details: error.message });
    }
};

exports.updateShippingDetails = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const orderId = parseInt(req.params.orderId, 10);
        const { shipping_address, shipping_zipcode, shipping_phone } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        if (!shipping_address || !shipping_zipcode || !shipping_phone) {
            return res.status(400).json({ error: 'Shipping address, zip code, and phone number are required' });
        }

        const ownershipSql = `
            SELECT u.id AS user_id
            FROM orderinfo oi
            INNER JOIN customer c ON oi.customer_id = c.customer_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE oi.orderinfo_id = ?
            LIMIT 1
        `;

        connection.execute(ownershipSql, [orderId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to verify order ownership', details: err });
            }
            if (!results || !results.length) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const ownerId = results[0].user_id;
            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Not allowed to update shipping details for this order' });
            }

            const updateSql = 'UPDATE orderinfo SET shipping_address = ?, shipping_zipcode = ?, shipping_phone = ? WHERE orderinfo_id = ?';
            connection.execute(updateSql, [shipping_address, shipping_zipcode, shipping_phone, orderId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Unable to update shipping details', details: err });
                }
                if (!result || result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Order not found' });
                }
                return res.status(200).json({ success: true, order_id: orderId, shipping_address, shipping_zipcode, shipping_phone });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error updating shipping details', details: error.message });
    }
};

exports.getOrderReceipt = async (req, res) => {
    try {
        const userId = req.body.user?.id || req.user?.id;
        const orderId = parseInt(req.params.orderId, 10);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const order = await fetchOrderDetails(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const admin = await isAdminUser(userId);
        if (!admin && order.user_id !== userId) {
            return res.status(403).json({ error: 'Not allowed to access this receipt' });
        }

        const items = await fetchOrderItems(orderId);
        const pdfBuffer = await generateReceiptPdf(order, items);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="receipt_order_${orderId}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        return res.status(500).json({ error: 'Error generating receipt', details: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const orderId = parseInt(req.params.orderId, 10);
        const status = String(req.body.status || '').trim().toLowerCase();

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        if (!VALID_ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Valid values: ${VALID_ORDER_STATUSES.join(', ')}` });
        }

        const admin = await isAdminUser(userId);
        if (!admin) {
            return res.status(403).json({ error: 'Only admin users can update order status' });
        }

        const previousOrder = await fetchOrderDetails(orderId);
        if (!previousOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updates = ['status = ?'];
        const params = [status];
        if (['shipping', 'on delivery', 'delivered'].includes(status)) {
            updates.push('date_shipped = NOW()');
        }
        const updateSql = `UPDATE orderinfo SET ${updates.join(', ')} WHERE orderinfo_id = ?`;
        params.push(orderId);

        connection.execute(updateSql, params, async (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to update order status', details: err });
            }
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            if (status === 'delivered' && previousOrder.status !== 'delivered') {
                try {
                    await decrementStockForOrder(orderId);
                } catch (stockErr) {
                    console.log('Stock decrement error:', stockErr);
                }
            }

            try {
                await sendStatusUpdateReceipt(orderId, status);
            } catch (emailErr) {
                console.log('Receipt email error:', emailErr);
            }

            return res.status(200).json({ success: true, order_id: orderId, status });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error updating order status', details: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const orderId = parseInt(req.params.orderId, 10);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const admin = await isAdminUser(userId);

        const ownershipSql = `
            SELECT u.id AS user_id
            FROM orderinfo oi
            INNER JOIN customer c ON oi.customer_id = c.customer_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE oi.orderinfo_id = ?
            LIMIT 1
        `;

        const deleteLines = 'DELETE FROM orderline WHERE orderinfo_id = ?';
        const deleteOrder = 'DELETE FROM orderinfo WHERE orderinfo_id = ?';

        connection.beginTransaction(err => {
            if (err) {
                return res.status(500).json({ error: 'Transaction start failed', details: err });
            }

            connection.execute(ownershipSql, [orderId], (err, results) => {
                if (err) {
                    return connection.rollback(() => {
                        return res.status(500).json({ error: 'Unable to verify order ownership', details: err });
                    });
                }
                if (!results || !results.length) {
                    return connection.rollback(() => {
                        return res.status(404).json({ error: 'Order not found' });
                    });
                }

                const ownerId = results[0].user_id;
                if (!admin && ownerId !== userId) {
                    return connection.rollback(() => {
                        return res.status(403).json({ error: 'Not allowed to delete this order' });
                    });
                }

                connection.execute(deleteLines, [orderId], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            return res.status(500).json({ error: 'Error deleting order lines', details: err });
                        });
                    }

                    connection.execute(deleteOrder, [orderId], (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                return res.status(500).json({ error: 'Error deleting order', details: err });
                            });
                        }

                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    return res.status(500).json({ error: 'Commit failed', details: err });
                                });
                            }
                            return res.status(200).json({ success: true, message: 'Order deleted' });
                        });
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting order', details: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const orderId = parseInt(req.params.orderId, 10);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const ownershipSql = `
            SELECT u.id AS user_id
            FROM orderinfo oi
            INNER JOIN customer c ON oi.customer_id = c.customer_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE oi.orderinfo_id = ?
            LIMIT 1
        `;

        connection.execute(ownershipSql, [orderId], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to verify order ownership', details: err });
            }
            if (!results || !results.length) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const ownerId = results[0].user_id;
            const admin = await isAdminUser(userId);
            if (!admin && ownerId !== userId) {
                return res.status(403).json({ error: 'Not allowed to cancel this order' });
            }

            const updateSql = 'UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?';
            connection.execute(updateSql, ['cancelled', orderId], async (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Unable to cancel order', details: err });
                }
                if (!result || result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                try {
                    await sendStatusUpdateReceipt(orderId, 'cancelled');
                } catch (emailErr) {
                    console.log('Receipt email error:', emailErr);
                }

                return res.status(200).json({ success: true, order_id: orderId, status: 'cancelled' });
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error cancelling order', details: error.message });
    }
};

exports.getOrderItems = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const orderId = parseInt(req.params.orderId, 10);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication missing' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Verify user owns this order
        const ownershipSql = `
            SELECT u.id AS user_id
            FROM orderinfo oi
            INNER JOIN customer c ON oi.customer_id = c.customer_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE oi.orderinfo_id = ?
            LIMIT 1
        `;

        connection.execute(ownershipSql, [orderId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to verify order', details: err });
            }
            if (!results || !results.length) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const ownerId = results[0].user_id;
            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Not authorized to view this order' });
            }

            // Fetch order items with details
            const itemsSql = `
                SELECT ol.quantity, i.item_id, i.title AS description, i.sell_price, i.img_path
                FROM orderline ol
                INNER JOIN item i ON ol.item_id = i.item_id
                WHERE ol.orderinfo_id = ?
            `;

            connection.execute(itemsSql, [orderId], (err, items) => {
                if (err) {
                    return res.status(500).json({ error: 'Unable to fetch items', details: err });
                }
                return res.status(200).json(items);
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching order items', details: error.message });
    }
};