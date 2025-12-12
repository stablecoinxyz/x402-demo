import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.PREMIUM_API_PORT || '3000'),
  facilitatorUrl: 'http://localhost:3001',
  paymentTimeout: parseInt(process.env.PAYMENT_TIMEOUT || '60'),

  // Base Configuration
  baseMerchantAddress: process.env.BASE_MERCHANT_ADDRESS || '', // Merchant receives payment
  baseFacilitatorAddress: process.env.BASE_FACILITATOR_ADDRESS || '', // Facilitator executes tx
  basePaymentAmount: process.env.BASE_PAYMENT_AMOUNT || '10000', // $0.01 SBC (6 decimals for sepolia, 18 for mainnet)
  baseChainId: parseInt(process.env.BASE_CHAIN_ID || '84532'), // 8453 = mainnet, 84532 = sepolia
  baseSbcTokenAddress: process.env.BASE_SBC_TOKEN_ADDRESS || '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16', // sepolia default

  // Solana Configuration
  solanaMerchantAddress: process.env.SOLANA_MERCHANT_ADDRESS || '', // Merchant receives payment
  solanaFacilitatorAddress: process.env.SOLANA_FACILITATOR_ADDRESS || process.env.FACILITATOR_SOLANA_ADDRESS || '', // Facilitator executes/sponsors
  solanaPaymentAmount: process.env.SOLANA_PAYMENT_AMOUNT || '50000000', // 0.05 SBC (9 decimals)
  sbcTokenAddress: process.env.SBC_TOKEN_ADDRESS || 'DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA',
};

// Validate at least one payment method is configured
const hasBase = config.baseMerchantAddress;
const hasSolana = config.solanaMerchantAddress;

if (!hasBase && !hasSolana) {
  throw new Error('At least one merchant address must be configured (Base or Solana)');
}

console.log('✅ Premium API configuration loaded');
if (hasBase) {
  console.log(`   Base Chain ID: ${config.baseChainId}`);
  console.log(`   Base Payment Amount: ${config.basePaymentAmount} (0.01 SBC)`);
}
if (hasSolana) {
  console.log(`   Solana Payment Amount: ${config.solanaPaymentAmount} (0.05 SBC)`);
  console.log(`   SBC Token: ${config.sbcTokenAddress}`);
}
console.log(`   Payment Timeout: ${config.paymentTimeout}s`);
