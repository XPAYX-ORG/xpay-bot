import { TwitterApi } from 'twitter-api-v2';
import { config } from './config';
import { CommandParser } from './parser';
import { RainDistributor } from './rain';
import { logger } from './logger';

export class TwitterBot {
  private client: TwitterApi;
  private parser: CommandParser;
  private rainDistributor: RainDistributor;

  constructor() {
    this.client = new TwitterApi({
      appKey: config.TWITTER_API_KEY,
      appSecret: config.TWITTER_API_SECRET,
      accessToken: config.TWITTER_ACCESS_TOKEN,
      accessSecret: config.TWITTER_ACCESS_SECRET,
    });
    this.parser = new CommandParser();
    this.rainDistributor = new RainDistributor();
  }

  async start() {
    logger.info('🚀 Starting XPAY Twitter Bot...');

    // Start streaming mentions
    await this.streamMentions();
    
    // Start cron job for expiring claims
    this.startExpiryCron();
  }

  private async streamMentions() {
    const stream = await this.client.v2.searchStream({
      'tweet.fields': ['author_id', 'created_at', 'referenced_tweets'],
      expansions: ['author_id'],
    });

    logger.info('📡 Listening for @xpay mentions...');

    stream.on('data', async (tweet) => {
      try {
        await this.handleTweet(tweet);
      } catch (error) {
        logger.error('Error handling tweet:', error);
      }
    });

    stream.on('error', (error) => {
      logger.error('Stream error:', error);
    });
  }

  private async handleTweet(tweet: any) {
    const text = tweet.data.text.toLowerCase();
    
    // Check if it's a mention to @xpay
    if (!text.includes('@xpay')) return;

    logger.info(`📨 New mention from @${tweet.data.author_id}: ${text}`);

    // Parse command
    const command = this.parser.parse(text);
    if (!command) {
      await this.reply(tweet.data.id, '❌ Invalid command. Try: @xpay rain <amount> <token>');
      return;
    }

    // Handle rain command
    if (command.command === 'rain') {
      await this.handleRainCommand(tweet, command);
    }
  }

  private async handleRainCommand(tweet: any, command: any) {
    try {
      // Get parent tweet (the one being replied to)
      const parentTweetId = tweet.data.referenced_tweets?.find(
        (t: any) => t.type === 'replied_to'
      )?.id;

      if (!parentTweetId) {
        await this.reply(tweet.data.id, '❌ Rain must be a reply to a tweet');
        return;
      }

      // Execute rain
      const result = await this.rainDistributor.createRain({
        senderTwitterId: tweet.data.author_id,
        tweetId: parentTweetId,
        amount: command.amount,
        token: command.token,
        tokenCA: command.ca,
      });

      // Reply with summary
      const replyText = `🌧 Rain incoming! ${result.recipientCount} users will receive ${result.perUserAmount} $${command.token} each\n\nClaim → xpayx.org/claim/${result.rainEventId}`;
      
      await this.reply(tweet.data.id, replyText);

      // DM each receiver
      for (const recipient of result.recipients) {
        await this.dmRecipient(recipient, result);
      }

    } catch (error) {
      logger.error('Rain error:', error);
      await this.reply(tweet.data.id, '❌ Rain failed. Please try again.');
    }
  }

  private async reply(tweetId: string, text: string) {
    try {
      await this.client.v2.reply(text, tweetId);
      logger.info(`✅ Replied to ${tweetId}`);
    } catch (error) {
      logger.error('Reply error:', error);
    }
  }

  private async dmRecipient(recipient: any, rainResult: any) {
    try {
      const message = `🌧 You received ${rainResult.perUserAmount} $${rainResult.token}!\n\nClaim here: xpayx.org/claim/${rainResult.rainEventId}\n\nExpires in 24h ⏰`;
      
      await this.client.v1.sendDm({
        recipient_id: recipient.twitterId,
        text: message,
      });
    } catch (error) {
      // If DM fails, reply in thread
      logger.error('DM error:', error);
    }
  }

  private startExpiryCron() {
    const cron = require('node-cron');
    
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.info('⏰ Checking for expired claims...');
      await this.rainDistributor.processExpiredClaims();
    });
  }
}