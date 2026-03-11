import { TwitterApi } from 'twitter-api-v2';
import { SupabaseClient } from '@supabase/supabase-js';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { config } from './config';
import { logger } from './logger';
import { SolanaService } from './solana';
import { DatabaseService } from './db';

interface RainRequest {
  senderTwitterId: string;
  tweetId: string;
  amount: number;
  token: string;
  tokenCA?: string;
}

interface RainResult {
  rainEventId: string;
  recipientCount: number;
  perUserAmount: number;
  recipients: Array<{
    twitterId: string;
    twitterHandle: string;
  }>;
}

export class RainDistributor {
  private twitterClient: TwitterApi;
  private db: DatabaseService;
  private solana: SolanaService;

  constructor() {
    this.twitterClient = new TwitterApi({
      appKey: config.TWITTER_API_KEY,
      appSecret: config.TWITTER_API_SECRET,
      accessToken: config.TWITTER_ACCESS_TOKEN,
      accessSecret: config.TWITTER_ACCESS_SECRET,
    });
    this.db = new DatabaseService();
    this.solana = new SolanaService();
  }

  async createRain(request: RainRequest): Promise<RainResult> {
    logger.info(`🌧 Creating rain: ${request.amount} $${request.token}`);

    // 1. Fetch retweeters of parent tweet
    const retweeters = await this.fetchRetweeters(request.tweetId);
    logger.info(`📊 Found ${retweeters.length} retweeters`);

    // 2. Filter eligible users
    const eligibleUsers = await this.filterEligibleUsers(retweeters);
    logger.info(`✅ ${eligibleUsers.length} eligible users`);

    if (eligibleUsers.length === 0) {
      throw new Error('No eligible recipients found');
    }

    // 3. Calculate per-user amount
    const fee = request.amount * 0.01; // 1% fee
    const amountAfterFee = request.amount - fee;
    const perUserAmount = amountAfterFee / eligibleUsers.length;

    // 4. Create rain event in DB
    const rainEvent = await this.db.createRainEvent({
      senderTwitterId: request.senderTwitterId,
      tweetId: request.tweetId,
      token: request.token,
      tokenCA: request.tokenCA,
      totalAmount: request.amount,
      perUserAmount,
      recipientCount: eligibleUsers.length,
    });

    // 5. Create claims for each recipient
    for (const user of eligibleUsers) {
      await this.db.createClaim({
        rainEventId: rainEvent.id,
        receiverTwitterId: user.twitterId,
        amount: perUserAmount,
        token: request.token,
      });
    }

    // 6. Transfer to escrow (in production)
    // await this.solana.transferToEscrow(senderWallet, request.amount, request.token);

    logger.info(`✅ Rain created: ${rainEvent.id}`);

    return {
      rainEventId: rainEvent.id,
      recipientCount: eligibleUsers.length,
      perUserAmount,
      recipients: eligibleUsers,
    };
  }

  private async fetchRetweeters(tweetId: string): Promise<Array<{ twitterId: string; twitterHandle: string }>> {
    try {
      // Get retweeters from Twitter API
      const retweeters = await this.twitterClient.v2.tweetRetweetedBy(tweetId, {
        'user.fields': ['created_at', 'public_metrics'],
        max_results: 100,
      });

      return retweeters.data.map((user: any) => ({
        twitterId: user.id,
        twitterHandle: user.username,
      }));
    } catch (error) {
      logger.error('Error fetching retweeters:', error);
      return [];
    }
  }

  private async filterEligibleUsers(users: Array<{ twitterId: string; twitterHandle: string }>): Promise<Array<{ twitterId: string; twitterHandle: string }>> {
    const eligible = [];

    for (const user of users) {
      try {
        // Get user details from Twitter API
        const userDetails = await this.twitterClient.v2.user(user.twitterId, {
          'user.fields': ['created_at', 'public_metrics'],
        });

        const createdAt = new Date(userDetails.data.created_at);
        const followers = userDetails.data.public_metrics?.followers_count || 0;
        const accountAgeDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        // Filter criteria
        if (accountAgeDays >= 30 && followers >= 10) {
          // Check if user has Solana address registered
          const dbUser = await this.db.getUser(user.twitterId);
          if (dbUser) {
            eligible.push(user);
          }
        }
      } catch (error) {
        logger.error(`Error checking user ${user.twitterHandle}:`, error);
      }
    }

    return eligible;
  }

  async processExpiredClaims() {
    const expiredClaims = await this.db.getExpiredClaims();
    
    for (const claim of expiredClaims) {
      try {
        // Mark as expired
        await this.db.updateClaimStatus(claim.id, 'expired');
        
        // Refund sender (in production)
        // await this.solana.refund(claim.rainEvent.senderAddress, claim.amount);
        
        logger.info(`⏰ Expired claim processed: ${claim.id}`);
      } catch (error) {
        logger.error(`Error processing expired claim ${claim.id}:`, error);
      }
    }
  }
}