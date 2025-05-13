require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Middleware Configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5500',
    'https://alora2-0-iby4.vercel.app/' // Your Vercel frontend URL
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Create Order Endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency, notes } = req.body;

    // Validate request
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Amount and currency are required'
      });
    }

    if (amount < 100) { // Minimum amount check (₹1)
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least ₹1'
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || 'INR',
      receipt: `order_${crypto.randomBytes(8).toString('hex')}`,
      payment_capture: 1, // Auto-capture payments
      notes
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('[Order Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// Payment Verification
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification parameters'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Payment successful - save to database here
      res.json({
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('[Verification Error]', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
});

// Webhook Handler (for production)
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ status: 'invalid signature' });
  }

  try {
    const event = JSON.parse(req.body);
    console.log('Webhook Event:', event.event);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        break;
      case 'payment.failed':
        // Handle failed payment
        break;
      default:
        console.log('Unhandled event type:', event.event);
    }

    res.json({ status: 'received' });
  } catch (error) {
    console.error('[Webhook Error]', error);
    res.status(500).json({ status: 'error' });
  }
});

// Serve frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// Server Startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});