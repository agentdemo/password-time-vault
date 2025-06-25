
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Dice6, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateVaultDialogProps {
  onVaultCreated: () => void;
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

  const generatePassword = (length: number = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGeneratePassword = () => {
    setPassword(generatePassword());
  };

  const getDelayInSeconds = () => {
    const value = parseInt(delayValue);
    switch (delayType) {
      case 'seconds': return value;
      case 'minutes': return value * 60;
      case 'hours': return value * 3600;
      case 'days': return value * 86400;
      default: return value * 60;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and password",
        variant: "destructive",
      });
      return;
    }

    const delaySeconds = getDelayInSeconds();
    if (delaySeconds < 10 || delaySeconds > 31536000) {
      toast({
        title: "Invalid delay",
        description: "Delay must be between 10 seconds and 1 year",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('password_vaults')
        .insert({
          user_id: userData.user.id,
          title: title.trim(),
          description: description.trim() || null,
          encrypted_password: password,
          delay_seconds: delaySeconds,
        });

      if (error) throw error;

      toast({
        title: "Vault created",
        description: "Your password vault has been created successfully",
      });

      setTitle('');
      setDescription('');
      setPassword('');
      setDelayValue('5');
      setDelayType('minutes');
      setOpen(false);
      onVaultCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create vault",
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
          <DialogTitle className="text-xl">Create Password Vault</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a secure vault with a custom delay for password access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Work Email Password"
              className="bg-slate-800 border-slate-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes about this password..."
              className="bg-slate-800 border-slate-600 resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate password"
                className="bg-slate-800 border-slate-600 flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGeneratePassword}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Dice6 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Delay Duration</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={delayValue}
                onChange={(e) => setDelayValue(e.target.value)}
                min="1"
                className="bg-slate-800 border-slate-600 flex-1"
                required
              />
              <Select value={delayType} onValueChange={setDelayType}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Vault'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVaultDialog;
