import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, Globe, Lock, Shield, Loader2 } from 'lucide-react';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

export function CreateCommunityModal({ isOpen, onClose, onCreate }: CreateCommunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private',
    rules: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
      setFormData({ name: '', description: '', type: 'public', rules: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <Users className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-white">Start a Community</DialogTitle>
            <p className="text-blue-100 font-medium mt-1">Build your professional circle on Harf.</p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Group Name</Label>
            <Input 
              required
              placeholder="e.g. Next.js Developers" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl bg-gray-50 border-none h-12 font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">About the Group</Label>
            <Textarea 
              placeholder="What is this community for?" 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="rounded-xl bg-gray-50 border-none min-h-[100px] font-medium resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Privacy Setting</Label>
            <Select 
              value={formData.type} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
            >
              <SelectTrigger className="rounded-xl bg-gray-50 border-none h-12 font-medium">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
                <SelectItem value="public" className="py-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold">Public</p>
                      <p className="text-[10px] text-gray-400">Anyone can find and join this group.</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private" className="py-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-bold">Private</p>
                      <p className="text-[10px] text-gray-400">Membership requires an invite or approval.</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 rounded-xl h-12 font-bold text-gray-500"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-extrabold shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
