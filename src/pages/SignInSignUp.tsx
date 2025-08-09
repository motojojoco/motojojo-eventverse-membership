import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";

const SignInSignUp = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Get redirect param from URL or state
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || location.state?.returnTo;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    if (authMode === 'signIn') {
      const { error } = await signIn(form.email, form.password);
      if (error) setFormError(error.message);
      else navigate(redirect || '/');
    } else {
      if (!form.full_name.trim()) {
        setFormError('Full name is required');
        setLoading(false);
        return;
      }
      const { error } = await signUp(form.email, form.password, form.full_name);
      if (error) setFormError(error.message);
      else navigate(redirect || '/');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setFormError(null);
    // Build the redirectTo URL for Supabase OAuth
    let redirectTo = window.location.origin;
    const targetRedirect = redirect || '/';
    if (targetRedirect !== '/') {
      // Ensure redirect starts with a slash
      redirectTo += targetRedirect.startsWith('/') ? targetRedirect : `/${targetRedirect}`;
    }
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo }
    });
    if (error) setFormError(error.message);
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-raspberry relative overflow-y-auto">
      <MovingPartyBackground />
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-6 md:py-12 z-10">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/80 rounded-2xl md:rounded-3xl shadow-soft p-6 md:p-10 flex flex-col items-center border border-sandstorm-200 backdrop-blur-md mx-2">
          <img src="/public/motojojo.png" alt="Motojojo" className="w-16 h-16 md:w-20 md:h-20 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-violet drop-shadow text-center">Welcome to Motojojo</h1>
          <p className="mb-4 md:mb-6 text-center text-raspberry font-medium text-base md:text-lg">{authMode === 'signIn' ? 'Sign in to discover and book unique experiences.' : 'Create your Motojojo account and join the community!'}</p>
          <Button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2 border border-sandstorm-300 bg-white text-raspberry hover:bg-sandstorm-100 hover:text-violet font-semibold mb-4 md:mb-6 transition-colors duration-150 text-base md:text-lg py-3"
            disabled={googleLoading}
          >
            <FcGoogle className="w-5 h-5" />
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>
          <div className="w-full flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-sandstorm-200" />
            <span className="text-xs text-sandstorm-600">or</span>
            <div className="flex-1 h-px bg-sandstorm-200" />
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
                className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
              />
            </div>
            {authMode === 'signUp' && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-violet" htmlFor="full_name">Full Name</label>
                <Input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  className="border-raspberry focus:border-violet focus:ring-violet/30 text-base py-3"
                />
              </div>
            )}
            {formError && <div className="text-red-600 text-sm font-semibold">{formError}</div>}
            <Button type="submit" className="w-full bg-raspberry hover:bg-raspberry/90 text-white font-bold py-3 rounded-xl shadow transition-colors duration-150 text-base md:text-lg" disabled={loading}>
              {loading ? (authMode === 'signIn' ? 'Signing In...' : 'Signing Up...') : (authMode === 'signIn' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {authMode === 'signIn' ? (
              <>Don't have an account? <button className="text-violet underline font-semibold hover:text-raspberry transition-colors" onClick={() => { setAuthMode('signUp'); setFormError(null); }}>Sign Up</button></>
            ) : (
              <>Already have an account? <button className="text-violet underline font-semibold hover:text-raspberry transition-colors" onClick={() => { setAuthMode('signIn'); setFormError(null); }}>Sign In</button></>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignInSignUp; 