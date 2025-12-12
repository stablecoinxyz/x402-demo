import { config } from './config';
import { createBasePaymentAuthorization } from './base-client';
import { createSolanaPaymentAuthorization } from './solana-client';

// Type definitions
interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
}

interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirement[];
  error: string;
}

interface PremiumDataResponse {
  data: string;
  tier: string;
  features?: string[];
  paymentTxHash: string;
  networkId: string;
  message: string;
}

async function main() {
  console.log('\n🤖 AI Agent Starting...');
  console.log('========================\n');

  console.log('💭 Agent Goal: Access premium data from the API\n');

  // Step 1: Try to access premium API without payment
  console.log('📡 Step 1: Requesting premium data...');

  const response1 = await fetch(`${config.premiumApiUrl}/premium-data`);

  // Step 2: Handle 402 Payment Required
  if (response1.status === 402) {
    console.log('   Status: 402 Payment Required ❌\n');

    const paymentReq = (await response1.json()) as PaymentRequiredResponse;
    console.log('💰 Step 2: Payment Required!');
    console.log('   Payment requirements received:');
    console.log('   └─ Version:', paymentReq.x402Version);
    console.log('   └─ Scheme:', paymentReq.accepts[0].scheme);
    console.log('   └─ Network:', paymentReq.accepts[0].network);
    console.log('   └─ Amount:', paymentReq.accepts[0].maxAmountRequired);
    console.log('   └─ Recipient:', paymentReq.accepts[0].payTo);
    console.log('   └─ Timeout:', paymentReq.accepts[0].maxTimeoutSeconds, 'seconds\n');

    // Step 3: Create payment authorization
    console.log('✍️  Step 3: Creating payment authorization...');

    // Determine which payment method to use
    const availableNetworks = paymentReq.accepts.map((req: PaymentRequirement) => req.network);
    console.log('   Available payment networks:', availableNetworks.join(', '));

    let xPaymentHeader: string;
    let usedScheme: string;

    // Check for available options
    const hasSolana = availableNetworks.includes('solana-mainnet-beta');
    const hasBase = availableNetworks.some(n => n === 'base' || n === 'base-sepolia' || n === '8453' || n === '84532');

    // Use preferred network if available
    if (config.preferredNetwork === 'solana-mainnet-beta' && hasSolana && config.solanaAgentPrivateKey) {
      console.log('   Using Solana payment (preferred) 🟣');
      xPaymentHeader = await createSolanaPaymentAuthorization(paymentReq);
      usedScheme = 'solana';
    } else if ((config.preferredNetwork === 'base' || config.preferredNetwork === 'base-sepolia') && hasBase && config.baseAgentPrivateKey) {
      console.log('   Using Base payment (preferred) 🔵');
      xPaymentHeader = await createBasePaymentAuthorization(paymentReq);
      usedScheme = 'base';
    } else if (hasSolana && config.solanaAgentPrivateKey) {
      console.log('   Using Solana payment (available) 🟣');
      xPaymentHeader = await createSolanaPaymentAuthorization(paymentReq);
      usedScheme = 'solana';
    } else if (hasBase && config.baseAgentPrivateKey) {
      console.log('   Using Base payment (available) 🔵');
      xPaymentHeader = await createBasePaymentAuthorization(paymentReq);
      usedScheme = 'base';
    } else {
      throw new Error('No compatible payment method available or configured');
    }

    console.log('   ✅ Payment authorization created!\n');

    // Step 4: Retry with payment
    console.log('📡 Step 4: Retrying request with payment...');

    const response2 = await fetch(`${config.premiumApiUrl}/premium-data`, {
      headers: {
        'X-PAYMENT': xPaymentHeader,
      },
    });

    // Step 5: Handle response
    if (response2.ok) {
      const data = (await response2.json()) as PremiumDataResponse;

      console.log('   Status:', response2.status, 'OK ✅\n');

      console.log('🎉 SUCCESS! Premium data received:');
      console.log('   ┌─────────────────────────────────────');
      console.log('   │ Data:', data.data);
      console.log('   │ Tier:', data.tier);
      console.log('   │ Features:', data.features?.join(', ') || 'N/A');
      console.log('   │');
      console.log('   │ Payment Details:');
      console.log('   │ └─ Tx Hash:', data.paymentTxHash);
      console.log('   │ └─ Network:', data.networkId);
      console.log('   │ └─ Message:', data.message);
      console.log('   └─────────────────────────────────────\n');

      // Display correct explorer URL based on network
      console.log('🔗 View transaction:');
      if (data.networkId === 'solana-mainnet-beta') {
        console.log(`   https://orb.helius.dev/tx/${data.paymentTxHash}?cluster=mainnet-beta&tab=summary\n`);
      } else if (data.networkId === 'base' || data.networkId === '8453') {
        console.log(`   https://basescan.org/tx/${data.paymentTxHash}\n`);
      } else if (data.networkId === 'base-sepolia' || data.networkId === '84532') {
        console.log(`   https://sepolia.basescan.org/tx/${data.paymentTxHash}\n`);
      } else {
        console.log(`   Network ${data.networkId}: ${data.paymentTxHash}\n`);
      }

      console.log('✅ AI Agent completed successfully!\n');
    } else {
      const error = await response2.text();
      console.log('   Status:', response2.status, '❌\n');
      console.log('❌ Payment failed:', error, '\n');
    }
  } else if (response1.ok) {
    const data = (await response1.json()) as any;
    console.log('   Status:', response1.status, 'OK ✅\n');
    console.log('🎉 Data received (no payment required):', data, '\n');
  } else {
    console.log('   Status:', response1.status, '❌\n');
    console.log('❌ Unexpected error:', await response1.text(), '\n');
  }
}

// Run the agent
main().catch((error) => {
  console.error('\n❌ Agent error:', error.message);
  console.error(error);
  process.exit(1);
});
