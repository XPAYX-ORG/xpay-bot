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

    // Set up filtered stream rules then start streaming
    await this.setupStreamRules();
    await this.streamMentions();

    // Start cron job for expiring claims
    this.startExpiryCron();
  }

  private async setupStreamRules() {
    try {
      // Delete all existing rules first
      const existingRules = await this.client.v2.streamRules();
      if (existingRules.data && existingRules.data.length > 0) {
        const ids = existingRules.data.map((r: any) => r.id);
        await this.client.v2.updateStreamRules({ delete: { ids } });
        logger.info(`🗑️ Deleted ${ids.length} old stream rules`);
      }

      // Add rule to track @xpay mentions
      await this.client.v2.updateStreamRules({
        add: [{ value: '@xpay rain', tag: 'xpay-rain-command' }],
      });

      logger.info('✅ Stream rules configured: tracking "@xpay rain" mentions');
    } catch (error) {
      logger.error('Failed to setup stream rules:', error);
      throw error;
    }
  }

  private async streamMentions() {
    const stream = await this.client.v2.searchStream({
      'tweet.fields': ['author_id', 'created_at', 'referenced_tweets', 'text'],
      expansions: ['author_id', 'referenced_tweets.id'],
      'user.fields': ['username', 'created_at', 'public_metrics'],
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
      // Reconnect after 5 seconds on error
      setTimeout(() => this.streamMentions(), 5000);
    });

    // Keep-alive reconnect on disconnect
    stream.on('connection-error', (error) => {
      logger.error('Stream connection error:', error);
      setTimeout(() => this.streamMentions(), 10000);
    });
  }

  private async handleTweet(tweet: any) {
    const text = tweet.data?.text;
    if (!text) return;

    const lowerText = text.toLowerCase();

    // Must contain @xpay
    if (!lowerText.includes('@xpay')) return;

    const authorId = tweet.data.author_id;
    const tweetId = tweet.data.id;

    logger.info(`📨 New mention from ${authorId}: ${text}`);

    // Parse command
    const command = this.parser.parse(text);
    if (!command) {
      await this.reply(tweetId, '❌ Invalid command. Try: @xpay rain <amount> <token>');
      return;
    }

    // Handle rain command
    if (command.command === 'rain') {
      await this.handleRainCommand(tweet, command);
    }
  }

  private async handleRainCommand(tweet: any, command: any) {
    const tweetId = tweet.data.id;
    const authorId = tweet.data.author_id;

    try {
      // Get parent tweet (the one being replied to)
      const parentTweetId = tweet.data.referenced_tweets?.find(
        (t: any) => t.type === 'replied_to'
      )?.id;

      if (!parentTweetId) {
        await this.reply(tweetId, '❌ Rain must be a reply to a tweet. Reply to the tweet you want to rain on!');
        return;
      }

      await this.reply(tweetId, `⏳ Processing rain of ${command.amount} $${command.token}...`);

      // Execute rain
      const result = await this.rainDistributor.createRain({
        senderTwitterId: authorId,
        tweetId: parentTweetId,
        amount: command.amount,
        token: command.token,
        tokenCA: command.ca,
      });

      // Reply with summary
      const replyText = `🌧 Rain incoming! ${result.recipientCount} users will receive ${result.perUserAmount.toFixed(4)} $${command.token} each\n\nClaim → xpayx.org/claim/${result.rainEventId}`;
      await this.reply(tweetId, replyText);

      // DM each receiver
      for (const recipient of result.recipients) {
        await this.dmRecipient(recipient, result, command.token);
      }

    } catch (error: any) {
      logger.error('Rain error:', error);
      const msg = error.message === 'No eligible recipients found'
        ? '❌ No eligible recipients found. Recipients must have accounts >30 days old and >10 followers.'
        : '❌ Rain failed. Please try again.';
      await this.reply(tweetId, msg);
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

  private async dmRecipient(recipient: any, rainResult: any, token: string) {
    try {
      const message = `🌧 You received ${rainResult.perUserAmount.toFixed(4)} $${token}!\n\nClaim here: https://xpayx.org/claim/${rainResult.rainEventId}\n\nExpires in 24h ⏰`;

      await this.client.v1.sendDm({
        recipient_id: recipient.twitterId,
        text: message,
      });
      logger.info(`📩 DM sent to @${recipient.twitterHandle}`);
    } catch (error) {
      // DM failed — reply in thread as fallback
      logger.warn(`DM failed for @${recipient.twitterHandle}, skipping`);
    }
  }

  private startExpiryCron() {
    const cron = require('node-cron');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.info('⏰ Checking for expired claims...');
      await this.rainDistributor.processExpiredClaims();
    });

    logger.info('⏰ Expiry cron started (every 5 min)');
  }
}
