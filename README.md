# x402 Facilitator Demo

SBC's Multi-chain x402 Facilitator supporting Base and Solana:

- ✅ Full x402 protocol flow (HTTP 402 Payment Required)
- ✅ **Multi-chain support:** Base (Mainnet/Sepolia) + Solana (Mainnet)
- ✅ Custom facilitator infrastructure (not using Coinbase CDP)
- ✅ **Real mainnet payments:** SBC token on Base and Solana
- ✅ AI agent making autonomous payments
- ✅ Sub-2-second payment settlement

## Quick Start 🚀 Get started in 5 minutes!

Choose your payment chain:
- **Base (Mainnet or Sepolia)** - Production-ready with SBC token (18 decimals on mainnet, 6 on sepolia)
- **Solana (Mainnet)** - Production-ready with real SBC tokens

### 1. Install Dependencies

```bash
npm install
cd packages/facilitator && npm install && cd ../..
cd packages/premium-api && npm install && cd ../..
cd packages/ai-agent && npm install && cd ../..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**For Base (Mainnet or Sepolia):**
- `BASE_RPC_URL` - Base RPC endpoint (mainnet: `https://mainnet.base.org`, sepolia: `https://sepolia.base.org`)
- `BASE_CHAIN_ID` - Chain ID (`8453` for mainnet, `84532` for sepolia)
- `BASE_FACILITATOR_PRIVATE_KEY` - Facilitator wallet (Base) private key
- `BASE_FACILITATOR_ADDRESS` - Facilitator wallet (Base) address
- `BASE_AGENT_PRIVATE_KEY` - AI agent's Base private key
- `BASE_AGENT_ADDRESS` - AI agent's Base address
- `BASE_SBC_TOKEN_ADDRESS` - SBC token address
  - Mainnet: `0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798` (18 decimals)
  - Sepolia: `0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16` (6 decimals)
- `BASE_SBC_DECIMALS` - Token decimals (`18` for mainnet, `6` for sepolia)
- `BASE_PAYMENT_AMOUNT` - Payment amount of $0.01 (default: `10000000000000000` = 0.01 SBC for mainnet. use `10000` for sepolia)

**For Solana (Mainnet):**
- `SOLANA_RPC_URL` - Solana RPC endpoint (e.g., Helius)
- `FACILITATOR_SOLANA_PRIVATE_KEY` - Facilitator's Solana private key (Base58)
- `FACILITATOR_SOLANA_ADDRESS` - Facilitator's Solana address
- `AI_AGENT_SOLANA_PRIVATE_KEY` - AI agent's Solana private key (Base58)
- `AI_AGENT_SOLANA_ADDRESS` - AI agent's Solana address
- `SBC_TOKEN_ADDRESS` - SBC token mint (default: `DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA`)

**Choose which network your AI agent pays in**
- `PREFERRED_NETWORK` - `'base'`, `'base-sepolia'`, or `'solana-mainnet-beta'`

**💡 See [BASE_TEST_GUIDE.md](./BASE_TEST_GUIDE.md) for detailed Base setup instructions.**
**💡 See [SOLANA_TEST_GUIDE.md](./SOLANA_TEST_GUIDE.md) for detailed Solana setup instructions.**

### 3. One-Time Approval Setup

**⚠️ IMPORTANT:** Before making payments on Base or Solana, you must approve the facilitator as a delegate:

**For Base Mainnet:**
```bash
cd packages/ai-agent
npm run approve-base-facilitator
```

**For Base Sepolia (testnet):**
```bash
cd packages/ai-agent
npm run approve-base-sepolia-facilitator
```

**For Solana:**
```bash
cd packages/ai-agent
npm run approve-solana-facilitator
```

This allows the facilitator to execute token transfers on behalf of your agent wallet. The facilitator **never holds your funds** - it only executes atomic transfers from Agent → Merchant.

### 4. Start Services

**Terminal 1 - Facilitator:**

```bash
cd packages/facilitator
npm run dev
```

**Terminal 2 - Premium API:**

```bash
cd packages/premium-api
npm run dev
```

**Terminal 3 - Run AI Agent:**

```bash
cd packages/ai-agent
npm run start
```

### 5. Expected Output

```
🤖 AI Agent starting...
✅ AI Agent configuration loaded
   Preferred Scheme: solana
   Solana Agent Address: <YOUR_ADDRESS>

📡 Requesting premium data...
💰 Payment required!

Payment requirements: {
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "10000000000000000",
      "payTo": "0x...",
      "asset": "0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798",
      "maxTimeoutSeconds": 60
    },
    {
      "scheme": "exact",
      "network": "solana-mainnet-beta",
      "maxAmountRequired": "50000000",
      "payTo": "<SOLANA_ADDRESS>",
      "asset": "DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA",
      "maxTimeoutSeconds": 60
    }
  ]
}

✍️  Creating payment authorization...
   Available payment networks: base, solana-mainnet-beta
   Using Solana payment (preferred) 🟣
✅ Payment authorized!

📡 Retrying request with payment...

🎉 Success! Received premium data:
{
  "data": "This is premium data from the API!",
  "paymentTxHash": "<TX_SIGNATURE>",
  "networkId": "solana-mainnet-beta",
  "message": "Payment successful"
}

🔗 Transaction: https://orb.helius.dev/tx/<TX_SIGNATURE>?cluster=mainnet-beta&tab=summary
```

## Payment Flow

### Step 1: Agent Requests Data (No Payment)

```bash
GET /premium-data
→ 402 Payment Required
```

### Step 2: Agent Creates Payment Authorization

**For Base (ERC-20):**
```typescript
// EIP-712 signature
const signature = await wallet.signTypedData({
  domain: { name: 'SBC x402 Facilitator', version: '1', chainId: 8453 },
  types: { Payment: [...] },
  message: { from, to, amount, nonce, deadline }
});
```

**For Solana (SPL):**
```typescript
// Ed25519 signature
const message = `from:${from}|to:${to}|amount:${amount}|nonce:${nonce}|deadline:${deadline}`;
const signature = nacl.sign.detached(Buffer.from(message), keypair.secretKey);
```

### Step 3: Agent Retries with X-PAYMENT Header

```bash
GET /premium-data
X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoi...
```

### Step 4: Premium API Calls Facilitator /verify

```bash
POST http://localhost:3001/verify
→ { "isValid": true }
```

### Step 5: Premium API Calls Facilitator /settle

```bash
POST http://localhost:3001/settle
→ { "success": true, "payer": "0x...", "transaction": "0x...", "network": "base" }
```

### Step 6: Agent Receives Premium Data

```json
{
  "data": "This is premium data from the API!",
  "paymentTxHash": "0x...",
  "message": "Payment successful"
}
```

## Network Configuration

### Base Mainnet

- Chain ID: `8453`
- RPC: `https://mainnet.base.org` (or use Alchemy, QuickNode, etc.)
- Explorer: `https://basescan.org`
- Native Currency: ETH (18 decimals)
- Token: SBC (`0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798`)
- Decimals: 18

### Base Sepolia

- Chain ID: `84532`
- RPC: `https://sepolia.base.org`
- Explorer: `https://sepolia.basescan.org`
- Native Currency: ETH (18 decimals)
- Token: SBC (`0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16`)
- Decimals: 6

### Solana Mainnet

- Network: `mainnet-beta`
- RPC: `https://api.mainnet-beta.solana.com` (or use Helius, QuickNode, etc.)
- Explorer: `https://orb.helius.dev`
- Token: SBC (`DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA`)
- Decimals: 9

## Payment Details

All payment methods use the x402 `exact` scheme with network-based routing.

### Base Mainnet
- **Scheme:** `exact`
- **Network:** `base`
- **Amount:** 0.01 SBC (10000000000000000, 18 decimals)
- **Token:** SBC ERC-20 token (`0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798`)
- **Settlement:** Real on-chain ERC-20 transfers 💰
- **Settlement Time:** <2 seconds

### Base Sepolia
- **Scheme:** `exact`
- **Network:** `base-sepolia`
- **Amount:** 0.01 SBC (10000, 6 decimals)
- **Token:** SBC ERC-20 token (`0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16`)
- **Settlement:** Real on-chain ERC-20 transfers 💰
- **Settlement Time:** <2 seconds

### Solana Mainnet
- **Scheme:** `exact`
- **Network:** `solana-mainnet-beta`
- **Amount:** 0.05 SBC (50000000, 9 decimals)
- **Token:** SBC SPL token (`DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA`)
- **Settlement:** Real on-chain transfers 💰
- **Settlement Time:** <2 seconds

## Project Structure

```
x402-demo/
├── packages/
│   ├── facilitator/       # x402 facilitator (verify + settle)
│   ├── premium-api/       # API requiring payment
│   └── ai-agent/          # Autonomous payment client
├── shared/
│   └── types.ts           # Shared TypeScript types
├── .env.example
├── package.json
└── README.md
```

## Documentation

- **[BASE_TEST_GUIDE.md](./BASE_TEST_GUIDE.md)** - Complete Base testing guide (Mainnet & Sepolia)
- **[SOLANA_TEST_GUIDE.md](./SOLANA_TEST_GUIDE.md)** - Complete Solana testing guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture documentation
