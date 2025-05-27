import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async signIn(email: string, password_hash: string) {
    return this.supabase.auth.signInWithPassword({ email, password: password_hash });
  }

  async signUp(email: string, password_hash: string) {
    return this.supabase.auth.signUp({ email, password: password_hash });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  onAuthStateChange(callback: any) {
    this.supabase.auth.onAuthStateChange(callback);
  }
}