import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth, type User } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { ApiError } from '@/types';

interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    userType: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  accessToken: string;
}

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<LoginResponse>('/auth/login-password', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({
          identifier: username,
          password,
        }),
      });

      // Use context to store auth data
      login(data.user as User, data.accessToken);
      nav('/dashboard');
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-muted/20 grid min-h-screen place-items-center p-4'>
      <Card className='w-full max-w-sm rounded-2xl shadow-sm'>
        <CardHeader>
          <CardTitle className='text-xl'>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='grid gap-3' onSubmit={handleSubmit}>
            <div className='grid gap-2'>
              <label className='text-sm'>Username</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder='Enter username'
                autoComplete='username'
              />
            </div>
            <div className='grid gap-2'>
              <label className='text-sm'>Password</label>
              <Input
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter password'
                autoComplete='current-password'
              />
            </div>
            {error && <div className='text-sm text-red-600'>{error}</div>}
            <Button type='submit' className='mt-1' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
