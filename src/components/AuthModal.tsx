import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncAllRecipes } from '../services/syncService';
import type { User } from '@supabase/supabase-js';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserChange: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    setErrorMsg(null);
    try {
      const res = await syncAllRecipes(user);
      setSuccessMsg(`Synced ${res.syncedCount} recipes with the cloud.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    resetForm();
    try {
      await supabase.auth.signOut();
      onUserChange(null);
      setSuccessMsg('Signed out successfully.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase credentials are not configured.');
      return;
    }

    setLoading(true);
    resetForm();

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccessMsg(`Magic login link sent to ${email}! Check your inbox.`);
      } else if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          onUserChange(data.user);
          await syncAllRecipes(data.user);
          onClose();
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user && data.session) {
          onUserChange(data.user);
          await syncAllRecipes(data.user);
          onClose();
        } else {
          setSuccessMsg('Account created! If email confirmation is enabled, check your inbox.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-alabaster rounded-2xl border border-stone-border shadow-2xl w-full max-w-md overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-border bg-stone-surface/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center border border-terracotta/20">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal">
                {user ? 'Cloud Sync Account' : 'Sync Across Devices'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-grey hover:text-charcoal hover:bg-stone-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sage/10 border border-sage/20 text-sage text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {user ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-surface border border-stone-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-grey uppercase tracking-wider font-medium">Account</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage">
                    <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                    Live Cloud Sync Active
                  </span>
                </div>
                <div className="text-sm font-semibold text-charcoal truncate">
                  {user.email}
                </div>
              </div>

              <p className="text-xs text-warm-grey leading-relaxed">
                Recipes you create or modify on this device will automatically sync to your phone, tablet, and other computers logged into this account.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-border bg-stone-surface text-charcoal hover:bg-stone-border/30 text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100/60 text-xs font-semibold transition-all disabled:opacity-60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Auth Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tab Selector */}
              <div className="flex p-1 rounded-xl bg-stone-surface border border-stone-border text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); resetForm(); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-alabaster text-charcoal font-semibold shadow-sm'
                      : 'text-warm-grey hover:text-charcoal'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); resetForm(); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-alabaster text-charcoal font-semibold shadow-sm'
                      : 'text-warm-grey hover:text-charcoal'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('magic'); resetForm(); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'magic'
                      ? 'bg-alabaster text-charcoal font-semibold shadow-sm'
                      : 'text-warm-grey hover:text-charcoal'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-warm-grey mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-warm-grey absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="baker@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-border bg-stone-surface focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                    />
                  </div>
                </div>

                {mode !== 'magic' && (
                  <div>
                    <label className="block text-xs font-medium text-warm-grey mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-warm-grey absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-border bg-stone-surface focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-warm-grey leading-tight pt-1">
                {mode === 'magic'
                  ? 'We will send a passwordless login link directly to your email.'
                  : mode === 'signup'
                  ? 'All recipes currently on this device will automatically be saved to your new account.'
                  : 'Log in with the same email on your phone, tablet, and computer to sync.'}
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta text-alabaster font-semibold text-xs tracking-wide shadow-sm hover:bg-terracotta/90 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'magic' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Send Magic Link
                  </>
                ) : mode === 'signup' ? (
                  'Create Account & Sync'
                ) : (
                  'Sign In & Sync'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
