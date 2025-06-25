
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';
import VaultCard from '@/components/VaultCard';
import CreateVaultDialog from '@/components/CreateVaultDialog';

interface Vault {
  id: string;
  title: string;
  description: string | null;
  encrypted_password: string;
  delay_seconds: number;
  reveal_requested_at: string | null;
  revealed_at: string | null;
  created_at: string;
}

const SimpleVault = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load vaults from localStorage
    const savedVaults = localStorage.getItem('password_vaults');
    if (savedVaults) {
      setVaults(JSON.parse(savedVaults));
    }
    setLoading(false);
  }, []);

  const saveVaults = (newVaults: Vault[]) => {
    setVaults(newVaults);
    localStorage.setItem('password_vaults', JSON.stringify(newVaults));
  };

  const handleVaultCreated = (newVault: Omit<Vault, 'id' | 'created_at'>) => {
    const vault: Vault = {
      ...newVault,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const updatedVaults = [vault, ...vaults];
    saveVaults(updatedVaults);
  };

  const handleVaultDeleted = (id: string) => {
    const updatedVaults = vaults.filter(vault => vault.id !== id);
    saveVaults(updatedVaults);
  };

  const handleVaultUpdated = (updatedVault: Vault) => {
    const updatedVaults = vaults.map(vault => 
      vault.id === updatedVault.id ? updatedVault : vault
    );
    saveVaults(updatedVaults);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your vaults...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Password Time Vault</h1>
              <p className="text-blue-200 text-sm">Secure passwords with custom delays</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreateVaultDialog onVaultCreated={handleVaultCreated} />
          </div>
        </header>

        {/* Vaults Grid */}
        {vaults.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-white mb-2">No vaults yet</h2>
            <p className="text-blue-200 mb-6">Create your first secure password vault with a custom delay.</p>
            <CreateVaultDialog onVaultCreated={handleVaultCreated} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onDelete={handleVaultDeleted}
                onUpdate={handleVaultUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVault;
