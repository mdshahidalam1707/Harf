import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X, Briefcase, DollarSign, MapPin, Globe, CheckCircle2, Upload, FileCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PostJobModal({ isOpen, onClose, onPost }: { isOpen: boolean, onClose: () => void, onPost: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    location: '',
    salary_range: '',
    type: 'full-time',
    work_mode: 'remote',
    skills_required: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = () => {
    if (skillInput && !formData.skills_required.includes(skillInput)) {
      setFormData({ ...formData, skills_required: [...formData.skills_required, skillInput] });
      setSkillInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-blue-600 text-white p-8">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" /> Post a New Opportunity
          </DialogTitle>
          <p className="text-blue-100/80 font-medium">Find the perfect professional for your team.</p>
        </DialogHeader>
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Job Title</Label>
              <Input 
                placeholder="e.g. Senior Product Designer" 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Company Name</Label>
              <Input 
                placeholder="e.g. Acme Corp" 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Job Description</Label>
            <Textarea 
              placeholder="Describe the role and responsibilities..." 
              className="rounded-xl border-gray-100 bg-gray-50 min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="font-bold text-gray-700">Work Mode</Label>
              <Select value={formData.work_mode} onValueChange={(v) => setFormData({...formData, work_mode: v})}>
                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Location</Label>
              <Input 
                placeholder="e.g. San Francisco, CA" 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Required Skills</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Add a skill..." 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <Button onClick={handleAddSkill} className="rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills_required.map(skill => (
                <Badge key={skill} className="bg-gray-100 text-gray-600 border-none px-3 py-1 rounded-lg flex items-center gap-1">
                  {skill} <X className="w-3 h-3 cursor-pointer" onClick={() => setFormData({...formData, skills_required: formData.skills_required.filter(s => s !== skill)})} />
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button onClick={() => onPost(formData)} className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8">Publish Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateServiceModal({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    base_price: '',
    delivery_time: '',
    thumbnail_url: ''
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-indigo-600 text-white p-8">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" /> Create a Professional Service
          </DialogTitle>
          <p className="text-indigo-100/80 font-medium">Market your expertise to the community.</p>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Service Title</Label>
            <Input 
              placeholder="e.g. I will design a modern SaaS landing page" 
              className="rounded-xl border-gray-100 bg-gray-50"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="font-bold text-gray-700">Starting Price ($)</Label>
              <Input 
                type="number"
                placeholder="50" 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Delivery Time</Label>
              <Input 
                placeholder="e.g. 3 Days" 
                className="rounded-xl border-gray-100 bg-gray-50"
                value={formData.delivery_time}
                onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Thumbnail Image URL</Label>
            <Input 
              placeholder="https://..." 
              className="rounded-xl border-gray-100 bg-gray-50"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Service Description</Label>
            <Textarea 
              placeholder="What exactly will you provide?" 
              className="rounded-xl border-gray-100 bg-gray-50 min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button onClick={() => onCreate(formData)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8">Create Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApplyJobModal({ isOpen, onClose, job, onApply }: { isOpen: boolean, onClose: () => void, job: any, onApply: (data: any) => void }) {
  const [formData, setFormData] = useState({
    resume_url: '',
    cover_letter: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!job) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      setFormData({ ...formData, resume_url: publicUrl });
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-emerald-600 text-white p-8">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Apply for {job.title}
          </DialogTitle>
          <p className="text-emerald-100/80 font-medium">{job.company_name} • {job.location}</p>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <Label className="font-bold text-gray-700">Upload Resume (PDF)</Label>
            <div className="relative">
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label 
                htmlFor="resume-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  uploadSuccess ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-bold text-gray-500">Uploading...</p>
                  </div>
                ) : uploadSuccess ? (
                  <div className="flex flex-col items-center gap-2 text-emerald-600">
                    <FileCheck className="w-8 h-8" />
                    <p className="text-sm font-bold">Resume Uploaded Successfully!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="w-8 h-8" />
                    <p className="text-sm font-bold">Click to upload from device</p>
                    <p className="text-xs">PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
            {formData.resume_url && (
              <p className="text-[10px] text-gray-400 truncate mt-1">File link: {formData.resume_url}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Why are you a good fit?</Label>
            <Textarea 
              placeholder="Tell the recruiter about your experience..." 
              className="rounded-xl border-gray-100 bg-gray-50 min-h-[120px]"
              value={formData.cover_letter}
              onChange={(e) => setFormData({...formData, cover_letter: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            onClick={() => onApply(formData)} 
            disabled={!formData.resume_url || uploading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
