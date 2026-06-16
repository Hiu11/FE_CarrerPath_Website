import React from 'react';
import { Navigate } from 'react-router-dom';
import { tokenStore } from '../store/token.store';

export const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = tokenStore.get();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};
