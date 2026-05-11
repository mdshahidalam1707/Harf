import { useState } from 'react';
import { supabase, User, uploadProfileImage } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Loader2, Camera, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

interface ProfileModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate: (updatedUser: User) => void;
}

export function ProfileModal({ user, open, onOpenChange, onProfileUpdate }: ProfileModalProps) {
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState((user as any).username || '');
  const [status, setStatus] = useState(user.about || 'Hey there! I am using ChatConnect');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState(user.profile_photo || '');
  const [profession, setProfession] = useState((user as any).profession || '');
  const [skills, setSkills] = useState((user as any).skills?.join(', ') || '');
  const [bio, setBio] = useState((user as any).bio || '');
  const [availability, setAvailability] = useState((user as any).availability || 'available');
  const [headline, setHeadline] = useState((user as any).headline || '');
  const [company, setCompany] = useState((user as any).company || '');
  const [education, setEducation] = useState((user as any).education || '');
  const [portfolioUrl, setPortfolioUrl] = useState((user as any).portfolio_url || '');

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const publicUrl = await uploadProfileImage(selectedFile);
      if (publicUrl) {
        // Update the local profile photo state
        setProfilePhoto(publicUrl);
        // Update the user state with new profile photo
        const updatedUser = { ...user, profile_photo: publicUrl };
        onProfileUpdate(updatedUser);
        setSelectedFile(null);
        // Clear the input
        const fileInput = document.getElementById('profile-image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(authError.message);
      }

      if (!authUser) {
        console.error("No authenticated user found");
        throw new Error("Please login again");
      }

      console.log("Updating profile for user ID:", authUser.id);

      const skillsArray = skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      
      const bioValue = bio.trim() || "";
      const professionValue = profession.trim() || "";
      const skillsValue = Array.isArray(skillsArray) ? skillsArray : [];

      console.log("Using UPSERT for profile:", { bio: bioValue, profession: professionValue, skills: skillsValue, availability });
      
      const { error: usersTableError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          name: name.trim() || null,
          username: username.trim() || null,
          bio: bioValue,
          profession: professionValue,
          skills: skillsValue,
          availability: availability,
          headline: headline.trim() || null,
          company: company.trim() || null,
          education: education.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          email: authUser.email,
        }, {
          onConflict: 'id'
        });

      if (usersTableError) {
        console.error("Users table upsert error:", usersTableError);
        throw new Error(usersTableError.message || "Failed to update profile");
      }

      console.log("Profile updated successfully! Username:", username.trim());

      const updatedUser = {
        ...user,
        name: name.trim() || user.name,
        username: username.trim() || (user as any).username,
        profile_photo: profilePhoto || user.profile_photo,
        bio: bioValue,
        profession: professionValue,
        skills: skillsValue,
        availability: availability,
        headline: headline.trim() || null,
        company: company.trim() || null,
        education: education.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
      };
      
      onProfileUpdate(updatedUser);
      onOpenChange(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePhoto || user.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-image"
              />
              <Label htmlFor="profile-image">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Photo
                  </span>
                </Button>
              </Label>
              {selectedFile && (
                <Button
                  onClick={handleImageUpload}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (e.g., johndoe)"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              This username will be visible in search results
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border bg-gray-50"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Choose a status or write your own" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hey there! I am using ChatConnect">Hey there! I am using ChatConnect</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Busy">Busy</SelectItem>
                <SelectItem value="At work">At work</SelectItem>
                <SelectItem value="In a meeting">In a meeting</SelectItem>
                <SelectItem value="Sleeping">Sleeping</SelectItem>
                <SelectItem value="Battery about to die">Battery about to die</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              This status will be visible to your contacts
            </p>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="availability" className="text-sm font-medium">Availability</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">🟢 Available</SelectItem>
                <SelectItem value="busy">🔴 Busy</SelectItem>
                <SelectItem value="hiring">🟡 Hiring</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              This availability will be visible to other users
            </p>
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession" className="text-sm font-medium">Profession</Label>
            <Input
              id="profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Enter your profession"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills" className="text-sm font-medium">Skills (comma separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, TypeScript"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline" className="text-sm font-medium">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Software Engineer at Google"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your current company"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education" className="text-sm font-medium">Education</Label>
            <Input
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="University or Degree"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Portfolio Link */}
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="text-sm font-medium">Portfolio Link</Label>
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full py-2">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}