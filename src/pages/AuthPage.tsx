import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, Chrome } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

export function AuthPage() {
  const { continueAsGuest } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError('Supabase is not configured.');
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
     if (!supabase) return;
     const { error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
             redirectTo: window.location.origin
         }
     });
     if (error) alert(error.message);
  };

  return (
    <div className="w-full min-h-[100dvh] max-w-md mx-auto bg-gray-50 flex flex-col relative sm:border-x border-gray-200 justify-between py-6">
      {/* Top Bar with Language Selector */}
      <div className="w-full px-6 flex justify-end items-center">
        <LanguageToggle variant="compact" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-brand rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-brand/30">
            <HeartPulse className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Breathe AI <span className="text-sm font-medium text-gray-400 block mt-1">by Noconi</span>
          </h1>
          <p className="text-gray-500 font-medium px-4 leading-relaxed text-sm">
            {t.auth.tagline}
          </p>
        </div>

        <div className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 tracking-wide">
                {t.auth.emailLabel}
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" 
                placeholder={t.auth.emailPlaceholder}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 tracking-wide">
                {t.auth.passwordLabel}
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" 
                placeholder={t.auth.passwordPlaceholder}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary text-sm py-3.5"
            >
              {loading ? t.common.loading : (isSignUp ? t.auth.signUp : t.auth.signIn)}
            </button>
          </form>

          <div className="flex items-center gap-3">
             <div className="h-px bg-gray-200 flex-1"></div>
             <span className="text-xs font-bold text-gray-400 uppercase">{t.common.or}</span>
             <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <button 
            type="button"
            onClick={signInWithGoogle} 
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold p-3.5 rounded-xl shadow-[0_2px_0_#e5e7eb] flex items-center justify-center gap-3 hover:bg-gray-50 active:translate-y-0.5 active:shadow-none transition-all text-sm"
          >
             <Chrome className="w-4 h-4 text-gray-500"/> Continue with Google
          </button>
        </div>

        <button 
           type="button"
           onClick={() => setIsSignUp(!isSignUp)}
           className="text-sm font-bold text-brand hover:text-brand-dark transition-colors"
        >
           {isSignUp ? t.auth.haveAccount : t.auth.needAccount}
        </button>

        <div className="pt-2 w-full text-center">
           <button 
             type="button"
             onClick={continueAsGuest}
             className="text-xs font-semibold text-gray-400 hover:text-gray-600 underline underline-offset-4 decoration-gray-300"
           >
              {t.auth.continueGuest}
           </button>
        </div>
      </div>
    </div>
  );
}
