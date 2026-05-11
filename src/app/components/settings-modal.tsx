import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { 
  Settings, Bell, Shield, Palette, Info, Loader2, LogOut, 
  User as UserIcon, Lock, MessageSquare, Video, Keyboard, HelpCircle, 
  Search, ChevronRight, Monitor, Globe, Moon, Sun, Camera, Check, Plus
} from 'lucide-react';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/app/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { supabase, updateUserProfile, updateUserSettings, User, uploadProfileImage } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout?: () => void;
  user: User;
  onUserUpdate?: (user: User) => void;
}

export function SettingsModal({ open, onOpenChange, onLogout, user, onUserUpdate }: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings States
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [themeColor, setThemeColor] = useState('blue');

  // Profile States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileProfession, setProfileProfession] = useState(user?.profession || '');
  const [profileHeadline, setProfileHeadline] = useState(user?.headline || '');
  const [profileCompany, setProfileCompany] = useState(user?.company || '');
  const [profileEducation, setProfileEducation] = useState(user?.education || '');
  const [profilePortfolio, setProfilePortfolio] = useState(user?.portfolio_url || '');
  const [profileSkills, setProfileSkills] = useState(user?.skills?.join(', ') || '');
  const [profileAvailability, setProfileAvailability] = useState(user?.availability || 'available');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');

  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Sync state with user prop when it changes or modal opens
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfileBio(user.bio || '');
      setProfileProfession(user.profession || '');
      setProfileHeadline(user.headline || '');
      setProfileCompany(user.company || '');
      setProfileEducation(user.education || '');
      setProfilePortfolio(user.portfolio_url || '');
      setProfileSkills(user.skills?.join(', ') || '');
      setProfileAvailability(user.availability || 'available');
      setProfilePhoto(user.profile_photo || '');
    }
  }, [user, open]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load persisted settings
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed.notifications ?? true);
      setSound(parsed.sound ?? true);
      setDarkMode(parsed.darkMode ?? false);
      setLanguage(parsed.language ?? 'English');
      setThemeColor(parsed.themeColor ?? 'blue');
      setDisappearingMessages(parsed.disappearingMessages ?? false);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const persistSettings = async (updates: any) => {
    const current = { notifications, sound, darkMode, language, themeColor, disappearingMessages, ...updates };
    await updateUserSettings(current);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      onOpenChange(false);
      if (onLogout) onLogout();
      else window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    const skillsArray = profileSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const updates: Partial<User> = {
      name: profileName,
      username: profileUsername,
      bio: profileBio,
      profession: profileProfession,
      headline: profileHeadline,
      company: profileCompany,
      education: profileEducation,
      portfolio_url: profilePortfolio,
      skills: skillsArray,
      availability: profileAvailability,
      profile_photo: profilePhoto
    };

    const success = await updateUserProfile(updates);
    
    if (success && onUserUpdate) {
      onUserUpdate({
        ...user,
        ...updates
      });
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadProfileImage(file);
      if (publicUrl) {
        setProfilePhoto(publicUrl);
        // Automatically save the new photo URL to profile
        const success = await updateUserProfile({ profile_photo: publicUrl });
        if (success && onUserUpdate) {
          onUserUpdate({ ...user, profile_photo: publicUrl });
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const categories = [
    { id: 'general', icon: Monitor, title: 'General', desc: 'Startup, language and window' },
    { id: 'profile', icon: UserIcon, title: 'Profile', desc: 'Name, bio and profile photo' },
    { id: 'account', icon: Lock, title: 'Account', desc: 'Security, email and account info' },
    { id: 'privacy', icon: Shield, title: 'Privacy', desc: 'Blocked contacts, disappearing messages' },
    { id: 'chats', icon: MessageSquare, title: 'Chats', desc: 'Theme, wallpaper and chat settings' },
    { id: 'video', icon: Video, title: 'Video & voice', desc: 'Camera, microphone and speakers' },
    { id: 'notifications', icon: Bell, title: 'Notifications', desc: 'Messages, groups and sounds' },
    { id: 'shortcuts', icon: Keyboard, title: 'Keyboard shortcuts', desc: 'Quick actions and navigation' },
    { id: 'help', icon: HelpCircle, title: 'Help and feedback', desc: 'Help centre, contact us, privacy policy' },
  ];

  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    if (isMobile) setShowDetail(true);
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">App Behavior</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <Label className="text-[14px] font-bold text-slate-900">Start on Login</Label>
                    <p className="text-[11px] text-slate-500">Open Harf automatically</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <Label className="text-[14px] font-bold text-slate-900">Language</Label>
                    <p className="text-[11px] text-slate-500">Currently {language}</p>
                  </div>
                  <Select value={language} onValueChange={(val) => { setLanguage(val); persistSettings({ language: val }); }}>
                    <SelectTrigger className="w-32 h-9 text-xs font-bold border-none bg-white shadow-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Español</SelectItem>
                      <SelectItem value="French">Français</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
             <div className="flex flex-col items-center gap-4 p-8 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                    <AvatarImage src={profilePhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=harf'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-2xl font-black">
                      {getInitials(profileName)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900">{profileName || 'User'}</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{profileProfession || 'Professional'}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</Label>
                  <Input 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Username</Label>
                  <Input 
                    value={profileUsername} 
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Profession</Label>
                  <Input 
                    value={profileProfession} 
                    onChange={(e) => setProfileProfession(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Headline</Label>
                  <Input 
                    value={profileHeadline} 
                    onChange={(e) => setProfileHeadline(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Current Company</Label>
                  <Input 
                    value={profileCompany} 
                    onChange={(e) => setProfileCompany(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Education</Label>
                  <Input 
                    value={profileEducation} 
                    onChange={(e) => setProfileEducation(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Availability</Label>
                  <Select value={profileAvailability} onValueChange={setProfileAvailability}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">🟢 Available for Work</SelectItem>
                      <SelectItem value="busy">🔴 Busy / Not Looking</SelectItem>
                      <SelectItem value="hiring">🟡 Hiring Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Portfolio URL</Label>
                  <Input 
                    value={profilePortfolio} 
                    onChange={(e) => setProfilePortfolio(e.target.value)}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                  />
                </div>
             </div>

             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Skills (Comma separated)</Label>
                <Input 
                  value={profileSkills} 
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js..."
                  className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus:ring-blue-600 text-sm font-bold" 
                />
             </div>

             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bio / About</Label>
                <textarea 
                  value={profileBio} 
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50/30 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium resize-none transition-all"
                  placeholder="Tell us about yourself..."
                />
             </div>

             <Button 
                onClick={handleProfileSave} 
                disabled={saving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] mt-4"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Update Profile</span>
                  </div>
                )}
             </Button>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Account Details</h4>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Registered Email</p>
                  <p className="text-sm font-bold text-slate-900">{user?.email}</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Joined Harf</p>
                  <p className="text-sm font-bold text-slate-900">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Security</h4>
              <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 text-slate-900 font-bold hover:bg-slate-50">
                Change Password
              </Button>
            </section>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-3">
               <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <Label className="text-[14px] font-bold text-slate-900">Disappearing Messages</Label>
                    <p className="text-[11px] text-slate-500">Auto-delete after 24h</p>
                  </div>
                  <Switch checked={disappearingMessages} onCheckedChange={(val) => { setDisappearingMessages(val); persistSettings({ disappearingMessages: val }); }} />
               </div>
               <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-100">
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-slate-900">Blocked Contacts</p>
                    <p className="text-[11px] text-slate-500">Manage blocked users</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
               </Button>
             </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
               <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <Label className="text-[14px] font-bold text-slate-900">Push Notifications</Label>
                    <p className="text-[11px] text-slate-500">Get alerts for new activity</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={(val) => { setNotifications(val); persistSettings({ notifications: val }); }} />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <Label className="text-[14px] font-bold text-slate-900">Message Sounds</Label>
                    <p className="text-[11px] text-slate-500">Play audio for alerts</p>
                  </div>
                  <Switch checked={sound} onCheckedChange={(val) => { setSound(val); persistSettings({ sound: val }); }} />
               </div>
            </div>
          </div>
        );
      case 'chats':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <section className="space-y-4">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Theme & Appearance</h4>
               <div className="grid grid-cols-4 gap-3">
                  {['blue', 'indigo', 'slate', 'emerald'].map((color) => (
                    <button 
                      key={color}
                      onClick={() => { setThemeColor(color); persistSettings({ themeColor: color }); }}
                      className={`h-12 rounded-xl border-2 transition-all ${themeColor === color ? 'border-blue-600 scale-95' : 'border-slate-50 hover:border-slate-200'}`}
                    >
                      <div className={`w-full h-full rounded-[10px] bg-${color === 'blue' ? 'blue-600' : color === 'indigo' ? 'indigo-600' : color === 'slate' ? 'slate-600' : 'emerald-600'} flex items-center justify-center`}>
                        {themeColor === color && <Check className="w-5 h-5 text-white" />}
                      </div>
                    </button>
                  ))}
               </div>
             </section>
             <section className="space-y-4">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chat Wallpaper</h4>
               <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 text-slate-900 font-bold">
                 Choose Wallpaper
               </Button>
             </section>
          </div>
        );
      case 'shortcuts':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-2">
                {[
                  { key: 'Cmd + K', desc: 'Search users' },
                  { key: 'Cmd + N', desc: 'New message' },
                  { key: 'Cmd + S', desc: 'Settings' },
                  { key: 'Esc', desc: 'Close window' }
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                    <span className="text-xs font-medium text-slate-600">{s.desc}</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-black shadow-sm text-slate-900">{s.key}</kbd>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
             <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl hover:bg-slate-50 group">
                <span className="text-sm font-bold text-slate-900">Privacy Policy</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
             </Button>
             <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl hover:bg-slate-50 group">
                <span className="text-sm font-bold text-slate-900">Terms of Service</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
             </Button>
             <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl hover:bg-slate-50 group">
                <span className="text-sm font-bold text-slate-900">Contact Support</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
             </Button>
             <div className="pt-8 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">Harf v1.0.0</p>
                <p className="text-[10px] text-slate-300 mt-1">© 2026 Harf Job Ecosystem</p>
             </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Coming Soon</h3>
            <p className="text-[12px] text-slate-500 mt-2 max-w-[200px]">We are fine-tuning this section for a premium experience.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) setShowDetail(false); }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl md:rounded-[2rem] h-[90vh] h-[90dvh] md:h-[650px] flex flex-col md:flex-row">
        <div className="flex h-full w-full relative">
          {/* Sidebar - Visible if not mobile or if not showing detail on mobile */}
          <div className={`w-full md:w-[320px] border-r border-slate-50 flex flex-col bg-slate-50/40 backdrop-blur-3xl transition-all duration-300 ${isMobile && showDetail ? 'hidden' : 'flex'}`}>
            <div className="p-6 pb-4">
              <h2 className="text-xl font-black text-slate-900 mb-5 tracking-tight">Settings</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 h-10 bg-white/80 border-slate-100 rounded-xl focus:ring-blue-600 shadow-sm text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5 min-h-0">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${activeCategory === cat.id ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'hover:bg-white/50'}`}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-300 ${activeCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-[13px] font-bold truncate ${activeCategory === cat.id ? 'text-slate-900' : 'text-slate-600'}`}>{cat.title}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 font-medium">{cat.desc}</p>
                    </div>
                    {isMobile && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                  </button>
                );
              })}

              <div className="pt-4 px-2">
                <Separator className="bg-slate-100/60" />
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group hover:bg-red-50 text-red-500 mt-2"
              >
                <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold">Log out</p>
                  <p className="text-[10px] text-red-300 font-medium">End session</p>
                </div>
              </button>
            </div>
          </div>

          {/* Main Content - Visible if not mobile or if showing detail on mobile */}
          <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${isMobile && !showDetail ? 'hidden' : 'flex'}`}>
             <div className="h-16 border-b border-slate-50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setShowDetail(false)} className="rounded-full hover:bg-slate-50">
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </Button>
                  )}
                  <h3 className="text-base font-black text-slate-900">
                    {categories.find(c => c.id === activeCategory)?.title}
                  </h3>
                </div>
                {saving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
                {renderContent()}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}