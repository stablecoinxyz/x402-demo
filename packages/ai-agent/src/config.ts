import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  premiumApiUrl: 'http://localhost:3000',

  // Base Configuration
  baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  baseAgentPrivateKey: process.env.BASE_AGENT_PRIVATE_KEY || '',
  baseAgentAddress: process.env.BASE_AGENT_ADDRESS || '',
  baseChainId: parseInt(process.env.BASE_CHAIN_ID || '8453'), // 8453 = mainnet, 84532 = sepolia
  baseFacilitatorAddress: process.env.BASE_FACILITATOR_ADDRESS || '', // For approval
  baseSbcTokenAddress: process.env.BASE_SBC_TOKEN_ADDRESS || '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798', // mainnet

  // Solana Configuration
  solanaAgentPrivateKey: process.env.SOLANA_AGENT_PRIVATE_KEY || process.env.AI_AGENT_SOLANA_PRIVATE_KEY || '',
  solanaAgentAddress: process.env.SOLANA_AGENT_ADDRESS || process.env.AI_AGENT_SOLANA_ADDRESS || '',

  // Payment preference (network selection, all use "exact" scheme)
  preferredNetwork: process.env.PREFERRED_NETWORK || 'solana-mainnet-beta', // 'base', 'base-sepolia', or 'solana-mainnet-beta'
};

// Validate at least one payment method is configured
const hasBase = config.baseRpcUrl && config.baseAgentPrivateKey;
const hasSolana = config.solanaAgentPrivateKey;

if (!hasBase && !hasSolana) {
  throw new Error('At least one payment method must be configured (Base or Solana)');
}

console.log('✅ AI Agent configuration loaded');
console.log(`   Preferred Network: ${config.preferredNetwork}`);
if (hasBase) {
  console.log(`   Base Chain ID: ${config.baseChainId}`);
  console.log(`   Base Agent Address: ${config.baseAgentAddress || 'Will derive from private key'}`);
}
if (hasSolana) {
  console.log(`   Solana Agent Address: ${config.solanaAgentAddress || 'Will derive from private key'}`);
}
