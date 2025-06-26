
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

const Dashboard = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadVaults();
    }
  }, [user]);

  const loadVaults = async () => {
    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading vaults",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVaults(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your vaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVaultCreated = async (newVault: Omit<Vault, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .insert([{
          user_id: user!.id,
          title: newVault.title,
          description: newVault.description,
          encrypted_password: newVault.encrypted_password,
          delay_seconds: newVault.delay_seconds,
          reveal_requested_at: newVault.reveal_requested_at,
          revealed_at: newVault.revealed_at,
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating vault",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVaults([data, ...vaults]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create vault.",
        variant: "destructive",
      });
    }
  };

  const handleVaultDeleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('password_vaults')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting vault",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVaults(vaults.filter(vault => vault.id !== id));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vault.",
        variant: "destructive",
      });
    }
  };

  const handleVaultUpdated = async (updatedVault: Vault) => {
    try {
      const { error } = await supabase
        .from('password_vaults')
        .update({
          reveal_requested_at: updatedVault.reveal_requested_at,
          revealed_at: updatedVault.revealed_at,
        })
        .eq('id', updatedVault.id);

      if (error) {
        toast({
          title: "Error updating vault",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setVaults(vaults.map(vault => 
          vault.id === updatedVault.id ? updatedVault : vault
        ));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vault.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
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
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <User className="w-4 h-4" />
              {user?.email}
            </div>
            <CreateVaultDialog onVaultCreated={handleVaultCreated} />
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-red-400/30 text-red-300 hover:bg-red-600/20 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
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

export default Dashboard;
