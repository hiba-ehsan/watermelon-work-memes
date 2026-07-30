import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private _client: SupabaseClient;
  private _adminClient: SupabaseClient;

  onModuleInit() {
    this._client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
    this._adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  }

  get client(): SupabaseClient {
    return this._client;
  }

  get adminClient(): SupabaseClient {
    return this._adminClient;
  }

  async getUser(token: string) {
    const { data, error } = await this._client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  }
}
