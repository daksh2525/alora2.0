require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  'https://alora-luxury-candles.vercel.app',
  'http://localhost:5500',
  'https://alora2-0-iby4.vercel.app/',
  'https://alora2-0-iby4-git-main-dakshs-projects-341d5f95.vercel.app/',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Create Order Endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Minimum is ₹1'
      });
    }

    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1,
      notes
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// Payment Verification
app.post('/api/verify', (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === signature;

    if (isValid) {
      // Payment successful - save to database here
      return res.json({
        success: true,
        paymentId: payment_id,
        orderId: order_id
      });
    }

    res.status(400).json({
      success: false,
      error: 'Invalid signature'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
});

// Fallback route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Razorpay Key: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Missing'}`);
});