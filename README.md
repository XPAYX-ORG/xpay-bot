# 🌧 $XPAY - Solana Rain Bot for X (Twitter)

[![Twitter](https://img.shields.io/badge/X-@Xpay__rain-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Xpay_rain)

The first Twitter-integrated rain bot for Solana. Reward your community with $SOL, $USDC, or any SPL token directly through Twitter.

**Official X/Twitter:** https://x.com/Xpay_rain

## Features

- 🌧 **Twitter Native**: Reply to any tweet with "@xpay rain <amount> <token>"
- ⚡ **Instant Claims**: Connect wallet and claim instantly
- 🛡️ **Anti-Bot**: Smart filters (account age, followers) ensure real users
- 📊 **Real-time**: Live rain feed with WebSocket updates
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
│   │   │   ├── index.tsx      # Landing + Live feed
│   │   │   ├── dashboard.tsx  # User dashboard + Twitter link
│   │   │   ├── claim.tsx      # Claim page
│   │   │   └── leaderboard.tsx
│   │   └── components/
│   ├── package.json
│   └── vercel.json
├── supabase/
│   └── schema.sql         # Database schema
└── README.md
```

## Commands

| Command | Description |
|---------|-------------|
| `@xpay rain 1000 $XPAY` | Rain 1000 XPAY tokens to retweeters |
| `@xpay rain 0.5 $SOL` | Rain 0.5 SOL to retweeters |
| `@xpay rain 100 <CA>` | Rain 100 of any SPL token |

## Deploy

### 1. Supabase (Database)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy contents of `supabase/schema.sql`
4. Run the SQL
5. Get Project URL and Anon Key from Settings > API

### 2. Bot (Railway)

1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Set environment variables:

```env
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ESCROW_PRIVATE_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
REDIS_URL=
PORT=3000
```

4. Deploy

### 3. Web (Vercel)

1. Connect Vercel to GitHub repo
2. Set Root Directory to `web/`
3. Set environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TWITTER_CLIENT_ID=
VITE_API_URL=https://your-bot-url.up.railway.app
VITE_APP_URL=https://your-domain.vercel.app
```

4. Deploy

## Environment Variables

### Bot (.env)

| Variable | Description | Source |
|----------|-------------|--------|
| `TWITTER_BEARER_TOKEN` | Twitter API Bearer Token | Twitter Dev Portal |
| `TWITTER_API_KEY` | Twitter API Key | Twitter Dev Portal |
| `TWITTER_API_SECRET` | Twitter API Secret | Twitter Dev Portal |
| `TWITTER_ACCESS_TOKEN` | Twitter Access Token | Twitter Dev Portal |
| `TWITTER_ACCESS_SECRET` | Twitter Access Secret | Twitter Dev Portal |
| `TWITTER_CLIENT_ID` | OAuth 2.0 Client ID | Twitter Dev Portal |
| `TWITTER_CLIENT_SECRET` | OAuth 2.0 Client Secret | Twitter Dev Portal |
| `SOLANA_RPC_URL` | Solana RPC endpoint | QuickNode/Helius |
| `ESCROW_PRIVATE_KEY` | Escrow wallet private key | `solana-keygen new` |
| `SUPABASE_URL` | Supabase Project URL | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase Dashboard |
| `REDIS_URL` | Redis connection URL | Upstash/Railway |

### Web (.env)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `VITE_TWITTER_CLIENT_ID` | Twitter OAuth Client ID |
| `VITE_API_URL` | Bot API URL (Railway) |
| `VITE_APP_URL` | Web app URL (Vercel) |

## Token Addresses

- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **XPAY**: *(Add after pump.fun mint)*

## Design

- **Background**: Black (#0a0a0a)
- **Primary**: Neon Green (#00ffa3)
- **Secondary**: Cyan (#03e1ff)
- **Surface**: Dark Gray (#111111)
- **Mobile**: Fully Responsive

## API Endpoints

### Bot

- `POST /claim` - Execute token claim
- `GET /health` - Health check
- `GET /stats` - Platform statistics

## License

MIT