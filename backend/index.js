require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Development mein sab allow karo
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY', // Test key directly
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_KEY' // Test secret directly
});

// Routes
app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, notes } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({ 
        success: false,
        error: 'Amount and currency are required'
      });
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: `order_rcpt_${Date.now()}`,
      notes,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order,
      message: 'Order created successfully'
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
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ 
      success: false,
      error: 'Payment verification failed - missing parameters'
    });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_KEY';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    // Payment successful
    res.json({ 
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Payment verification failed - invalid signature'
    });
  }
});

// Webhook ko temporarily comment out karo
/*
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Webhook implementation
});
*/

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Razorpay Test Mode: ${!process.env.RAZORPAY_KEY_ID ? 'Using Test Keys' : 'Using Production Keys'}`);
});