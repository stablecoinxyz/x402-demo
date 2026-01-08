import express from 'express';
import cors from 'cors';
import { config } from './config';
import {
  createPaymentRequirement,
  verifyWithFacilitator,
  settleWithFacilitator,
} from './middleware/x402';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'premium-api' });
});

// Free endpoint (no payment required)
app.get('/free-data', (req, res) => {
  res.json({
    data: 'This is free data available to everyone!',
    tier: 'free',
  });
});

// Premium endpoint (x402 payment required)
app.get('/premium-data', async (req, res) => {
  // V2: Read PAYMENT-SIGNATURE header, fallback to x-payment for V1 compatibility
  const paymentSignature = req.headers['payment-signature'] as string | undefined;
  const xPayment = req.headers['x-payment'] as string | undefined;
  const payment = paymentSignature || xPayment;
  const isV2Client = !!paymentSignature;

  console.log('\n📡 Premium data request received');
  console.log(`   Protocol: x402 ${payment ? (isV2Client ? 'V2' : 'V1') : '(awaiting payment)'}`);

  // Build the full resource URL
  const resource = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // If no payment header, return 402 Payment Required
  if (!payment) {
    const paymentReq = createPaymentRequirement(resource);
    console.log('   ❌ No payment provided');
    console.log('   → Returning 402 Payment Required\n');

    // V2: Set PAYMENT-REQUIRED header with base64-encoded requirements
    const paymentRequiredHeader = Buffer.from(JSON.stringify(paymentReq)).toString('base64');
    res.setHeader('PAYMENT-REQUIRED', paymentRequiredHeader);

    // Also return in body for V1 compatibility
    return res.status(402).json(paymentReq);
  }

  console.log('   ✅ Payment header present');
  console.log('   → Verifying with facilitator...');

  try {
    const paymentRequirements = createPaymentRequirement(resource);

    // Verify payment with facilitator
    const verifyResult = await verifyWithFacilitator(payment, paymentRequirements);

    if (!verifyResult.isValid) {
      console.log('   ❌ Payment invalid:', verifyResult.invalidReason);
      return res.status(402).json({
        error: 'Invalid payment',
        reason: verifyResult.invalidReason,
      });
    }

    console.log('   ✅ Payment verified');
    console.log('   → Settling payment...');

    // Settle payment
    const settleResult = await settleWithFacilitator(payment, paymentRequirements);

    if (!settleResult.success) {
      console.log('   ❌ Settlement failed:', settleResult.errorReason);
      return res.status(500).json({
        error: 'Settlement failed',
        reason: settleResult.errorReason,
      });
    }

    console.log('   ✅ Payment settled');
    console.log('   📝 Tx Hash:', settleResult.transaction);
    console.log('   → Returning premium data\n');

    // V2: Set PAYMENT-RESPONSE header with settlement details
    const paymentResponse = {
      success: true,
      transaction: settleResult.transaction,
      network: settleResult.network,
      payer: settleResult.payer,
    };
    res.setHeader('PAYMENT-RESPONSE', Buffer.from(JSON.stringify(paymentResponse)).toString('base64'));

    // Payment successful, return premium data
    res.json({
      data: 'This is PREMIUM data only available after payment! 💎',
      tier: 'premium',
      features: [
        'Advanced analytics',
        'Real-time data updates',
        'Priority support',
        'API rate limit: 1000 req/min',
      ],
      paymentTxHash: settleResult.transaction,
      networkId: settleResult.network,
      message: 'Payment successful - thank you!',
    });
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Start server - bind to 0.0.0.0 to accept both IPv4 and IPv6 connections
app.listen(config.port, '0.0.0.0', () => {
  console.log('\n🌟 Premium API with x402 Payments');
  console.log('==================================');
  console.log(`✅ Server running on port ${config.port} (0.0.0.0)`);
  console.log(`✅ Facilitator: ${config.facilitatorUrl}`);
  console.log('\n📡 Endpoints:');
  console.log(`   GET http://localhost:${config.port}/free-data (no payment)`);
  console.log(`   GET http://localhost:${config.port}/premium-data (requires payment)`);
  console.log('\n⏳ Waiting for requests...\n');
});
