import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { localLogin } from '../utils/localAuth';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const ok = localLogin(username, password);
    if (!ok) return setError('Invalid credentials');
    navigate('/');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Transline Logistics</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin" />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white">
            Sign In
          </Button>
        </form>

        <div className="text-xs text-center text-muted-foreground">
          Temporary admin/admin login
        </div>
      </Card>
    </div>
  );
}
