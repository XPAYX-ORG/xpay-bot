import express from 'express';
import cors from 'cors';
import { TwitterBot } from './twitter';
import { DatabaseService } from './db';
import { SolanaService } from './solana';
import { config } from './config';
import { logger } from './logger';

const app = express();
app.use(cors());
app.use(express.json());

const db = new DatabaseService();
const solana = new SolanaService();

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', escrow: solana.getEscrowAddress() });
});

// Platform statistics
app.get('/stats', async (_req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

    const [{ count: totalRains }, { count: activeUsers }, { data: claimed }] = await Promise.all([
      client.from('rain_events').select('*', { count: 'exact', head: true }),
      client.from('users').select('*', { count: 'exact', head: true }),
      client.from('claims').select('amount').eq('status', 'claimed'),
    ]);

    const totalClaimed = claimed?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;

    res.json({
      totalRains: totalRains || 0,
      activeUsers: activeUsers || 0,
      totalClaimed: Math.floor(totalClaimed),
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Execute claim (called from web frontend)
app.post('/claim', async (req, res) => {
  const { claimId, receiverAddress } = req.body;

  if (!claimId || !receiverAddress) {
    return res.status(400).json({ error: 'claimId and receiverAddress are required' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

    // Fetch claim
    const { data: claim, error } = await client
      .from('claims')
      .select('*, rain_event:rain_events(*)')
      .eq('id', claimId)
      .single();

    if (error || !claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ error: `Claim is already ${claim.status}` });
    }

    // Check expiry
    if (new Date(claim.rain_event.expires_at) < new Date()) {
      await client.from('claims').update({ status: 'expired' }).eq('id', claimId);
      return res.status(400).json({ error: 'Claim has expired' });
    }

    // Execute Solana transfer
    let txHash: string;
    const token = claim.token;
    const amount = claim.amount;

    if (token === 'SOL') {
      txHash = await solana.distributeSOLFromEscrow(receiverAddress, amount);
    } else {
      txHash = await solana.distributeSPLFromEscrow(receiverAddress, token, amount);
    }

    // Update claim in DB
    await client
      .from('claims')
      .update({
        status: 'claimed',
        receiver_solana: receiverAddress,
        claimed_at: new Date().toISOString(),
        tx_hash: txHash,
      })
      .eq('id', claimId);

    // Log transaction
    await client.from('transactions').insert({
      type: 'claim',
      claim_id: claimId,
      rain_event_id: claim.rain_event_id,
      to_address: receiverAddress,
      amount,
      token,
      tx_hash: txHash,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    });

    logger.info(`✅ Claim executed: ${claimId} → ${receiverAddress} tx: ${txHash}`);
    res.json({ success: true, txHash });
  } catch (error: any) {
    logger.error('Claim error:', error);
    res.status(500).json({ error: error.message || 'Claim failed' });
  }
});

async function main() {
  try {
    // Start HTTP server first
    app.listen(config.PORT, () => {
      logger.info(`🌐 API server running on port ${config.PORT}`);
    });

    // Start Twitter bot
    const bot = new TwitterBot();
    await bot.start();

    logger.info('✅ XPAY Bot is running!');
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  process.exit(0);
});

main();
