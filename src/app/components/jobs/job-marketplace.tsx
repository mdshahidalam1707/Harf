import React, { useState } from 'react';
import { User } from '@/lib/supabase';
import { useJobs, useRecruiterDashboard, Job, JobApplication } from '../../hooks/use-jobs';
import { useFreelance, FreelanceService } from '../../hooks/use-freelance';
import { PostJobModal, CreateServiceModal, ApplyJobModal } from './marketplace-modals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Star,
  Zap,
  ArrowRight,
  ChevronRight,
  Building2,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';

export function JobMarketplace({ currentUser }: { currentUser: User }) {
  const [activeMode, setActiveMode] = useState<'jobs' | 'freelance' | 'recruiter' | 'my-apps'>('jobs');
  const [showPostJob, setShowPostJob] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const { jobs, myApplications, loading: jobsLoading, postJob, applyToJob } = useJobs(currentUser.id);
  const { services, loading: servicesLoading, createService } = useFreelance(currentUser.id);
  const recruiter = useRecruiterDashboard(currentUser.id);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto overflow-x-hidden">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-8 md:p-12 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Badge className="bg-white/20 text-white border-none py-1 px-3 backdrop-blur-sm">
              <Zap className="w-3 h-3 mr-1 text-yellow-300 fill-yellow-300" /> Professional Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Scale Your Career <br />
              <span className="text-blue-100">With Harf.</span>
            </h1>
            <p className="text-blue-50/80 max-w-md font-medium text-lg">
              Find premium job opportunities or offer your professional services to the community.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setShowPostJob(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 rounded-2xl text-lg shadow-xl"
            >
              Post an Opportunity
            </Button>
            <p className="text-center text-xs text-blue-100/60">Trusted by 10k+ professionals</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 -mt-8">
        <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="space-y-8">
          <div className="bg-white p-1 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="bg-transparent border-none p-0 h-auto flex gap-1 w-max">
                <TabsTrigger 
                  value="jobs" 
                  className="rounded-2xl px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all flex-shrink-0 whitespace-nowrap min-w-max"
                >
                  Find Jobs
                </TabsTrigger>
                <TabsTrigger 
                  value="my-apps" 
                  className="rounded-2xl px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all flex-shrink-0 whitespace-nowrap min-w-max"
                >
                  My Applications
                </TabsTrigger>
                <TabsTrigger 
                  value="freelance" 
                  className="rounded-2xl px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all flex-shrink-0 whitespace-nowrap min-w-max"
                >
                  Freelance Services
                </TabsTrigger>
                <TabsTrigger 
                  value="recruiter" 
                  className="rounded-2xl px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all flex-shrink-0 whitespace-nowrap min-w-max"
                >
                  Recruiter Dashboard
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="relative group px-2 md:max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search titles, skills, or companies..." 
              className="pl-12 pr-4 py-6 rounded-2xl bg-white border-gray-100 focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Skill Filter Bar */}
          <div className="px-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 w-max">
              <Button 
                variant={selectedSkill === null ? 'default' : 'outline'}
                onClick={() => setSelectedSkill(null)}
                className="rounded-xl px-4 py-1 h-9 font-bold text-xs flex-shrink-0"
              >
                All Skills
              </Button>
              {Array.from(new Set(jobs.flatMap(j => j.skills_required || []))).map(skill => (
                <Button 
                  key={skill}
                  variant={selectedSkill === skill ? 'default' : 'outline'}
                  onClick={() => setSelectedSkill(skill)}
                  className={`rounded-xl px-4 py-1 h-9 font-bold text-xs flex-shrink-0 ${
                    selectedSkill === skill ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {skill}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Postings Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                Latest Opportunities <Badge variant="secondary" className="bg-blue-100 text-blue-700">{jobs.length}</Badge>
              </h2>
              <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">
                Filter by Skill <Filter className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobsLoading ? (
                [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse shadow-sm border border-gray-50" />)
              ) : (
                jobs
                  .filter(job => {
                    const matchesSearch = !searchQuery || 
                      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      job.skills_required?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                    const matchesSkill = !selectedSkill || job.skills_required?.includes(selectedSkill);
                    
                    return matchesSearch && matchesSkill;
                  })
                  .map(job => (
                  <Card key={job.id} className="group relative overflow-hidden rounded-3xl border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100 shadow-inner">
                          {job.company_logo ? (
                            <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold uppercase tracking-wider text-[10px] py-1 px-2">
                          {job.type}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{job.title}</h3>
                        <p className="text-gray-500 text-sm font-medium flex items-center gap-1">
                          {job.company_name} • {job.location}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.skills_required?.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-600 border-none font-medium text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="text-blue-600 font-extrabold text-lg">
                          {job.salary_range || 'Competitive'}
                        </div>
                        <Button 
                          onClick={() => setApplyingJob(job)}
                          className="rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                        >
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="my-apps" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-gray-900">Applied Jobs</h2>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{myApplications.length} Total</Badge>
            </div>

            <div className="space-y-4">
              {myApplications.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">You haven't applied to any jobs yet.</p>
                </div>
              ) : (
                myApplications.map(app => (
                  <Card key={app.id} className="rounded-3xl border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                            <Building2 className="w-6 h-6 text-gray-400" />
                         </div>
                         <div>
                            <h3 className="font-bold text-gray-900">{app.job?.title}</h3>
                            <p className="text-xs text-gray-400">{app.job?.company_name} • Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <Badge className={`border-none font-bold text-[10px] px-3 py-1.5 rounded-xl ${
                        app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600' :
                        app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {app.status.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Freelance Services Tab */}
          <TabsContent value="freelance" className="space-y-6">
             <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                Freelance Experts <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{services.length}</Badge>
              </h2>
              <Button 
                onClick={() => setShowCreateService(true)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-6"
              >
                Create Service <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesLoading ? (
                [1,2,3,4].map(i => <div key={i} className="h-80 bg-white rounded-3xl animate-pulse shadow-sm border border-gray-50" />)
              ) : (
                services.map(service => (
                  <Card key={service.id} className="overflow-hidden rounded-3xl border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      <img src={service.thumbnail_url || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=60'} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-3 right-3">
                         <Badge className="bg-white/90 text-gray-900 border-none backdrop-blur-sm font-bold flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {service.rating}
                         </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 ring-2 ring-white">
                          <AvatarImage src={service.freelancer?.profile_photo} />
                          <AvatarFallback className="bg-indigo-600 text-white text-[10px]">{service.freelancer?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{service.freelancer?.name}</p>
                          <p className="text-[10px] text-gray-400 truncate uppercase tracking-tighter">{service.freelancer?.profession}</p>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="text-xs text-gray-400 font-medium">Starting at</div>
                        <div className="text-lg font-extrabold text-blue-600">${service.base_price}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Recruiter Dashboard Tab */}
          <TabsContent value="recruiter" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-3xl shadow-lg">
                  <CardContent className="p-8 space-y-2">
                    <p className="text-blue-100 font-bold uppercase tracking-wider text-xs">Total Postings</p>
                    <h3 className="text-4xl font-extrabold">{recruiter.myJobs.length}</h3>
                  </CardContent>
               </Card>
               <Card className="bg-white border-gray-100 rounded-3xl shadow-sm">
                  <CardContent className="p-8 space-y-2">
                    <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Total Applications</p>
                    <h3 className="text-4xl font-extrabold text-gray-900">{recruiter.applications.length}</h3>
                  </CardContent>
               </Card>
               <Card className="bg-white border-gray-100 rounded-3xl shadow-sm">
                  <CardContent className="p-8 space-y-2">
                    <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Shortlisted</p>
                    <h3 className="text-4xl font-extrabold text-emerald-600">
                      {recruiter.applications.filter(a => a.status === 'shortlisted').length}
                    </h3>
                  </CardContent>
               </Card>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-lg font-extrabold text-gray-900">Incoming Applications</h3>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white">Export CVs <FileText className="w-4 h-4 ml-2" /></Button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                        <th className="px-6 py-4">Applicant</th>
                        <th className="px-6 py-4">Job Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {recruiter.applications.map(app => (
                       <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 rounded-xl">
                                <AvatarImage src={app.applicant?.profile_photo} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{app.applicant?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{app.applicant?.name}</p>
                                <p className="text-xs text-gray-400 font-medium">{app.applicant?.profession}</p>
                              </div>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-sm font-bold text-gray-600">{app.job?.title}</td>
                         <td className="px-6 py-5">
                           <Badge className={`border-none font-bold text-[10px] px-2 py-1 rounded-lg ${
                             app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600' :
                             app.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                             'bg-gray-50 text-gray-500'
                           }`}>
                             {app.status}
                           </Badge>
                         </td>
                         <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="rounded-xl font-bold h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                 onClick={() => recruiter.updateApplicationStatus(app.id, 'shortlisted')}
                               >
                                 Shortlist
                               </Button>
                               <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-gray-400 hover:text-blue-600"><ChevronRight className="w-5 h-5" /></Button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PostJobModal 
        isOpen={showPostJob} 
        onClose={() => setShowPostJob(false)} 
        onPost={async (data) => {
          await postJob(data);
          setShowPostJob(false);
          recruiter.refresh();
        }} 
      />

      <CreateServiceModal 
        isOpen={showCreateService} 
        onClose={() => setShowCreateService(false)} 
        onCreate={async (data) => {
          await createService(data);
          setShowCreateService(false);
        }} 
      />

      <ApplyJobModal 
        isOpen={!!applyingJob}
        onClose={() => setApplyingJob(null)}
        job={applyingJob}
        onApply={async (data) => {
          if (applyingJob) {
            await applyToJob(applyingJob.id, data.resume_url, data.cover_letter);
            setApplyingJob(null);
          }
        }}
      />
    </div>
  );
}
