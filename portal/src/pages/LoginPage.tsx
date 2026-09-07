import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { AlertCircle, ArrowRight, ArrowUpRight, MapPin, Truck, Calendar, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import logo from '@/assets/transline-logo-lockup.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { document.title = 'Sign in | Transline Admin'; }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message.includes('Invalid login credentials') ? 'Email or password not recognised.' : signInError.message);
        setLoading(false);
      }
    } catch (caught) {
      console.error('Sign in error:', caught);
      setError('Sign in could not be completed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="portalLogin">
      <section className="portalLoginStory">
        <a href="/" className="portalLoginBrand"><img src={logo} alt="Transline Logistics" /><span>ADMIN PORTAL</span></a>
        <div className="portalLoginPitch">
          <p className="portalEyebrow">Transline / Operations</p>
          <p className="portalLoginHeadline">Your fleet.<br />In focus<span>.</span></p>
          <p className="portalLoginIntro">The control room for every driver, every vehicle and every shift.</p>
          <div className="portalLoginCapabilities">
            <span><MapPin size={18} /> Driver locations</span>
            <span><Truck size={18} /> Fleet management</span>
            <span><Calendar size={18} /> Shift oversight</span>
          </div>
        </div>
        <div className="portalLoginStoryFoot"><span>PERTH, WESTERN AUSTRALIA</span><span>TL / 01</span></div>
      </section>
      <main className="portalLoginMain">
        <a href="/" className="portalLoginBack">Back to website <ArrowUpRight size={15} /></a>
        <div className="portalLoginForm">
          <div className="portalLoginLock"><LockKeyhole size={23} /></div>
          <p className="portalEyebrow">Authorised access</p>
          <h1>Let’s get<br />to work<span className="text-primary">.</span></h1>
          <p className="portalLoginHint">Sign in with your Transline admin account.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                autoComplete="username" required className="h-12 bg-card" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password" required className="h-12 bg-card pr-12" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="portalPasswordToggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-12 w-full justify-between px-5">
              {loading ? 'Checking account…' : 'Sign in to operations'} <ArrowRight size={18} />
            </Button>
          </form>
          <p className="portalLoginSupport">For account access, contact your Transline administrator.</p>
        </div>
        <div className="portalLoginLegal">Transline Logistics <span>Staff access only</span></div>
      </main>
    </div>
  );
}
