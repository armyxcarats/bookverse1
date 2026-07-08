require('dotenv').config();
const connection = require('../config/_database');

async function seedOrders() {
  const createOrderInfo = `
    CREATE TABLE IF NOT EXISTS orderinfo (
      orderinfo_id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      date_placed DATETIME NOT NULL,
      date_shipped DATETIME DEFAULT NULL,
      shipping DECIMAL(10,2) DEFAULT 0,
      shipping_address VARCHAR(255) DEFAULT NULL,
      shipping_zipcode VARCHAR(20) DEFAULT NULL,
      shipping_phone VARCHAR(30) DEFAULT NULL,
      payment_method VARCHAR(32) DEFAULT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createOrderLine = `
    CREATE TABLE IF NOT EXISTS orderline (
      orderline_id INT AUTO_INCREMENT PRIMARY KEY,
      orderinfo_id INT NOT NULL,
      item_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      FOREIGN KEY (orderinfo_id) REFERENCES orderinfo(orderinfo_id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    connection.query(createOrderInfo + createOrderLine, (err) => {
      if (err) {
        console.error('Failed to ensure order tables exist:', err);
        process.exit(1);
      }
      console.log('Order tables created or already exist.');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to seed orders:', error);
    process.exit(1);
  }
}

seedOrders();
