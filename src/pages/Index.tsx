
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from './Dashboard';
import Auth from './Auth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

export default Index;
