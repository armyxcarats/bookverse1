const PDFDocument = require('pdfkit');

const formatCurrency = (amount) => {
  return `₱${Number(amount).toFixed(2)}`;
};

const formatPaymentMethod = (method) => {
  if (!method) return '';
  const normalized = String(method).trim().toLowerCase();
  if (normalized === 'gcash') return 'GCash';
  if (normalized === 'paymaya') return 'PayMaya';
  if (normalized === 'cash on delivery' || normalized === 'cashondelivery' || normalized === 'cod') return 'Cash on Delivery';
  return method;
};

const generateReceiptPdf = (order, items) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Bookverse Receipt', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12).text(`Order #: ${order.order_id}`);
    doc.text(`Status: ${order.status}`);
    if (order.payment_method) doc.text(`Payment Method: ${formatPaymentMethod(order.payment_method)}`);
    doc.text(`Date Placed: ${new Date(order.date_placed).toLocaleString()}`);
    if (order.date_shipped) doc.text(`Date Shipped: ${new Date(order.date_shipped).toLocaleString()}`);
    doc.moveDown(0.5);

    doc.text(`Customer: ${order.fname || ''} ${order.lname || ''}`);
    doc.text(`Email: ${order.customer_email}`);
    if (order.shipping_address) doc.text(`Shipping Address: ${order.shipping_address}`);
    if (order.shipping_zipcode) doc.text(`Zip Code: ${order.shipping_zipcode}`);
    if (order.shipping_phone) doc.text(`Phone: ${order.shipping_phone}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Items', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemColumnWidth = 240;
    const qtyColumnWidth = 60;
    const priceColumnWidth = 100;
    const totalColumnWidth = 100;

    doc.fontSize(10);
    doc.text('Item', 40, tableTop);
    doc.text('Qty', 40 + itemColumnWidth, tableTop);
    doc.text('Price', 40 + itemColumnWidth + qtyColumnWidth, tableTop);
    doc.text('Line Total', 40 + itemColumnWidth + qtyColumnWidth + priceColumnWidth, tableTop);
    doc.moveDown(0.5);

    items.forEach((item) => {
      const lineTop = doc.y;
      const lineTotal = Number(item.sell_price) * Number(item.quantity);
      doc.text(item.description || 'Unknown', 40, lineTop, { width: itemColumnWidth });
      doc.text(item.quantity.toString(), 40 + itemColumnWidth, lineTop);
      doc.text(formatCurrency(item.sell_price), 40 + itemColumnWidth + qtyColumnWidth, lineTop);
      doc.text(formatCurrency(lineTotal), 40 + itemColumnWidth + qtyColumnWidth + priceColumnWidth, lineTop);
      doc.moveDown(0.7);
    });

    doc.moveDown(0.8);
    const subtotal = items.reduce((sum, item) => sum + Number(item.sell_price) * Number(item.quantity), 0);
    const shipping = Number(order.shipping || 0);
    const total = subtotal + shipping;

    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, { align: 'right' });
    doc.text(`Shipping: ${formatCurrency(shipping)}`, { align: 'right' });
    doc.text(`Total: ${formatCurrency(total)}`, { align: 'right' });

    doc.end();
  });
};

module.exports = generateReceiptPdf;
