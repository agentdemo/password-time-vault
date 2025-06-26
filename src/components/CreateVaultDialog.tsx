
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Vault {
  title: string;
  description: string | null;
  encrypted_password: string;
  delay_seconds: number;
  reveal_requested_at: string | null;
  revealed_at: string | null;
}

interface CreateVaultDialogProps {
  onVaultCreated: (vault: Vault) => void;
}

const CreateVaultDialog: React.FC<CreateVaultDialogProps> = ({ onVaultCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [delayType, setDelayType] = useState('minutes');
  const [delayValue, setDelayValue] = useState('5');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
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

  const getDelaySeconds = () => {
    const value = parseInt(delayValue);
    switch (delayType) {
      case 'seconds': return value;
      case 'minutes': return value * 60;
      case 'hours': return value * 3600;
      case 'days': return value * 86400;
      case 'weeks': return value * 604800;
      case 'months': return value * 2592000;
      case 'years': return value * 31536000;
      default: return value * 60;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const delaySeconds = getDelaySeconds();
      
      if (delaySeconds < 1 || delaySeconds > 1576800000) {
        toast({
          title: "Invalid delay",
          description: "Delay must be between 1 second and 50 years.",
          variant: "destructive",
        });
        return;
      }

      const vault: Vault = {
        title: title.trim(),
        description: description.trim() || null,
        encrypted_password: password,
        delay_seconds: delaySeconds,
        reveal_requested_at: null,
        revealed_at: null,
      };

      onVaultCreated(vault);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPassword('');
      setDelayValue('5');
      setDelayType('minutes');
      setOpen(false);
      
      toast({
        title: "Vault created!",
        description: "Your password vault has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Failed to create vault. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Password Vault</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a secure vault with a custom delay for password access.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Emergency Access Code"
              required
              className="bg-slate-800 border-slate-600"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this vault..."
              className="bg-slate-800 border-slate-600 min-h-[60px]"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate a password"
                required
                className="bg-slate-800 border-slate-600"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                className="border-slate-600 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {password && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyPassword}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label>Delay Duration</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={delayValue}
                onChange={(e) => setDelayValue(e.target.value)}
                min="1"
                max="50"
                required
                className="bg-slate-800 border-slate-600"
              />
              <Select value={delayType} onValueChange={setDelayType}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? 'Creating...' : 'Create Vault'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVaultDialog;
