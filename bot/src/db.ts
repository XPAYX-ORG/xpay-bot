import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { logger } from './logger';

export class DatabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
  }

  async getUser(twitterId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('twitter_id', twitterId)
      .single();

    if (error) {
      logger.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async createUser(userData: {
    twitterId: string;
    twitterHandle: string;
    solanaAddress: string;
  }) {
    const { data, error } = await this.client
      .from('users')
      .insert({
        twitter_id: userData.twitterId,
        twitter_handle: userData.twitterHandle,
        solana_address: userData.solanaAddress,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating user:', error);
      throw error;
    }

    return data;
  }

  async createRainEvent(eventData: {
    senderTwitterId: string;
    tweetId: string;
    token: string;
    tokenCA?: string;
    totalAmount: number;
    perUserAmount: number;
    recipientCount: number;
  }) {
    const { data, error } = await this.client
      .from('rain_events')
      .insert({
        sender_twitter_id: eventData.senderTwitterId,
        tweet_id: eventData.tweetId,
        token: eventData.token,
        token_ca: eventData.tokenCA,
        total_amount: eventData.totalAmount,
        per_user_amount: eventData.perUserAmount,
        recipient_count: eventData.recipientCount,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating rain event:', error);
      throw error;
    }

    return data;
  }

  async createClaim(claimData: {
    rainEventId: string;
    receiverTwitterId: string;
    amount: number;
    token: string;
  }) {
    const { data, error } = await this.client
      .from('claims')
      .insert({
        rain_event_id: claimData.rainEventId,
        receiver_twitter_id: claimData.receiverTwitterId,
        amount: claimData.amount,
        token: claimData.token,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating claim:', error);
      throw error;
    }

    return data;
  }

  async updateClaimStatus(claimId: string, status: string) {
    const { error } = await this.client
      .from('claims')
      .update({
        status,
        claimed_at: status === 'claimed' ? new Date().toISOString() : null,
      })
      .eq('id', claimId);

    if (error) {
      logger.error('Error updating claim:', error);
      throw error;
    }
  }

  async getExpiredClaims() {
    const { data, error } = await this.client
      .from('claims')
      .select('*, rain_event:rain_events(*)')
      .eq('status', 'pending')
      .lt('rain_event.expires_at', new Date().toISOString());

    if (error) {
      logger.error('Error fetching expired claims:', error);
      return [];
    }

    return data || [];
  }

  async getClaimsByRainEvent(rainEventId: string) {
    const { data, error } = await this.client
      .from('claims')
      .select('*')
      .eq('rain_event_id', rainEventId);

    if (error) {
      logger.error('Error fetching claims:', error);
      return [];
    }

    return data || [];
  }
}