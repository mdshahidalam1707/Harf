import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfileProps {
  userId: string;
}

export function Profile({ userId }: ProfileProps) {
  const [profession, setProfession] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const skillsArray = skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('users')
        .update({
          bio: bio.trim(),
          profession: profession.trim(),
          skills: skillsArray,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile');
      } else {
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div>
        <label>Profession</label>
        <input
          type="text"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          placeholder="Enter your profession"
        />
      </div>

      <div>
        <label>Skills (comma separated)</label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g. React, Node.js, TypeScript"
        />
      </div>

      <div>
        <label>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
        />
      </div>

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
