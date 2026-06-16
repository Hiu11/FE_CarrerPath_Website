import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../store/token.store';
import type { CurrentUser } from '../types/auth.types';

export const MePage = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.data as CurrentUser);
        setMessage('');
      } catch {
        tokenStore.clear();
        navigate('/logout');
      }
    };

    void run();
  }, [navigate]);

  if (message) return <div className="card">{message}</div>;

  return (
    <div className="card">
      <h2>My Profile</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button
        onClick={() => {
          tokenStore.clear();
          navigate('/logout');
        }}
      >
        Logout
      </button>
    </div>
  );
};
