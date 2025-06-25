
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Eye, EyeOff, Copy, Trash2, CheckCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface VaultCardProps {
  vault: Vault;
  onDelete: (id: string) => void;
  onUpdate: (vault: Vault) => void;
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, onDelete, onUpdate }) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  const formatDelayDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months`;
    return `${Math.floor(seconds / 31536000)} years`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (vault.reveal_requested_at && !vault.revealed_at) {
      const updateCountdown = () => {
        const requestedAt = new Date(vault.reveal_requested_at!).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - requestedAt) / 1000);
        const remaining = Math.max(0, vault.delay_seconds - elapsed);

        setTimeRemaining(remaining);

        if (remaining === 0 && !vault.revealed_at) {
          const updatedVault = { ...vault, revealed_at: new Date().toISOString() };
          onUpdate(updatedVault);
          setIsRevealed(true);
          toast({
            title: "Password Ready!",
            description: `Your password for "${vault.title}" is now available.`,
          });
        }
      };

      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    } else if (vault.revealed_at) {
      setIsRevealed(true);
      setTimeRemaining(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [vault, onUpdate, toast]);

  const handleRevealRequest = () => {
    if (!vault.reveal_requested_at) {
      const updatedVault = { ...vault, reveal_requested_at: new Date().toISOString() };
      onUpdate(updatedVault);
      toast({
        title: "Countdown Started!",
        description: `Your password will be available in ${formatDelayDuration(vault.delay_seconds)}.`,
      });
    }
  };

  const handleHidePassword = () => {
    const updatedVault = { 
      ...vault, 
      reveal_requested_at: null, 
      revealed_at: null 
    };
    onUpdate(updatedVault);
    setIsRevealed(false);
    setShowPassword(false);
    setTimeRemaining(null);
    toast({
      title: "Password Hidden",
      description: `Password for "${vault.title}" has been hidden. You can reveal it again when needed.`,
    });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(vault.encrypted_password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy password to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this vault?')) {
      onDelete(vault.id);
      toast({
        title: "Vault deleted",
        description: "Your password vault has been deleted.",
      });
    }
  };

  const getStatus = () => {
    if (!vault.reveal_requested_at) return 'waiting';
    if (vault.revealed_at || (timeRemaining !== null && timeRemaining <= 0)) return 'revealed';
    return 'counting';
  };

  const status = getStatus();

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white text-lg">{vault.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {vault.description && (
          <CardDescription className="text-blue-200">{vault.description}</CardDescription>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-400/30">
            Delay: {formatDelayDuration(vault.delay_seconds)}
          </Badge>
          <Badge 
            variant="secondary" 
            className={`border ${
              status === 'waiting' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-400/30' :
              status === 'counting' ? 'bg-orange-600/20 text-orange-300 border-orange-400/30' :
              'bg-green-600/20 text-green-300 border-green-400/30'
            }`}
          >
            {status === 'waiting' ? 'Waiting' : 
             status === 'counting' ? 'Counting down' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {status === 'waiting' && (
          <div className="space-y-4">
            <p className="text-blue-200 text-sm">
              Click reveal to start the {formatDelayDuration(vault.delay_seconds)} countdown.
            </p>
            <Button 
              onClick={handleRevealRequest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Start Reveal
            </Button>
          </div>
        )}

        {status === 'counting' && timeRemaining !== null && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-2">Time remaining:</p>
              <div className="text-2xl font-mono text-white bg-blue-600/20 rounded-lg py-3 px-4 border border-blue-400/30">
                {formatDuration(timeRemaining)}
              </div>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((vault.delay_seconds - timeRemaining) / vault.delay_seconds) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'revealed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Password is ready!</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-blue-200 text-sm">Password:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={vault.encrypted_password}
                  readOnly
                  className="w-full bg-blue-900/30 border border-blue-400/30 rounded-lg px-3 py-2 text-white font-mono text-sm pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="absolute right-1 top-1 text-blue-400 hover:text-blue-300 p-1"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleHidePassword}
              variant="outline"
              className="w-full bg-transparent border-blue-400/30 text-blue-300 hover:bg-blue-600/20 hover:text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Hide Password
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VaultCard;
