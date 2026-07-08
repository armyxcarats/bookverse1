const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');
const { isAuthenticatedUser, isAdminUser } = require('./middlewares/auth');


const items = require('./routes/item');
const users = require('./routes/user');
const orders = require('./routes/order');
const dashboard = require('./routes/dashboard')
const reviews = require('./routes/review')

// app.get('/', (req, res) => {
//     res.send('Hello from nodejs!')
// })
app.use(cors())
app.use(express.json())
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use('/api/v1', items);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', dashboard);
app.use('/api/v1', reviews);

// Serve admin pages directly. Client-side JS enforces auth using the token stored in localStorage.
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
  res.redirect('/admin')
})

app.get(['/orders', '/orders.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'))
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'))
})

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'))
})

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'))
})

app.get('/my-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-orders.html'))
})

app.use(express.static(path.join(__dirname, 'public')))

module.exports = app
