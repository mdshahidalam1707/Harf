import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Briefcase, 
  GraduationCap, 
  Link as LinkIcon, 
  MapPin, 
  Mail, 
  Users, 
  MessageCircle, 
  UserPlus,
  Loader2,
  ExternalLink,
  Globe,
  Award
} from 'lucide-react';
import { User, supabase } from '@/lib/supabase';

interface PublicProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  currentUserId: string;
}

export function PublicProfileModal({ userId, isOpen, onClose, onStartChat, currentUserId }: PublicProfileModalProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutualCount, setMutualCount] = useState(0);

  useEffect(() => {
    if (userId && isOpen) {
      loadProfile();
    }
  }, [userId, isOpen]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Load user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Load mutual connections
      const { data: mutuals } = await supabase.rpc('get_mutual_connections', {
        user_a: currentUserId,
        user_b: userId
      });
      setMutualCount(mutuals?.length || 0);

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none">
        {loading ? (
          <div className="flex items-center justify-center h-[500px] bg-white">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : profile ? (
          <div className="flex flex-col bg-gray-50 max-h-[90vh] overflow-y-auto">
            {/* Header / Cover */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <div className="absolute -bottom-16 left-8">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.profile_photo} />
                  <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                    {profile.name?.charAt(0) || profile.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-8 pb-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{profile.name}</h2>
                  <p className="text-lg text-blue-600 font-semibold">{profile.headline || profile.profession || 'Professional'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => onStartChat(profile.id)}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold px-6"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                {profile.company && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>{profile.company}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span>{profile.education}</span>
                  </div>
                )}
                {mutualCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 font-medium">
                    <Users className="w-4 h-4" />
                    <span>{mutualCount} mutual connections</span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </div>

            {/* Professional Sections */}
            <div className="p-8 space-y-6">
              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" /> Skills & Endorsements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 text-sm rounded-lg"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Contact / Links */}
              <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <span>{profile.email}</span>
                  </div>
                  {profile.portfolio_url && (
                    <a 
                      href={profile.portfolio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-blue-600 hover:underline"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-400" />
                      </div>
                      <span>Portfolio / Website</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            Profile not found or access denied.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
