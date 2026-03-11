# $XPAY - Solana Rain Bot for X (Twitter)

The first Twitter-integrated rain bot for Solana. Reward your community with $SOL, $USDC, or any SPL token directly through Twitter.

## Features

- 🌧 **Twitter Native**: Reply to any tweet with "@xpay rain <amount> <token>"
- ⚡ **Instant Claims**: Connect wallet and claim instantly
- 🛡️ **Anti-Bot**: Smart filters (account age, followers) ensure real users
- 🎯 **Auto-Migration**: When threshold reached, liquidity migrates to Raydium
- 💰 **1% Fee**: Creator fee on every rain

## Project Structure

```
xpay-bot/
├── bot/                    # Node.js + TypeScript (Railway)
│   ├── src/
│   │   ├── index.ts       # Entry point
│   │   ├── twitter.ts     # Twitter API stream + commands
│   │   ├── parser.ts      # Command parser
│   │   ├── rain.ts        # Rain distribution logic
│   │   ├── solana.ts      # Solana transactions
│   │   ├── db.ts          # Supabase client
│   │   └── queue.ts       # Rate limit queue
│   ├── package.json
│   └── railway.toml
├── web/                    # React + Vite (Vercel)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx      # Landing
│   │   │   ├── dashboard.tsx  # User dashboard
│   │   │   ├── claim.tsx      # Claim page
│   │   │   └── leaderboard.tsx
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── vercel.json
└── README.md
```

## Commands

| Command | Description |
|---------|-------------|
| `@xpay rain 1000 $XPAY` | Rain 1000 XPAY tokens to retweeters |
| `@xpay rain 0.5 $SOL` | Rain 0.5 SOL to retweeters |
| `@xpay rain 100 <CA>` | Rain 100 of any SPL token |

## Setup

### Prerequisites

- Node.js 18+
- Twitter API credentials
- Supabase account
- Solana wallet

### Environment Variables

Create `.env` files in both `bot/` and `web/` directories:

**bot/.env:**
```
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SOLANA_RPC=https://api.devnet.solana.com
```

**web/.env:**
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_KEY=your_key
```

### Database Schema

See `bot/src/db.ts` for Supabase schema.

### Deployment

**Bot (Railway):**
```bash
cd bot
npm install
npm run build
# Deploy to Railway
```

**Web (Vercel):**
```bash
cd web
npm install
npm run build
# Deploy to Vercel
```

## Token Addresses

- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- XPAY: *(Add after pump.fun mint)*

## License

MIT