
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, EyeOff, Shield, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, onDelete }) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const formatDelay = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      if (vault.reveal_requested_at && !vault.revealed_at) {
        const requestTime = new Date(vault.reveal_requested_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - requestTime) / 1000);
        const remaining = Math.max(0, vault.delay_seconds - elapsed);
        
        setTimeRemaining(remaining);
        setIsReady(remaining === 0);
        
        if (remaining === 0) {
          markAsRevealed();
        }
      } else if (vault.revealed_at) {
        setIsReady(true);
        setTimeRemaining(0);
      }
    };

    if (vault.reveal_requested_at && !vault.revealed_at) {
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else if (vault.revealed_at) {
      setIsReady(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [vault]);

  const markAsRevealed = async () => {
    try {
      const { error } = await supabase
        .from('password_vaults')
        .update({ revealed_at: new Date().toISOString() })
        .eq('id', vault.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking vault as revealed:', error);
    }
  };

  const handleReveal = async () => {
    if (vault.revealed_at || isReady) {
      setShowPassword(!showPassword);
      return;
    }

    if (vault.reveal_requested_at) {
      toast({
        title: "Already revealing",
        description: "This vault is already in the reveal process.",
        variant: "destructive",
      });
      return;
    }

    setIsRevealing(true);
    try {
      const { error } = await supabase
        .from('password_vaults')
        .update({ reveal_requested_at: new Date().toISOString() })
        .eq('id', vault.id);

      if (error) throw error;

      toast({
        title: "Reveal started",
        description: `Password will be available in ${formatDelay(vault.delay_seconds)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start reveal process",
        variant: "destructive",
      });
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopy = async () => {
    if (isReady && showPassword) {
      await navigator.clipboard.writeText(vault.encrypted_password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('password_vaults')
        .delete()
        .eq('id', vault.id);

      if (error) throw error;
      
      onDelete(vault.id);
      toast({
        title: "Vault deleted",
        description: "The vault has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vault",
        variant: "destructive",
      });
    }
  };

  const getStatus = () => {
    if (vault.revealed_at || isReady) return 'Ready';
    if (vault.reveal_requested_at) return 'Revealing';
    return 'Secured';
  };

  const getStatusColor = () => {
    if (vault.revealed_at || isReady) return 'bg-green-600';
    if (vault.reveal_requested_at) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              {vault.title}
            </CardTitle>
            {vault.description && (
              <CardDescription className="text-blue-200 mt-1">
                {vault.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor()} text-white border-0`}>
              {getStatus()}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-blue-200">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Delay: {formatDelay(vault.delay_seconds)}</span>
        </div>

        {vault.reveal_requested_at && timeRemaining !== null && timeRemaining > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-200">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Time remaining: {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          </div>
        )}

        {(isReady || vault.revealed_at) && showPassword && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-green-200 font-mono text-sm break-all">
                {vault.encrypted_password}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-green-300 hover:text-green-200 hover:bg-green-500/10 ml-2 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleReveal}
            disabled={isRevealing || (vault.reveal_requested_at && timeRemaining! > 0)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRevealing ? (
              'Starting...'
            ) : isReady || vault.revealed_at ? (
              <>
                {showPassword ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPassword ? 'Hide' : 'Show'} Password
              </>
            ) : vault.reveal_requested_at ? (
              'Revealing...'
            ) : (
              'Start Reveal'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VaultCard;
