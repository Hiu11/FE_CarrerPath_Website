import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../store/token.store';

/** Clears auth token and redirects to login page */
export const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    tokenStore.clear();
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};
