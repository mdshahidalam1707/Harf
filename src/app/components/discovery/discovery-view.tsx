import React, { useState } from 'react';
import { User, Post } from '@/lib/supabase';
import { useSearch } from '../../hooks/use-search';
import { useDiscovery } from '../../hooks/use-discovery';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, TrendingUp, Users, Loader2, Filter, Grid, List as ListIcon, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface DiscoveryViewProps {
  currentUser: User;
  onViewProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export function DiscoveryView({ currentUser, onViewProfile, onStartChat }: DiscoveryViewProps) {
  const search = useSearch('users');
  const discovery = useDiscovery(currentUser.id);
  const [activeView, setActiveView] = useState<'discovery' | 'search'>('discovery');

  const POPULAR_PROFESSIONS = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'Marketing', 'Sales'];
  const POPULAR_COMPANIES = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix'];
  const POPULAR_SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'UI/UX', 'Project Management', 'AWS', 'SQL'];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    search.setQuery(e.target.value);
    if (e.target.value && activeView !== 'search') {
      setActiveView('search');
    } else if (!e.target.value && activeView === 'search') {
      setActiveView('discovery');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search people by name, skill, or company..." 
              className="pl-12 py-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 text-lg shadow-inner"
              value={search.query}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl px-4 h-12 border-gray-200">
                  <Filter className="w-4 h-4 mr-2" /> 
                  Filters
                  {Object.keys(search.filters).length > 0 && (
                    <Badge className="ml-2 bg-blue-600 text-white border-none">{Object.keys(search.filters).length}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] rounded-l-3xl border-none shadow-2xl">
                <SheetHeader className="pb-6 border-b border-gray-100">
                  <SheetTitle className="text-2xl font-extrabold text-gray-900">Search Filters</SheetTitle>
                </SheetHeader>
                
                <div className="py-8 space-y-8">
                  {search.type === 'users' ? (
                    <>
                      <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Profession</Label>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_PROFESSIONS.map(prof => (
                            <Badge 
                              key={prof}
                              onClick={() => search.setFilters(prev => ({ ...prev, profession: prev.profession === prof ? '' : prof }))}
                              className={`cursor-pointer px-4 py-2 rounded-xl border-none transition-all ${search.filters.profession === prof ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {prof}
                            </Badge>
                          ))}
                        </div>
                        <Input 
                          placeholder="Or type custom profession..." 
                          value={search.filters.profession || ''}
                          onChange={(e) => search.setFilters(prev => ({ ...prev, profession: e.target.value }))}
                          className="rounded-xl bg-gray-50 border-none h-11"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Company</Label>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_COMPANIES.map(company => (
                            <Badge 
                              key={company}
                              onClick={() => search.setFilters(prev => ({ ...prev, company: prev.company === company ? '' : company }))}
                              className={`cursor-pointer px-4 py-2 rounded-xl border-none transition-all ${search.filters.company === company ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {company}
                            </Badge>
                          ))}
                        </div>
                        <Input 
                          placeholder="Or type custom company..." 
                          value={search.filters.company || ''}
                          onChange={(e) => search.setFilters(prev => ({ ...prev, company: e.target.value }))}
                          className="rounded-xl bg-gray-50 border-none h-11"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Skills</Label>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_SKILLS.map(skill => (
                            <Badge 
                              key={skill}
                              onClick={() => {
                                const currentSkills = search.filters.skills || [];
                                const newSkills = currentSkills.includes(skill) 
                                  ? currentSkills.filter(s => s !== skill)
                                  : [...currentSkills, skill];
                                search.setFilters(prev => ({ ...prev, skills: newSkills }));
                              }}
                              className={`cursor-pointer px-4 py-2 rounded-xl border-none transition-all ${search.filters.skills?.includes(skill) ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Input 
                          placeholder="Type and enter for custom skill..." 
                          value={search.filters.skills?.join(', ') || ''}
                          onChange={(e) => search.setFilters(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                          className="rounded-xl bg-gray-50 border-none h-11"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Timeframe</Label>
                      <Select 
                        value={search.filters.timeframe || 'all'} 
                        onValueChange={(v) => search.setFilters(prev => ({ ...prev, timeframe: v as any }))}
                      >
                        <SelectTrigger className="rounded-xl bg-gray-50 border-none h-11">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="all">Any time</SelectItem>
                          <SelectItem value="today">Past 24 hours</SelectItem>
                          <SelectItem value="week">Past week</SelectItem>
                          <SelectItem value="month">Past month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-bold border-gray-200"
                    onClick={() => search.setFilters({})}
                  >
                    Reset
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700"
                    onClick={() => {}} // Sheet closes on outside click or trigger
                  >
                    Apply
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {activeView === 'discovery' ? (
            <div className="space-y-12">
              {/* Suggested Users */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">Recommended for you</h2>
                      <p className="text-sm text-gray-500 font-medium">Based on your skills and network</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-bold">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {discovery.loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100 shadow-sm" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {discovery.suggestedUsers.map(user => (
                      <div key={user.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <Avatar className="w-16 h-16 mb-4 border-2 border-white shadow-sm cursor-pointer" onClick={() => onViewProfile(user.id)}>
                          <AvatarImage src={user.profile_photo} />
                          <AvatarFallback className="bg-blue-600 text-white font-bold">
                            {user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-gray-900 truncate hover:text-blue-600 cursor-pointer" onClick={() => onViewProfile(user.id)}>
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 truncate">{user.headline || user.profession || 'Professional'}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {user.skills?.slice(0, 2).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] bg-gray-50 text-gray-600 border-none font-medium">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          onClick={() => onViewProfile(user.id)}
                          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 shadow-sm"
                        >
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Trending Posts */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Trending Now</h2>
                    <p className="text-sm text-gray-500 font-medium">Most engaging discussions on Harf</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {discovery.trendingPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <p className="text-gray-800 line-clamp-3 mb-4 font-medium italic leading-relaxed">"{post.content}"</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={post.user?.profile_photo} />
                            <AvatarFallback className="bg-gray-200 text-xs">U</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-gray-600">{post.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                           <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-orange-500" /> Trending</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <Tabs value={search.type} onValueChange={(v) => search.setType(v as any)} className="w-full">
              <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm mb-8 w-fit">
                <TabsTrigger value="users" className="rounded-xl px-8 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">People</TabsTrigger>
                <TabsTrigger value="posts" className="rounded-xl px-8 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-0">
                {search.loading && search.results.length === 0 ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  </div>
                ) : search.results.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500">We couldn't find any people matching "{search.query}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {search.results.map(user => (
                      <div key={user.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-full bg-blue-50 text-blue-600 h-10 w-10">
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="flex gap-4 mb-6">
                          <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                            <AvatarImage src={user.profile_photo} />
                            <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{user.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 pt-2">
                            <h3 className="text-lg font-extrabold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{user.name}</h3>
                            <p className="text-blue-600 font-bold text-xs mb-1 uppercase tracking-wider">{user.profession || 'Professional'}</p>
                            <p className="text-gray-500 text-xs truncate">{user.headline || 'Member since 2024'}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex flex-wrap gap-2">
                             {user.skills?.slice(0, 3).map((skill: string, i: number) => (
                               <Badge key={i} className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-none px-3 py-1 text-xs rounded-lg">{skill}</Badge>
                             ))}
                           </div>
                           <div className="flex gap-2 pt-4">
                              <Button 
                                onClick={() => onViewProfile(user.id)}
                                className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold h-11"
                              >
                                View Profile
                              </Button>
                              <Button 
                                onClick={() => onStartChat(user.id)}
                                variant="outline" 
                                className="rounded-2xl border-gray-200 font-bold h-11"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {search.hasMore && (
                  <div className="flex justify-center mt-12 pb-12">
                    <Button 
                      onClick={search.loadMore} 
                      disabled={search.loading}
                      className="rounded-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-10 h-12 font-bold shadow-sm"
                    >
                      {search.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More Results'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts">
                {/* Posts results list... similar to users but for posts */}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

import { Plus, MessageCircle } from 'lucide-react';
