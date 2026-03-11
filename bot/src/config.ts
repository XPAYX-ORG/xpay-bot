import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Twitter API
  TWITTER_API_KEY: process.env.TWITTER_API_KEY || '',
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET || '',
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN || '',
  TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET || '',

  // Solana
  SOLANA_RPC: process.env.SOLANA_RPC || 'https://api.devnet.solana.com',
  ESCROW_PRIVATE_KEY: process.env.ESCROW_PRIVATE_KEY || '',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',

  // Redis (for Bull queue)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // App
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validation
if (!config.TWITTER_API_KEY) {
  console.warn('⚠️ TWITTER_API_KEY not set');
}
if (!config.SUPABASE_URL) {
  console.warn('⚠️ SUPABASE_URL not set');
}