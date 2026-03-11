import { TwitterBot } from './twitter';
import { logger } from './logger';

async function main() {
  try {
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