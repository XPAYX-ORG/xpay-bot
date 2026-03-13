import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { config } from './config';
import { logger } from './logger';

// Token addresses
const TOKENS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  // XPAY: '', // Add after pump.fun mint
};

export class SolanaService {
  private connection: Connection;
  private escrowWallet: Keypair;

  constructor() {
    this.connection = new Connection(config.SOLANA_RPC, 'confirmed');
    // In production, load from secure storage
    this.escrowWallet = Keypair.generate();
  }

  async transferSOL(from: Keypair, to: string, amount: number): Promise<string> {
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await this.connection.sendTransaction(transaction, [from]);
      await this.connection.confirmTransaction(signature);

      logger.info(`✅ SOL transfer: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('SOL transfer error:', error);
      throw error;
    }
  }

  async transferSPL(from: Keypair, to: string, mint: string, amount: number, decimals: number = 6): Promise<string> {
    try {
      const mintPubkey = new PublicKey(mint);
      const toPubkey = new PublicKey(to);

      // Get source token account
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        from,
        mintPubkey,
        from.publicKey
      );

      // Get destination token account
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        from,
        mintPubkey,
        toPubkey
      );

      // Create transfer instruction
      const transferAmount = amount * Math.pow(10, decimals);
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          from.publicKey,
          transferAmount
        )
      );

      const signature = await this.connection.sendTransaction(transaction, [from]);
      await this.connection.confirmTransaction(signature);

      logger.info(`✅ SPL transfer: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('SPL transfer error:', error);
      throw error;
    }
  }

  async transferToEscrow(from: Keypair, amount: number, token: string): Promise<string> {
    if (token === 'SOL') {
      return this.transferSOL(from, this.escrowWallet.publicKey.toString(), amount);
    } else {
      const mint = TOKENS[token as keyof typeof TOKENS];
      if (!mint) throw new Error(`Unknown token: ${token}`);
      return this.transferSPL(from, this.escrowWallet.publicKey.toString(), mint, amount);
    }
  }

  async distributeFromEscrow(recipients: Array<{ address: string; amount: number }>, token: string): Promise<string[]> {
    const signatures = [];

    for (const recipient of recipients) {
      try {
        let signature;
        if (token === 'SOL') {
          signature = await this.transferSOL(this.escrowWallet, recipient.address, recipient.amount);
        } else {
          const mint = TOKENS[token as keyof typeof TOKENS];
          if (!mint) continue;
          signature = await this.transferSPL(this.escrowWallet, recipient.address, mint, recipient.amount);
        }
        signatures.push(signature);
      } catch (error) {
        logger.error(`Failed to distribute to ${recipient.address}:`, error);
      }
    }

    return signatures;
  }

  getEscrowAddress(): string {
    return this.escrowWallet.publicKey.toString();
  }

  async distributeSOLFromEscrow(toAddress: string, amount: number): Promise<string> {
    return this.transferSOL(this.escrowWallet, toAddress, amount);
  }

  async distributeSPLFromEscrow(toAddress: string, token: string, amount: number): Promise<string> {
    const mint = TOKENS[token as keyof typeof TOKENS];
    if (!mint) throw new Error(`Unknown token: ${token}`);
    return this.transferSPL(this.escrowWallet, toAddress, mint, amount);
  }
}