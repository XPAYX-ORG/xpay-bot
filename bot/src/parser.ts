import { logger } from './logger';

interface ParsedCommand {
  command: string;
  amount: number;
  token: string;
  ca?: string;
}

export class CommandParser {
  private readonly TOKEN_PATTERNS = {
    XPAY: ['xpay', '$xpay'],
    SOL: ['sol', '$sol'],
    USDC: ['usdc', '$usdc'],
  };

  parse(text: string): ParsedCommand | null {
    // Remove @xpay mention and trim
    const cleanText = text.replace(/@xpay\s*/gi, '').trim().toLowerCase();
    
    // Split by spaces
    const parts = cleanText.split(/\s+/);
    
    if (parts.length < 3) return null;

    const [cmd, amountStr, tokenStr] = parts;

    // Check command
    if (cmd !== 'rain') return null;

    // Parse amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    // Parse token
    const token = this.parseToken(tokenStr);
    if (!token) return null;

    // Check if token is a contract address (44 chars, base58)
    const ca = this.isContractAddress(tokenStr) ? tokenStr : undefined;

    return {
      command: 'rain',
      amount,
      token: token.symbol,
      ca,
    };
  }

  private parseToken(tokenStr: string): { symbol: string } | null {
    const clean = tokenStr.replace('$', '').toLowerCase();

    // Check known tokens
    for (const [symbol, patterns] of Object.entries(this.TOKEN_PATTERNS)) {
      if (patterns.includes(clean)) {
        return { symbol };
      }
    }

    // Check if it's a contract address
    if (this.isContractAddress(tokenStr)) {
      return { symbol: 'SPL' };
    }

    // Accept any uppercase token symbol (3-10 chars)
    if (/^[a-z]{3,10}$/i.test(tokenStr)) {
      return { symbol: tokenStr.toUpperCase() };
    }

    return null;
  }

  private isContractAddress(str: string): boolean {
    // Solana addresses are 32-44 characters, base58 encoded
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
  }
}