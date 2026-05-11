import React, { useState } from 'react';
import { User, supabase } from '@/lib/supabase';
import { useCommunities, Community, useCommunityDetails } from '../../hooks/use-communities';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { 
  Users, 
  Plus, 
  Settings, 
  Info, 
  MessageSquare, 
  Shield, 
  Lock, 
  Globe, 
  Search, 
  ChevronRight,
  Pin,
  Loader2,
  MoreVertical,
  Flag,
  MoreHorizontal,
  ShieldAlert,
  UserMinus,
  Trash2,
  Crown,
  File,
  Download,
  UploadCloud,
  FileText,
  X,
  ArrowLeft
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { CreateCommunityModal } from './create-community-modal';

export function CommunityView({ currentUser }: { currentUser: User }) {
  const { communities, loading, createCommunity, deleteCommunity } = useCommunities(currentUser.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (selectedId) {
    return <CommunityDetailView 
      communityId={selectedId} 
      currentUser={currentUser} 
      onBack={() => setSelectedId(null)} 
    />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Communities</h1>
              <p className="text-sm text-gray-500 font-medium">Connect with professional circles</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Group
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-12 h-12 text-gray-200" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Join Your First Community</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">Explore professional groups to share knowledge and network with peers.</p>
              <Button variant="outline" className="rounded-xl px-8 h-12 font-bold border-gray-200">
                Explore Communities
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {communities.map(comm => (
                <div 
                  key={comm.id} 
                  onClick={() => setSelectedId(comm.id)}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    {comm.cover_url && <img src={comm.cover_url} className="w-full h-full object-cover opacity-50" />}
                    <div className="absolute -bottom-10 left-6">
                      <Avatar className="w-20 h-20 border-4 border-white shadow-xl rounded-2xl">
                        <AvatarImage src={comm.icon_url} />
                        <AvatarFallback className="bg-white text-blue-600 font-bold text-2xl">
                          {comm.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="pt-12 px-6 pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-extrabold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {comm.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">@{comm.slug}</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">
                        {comm.type === 'private' ? <Lock className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                        {comm.type}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                      {comm.description || "A professional community for growth and collaboration."}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                        <Users className="w-4 h-4" />
                        {comm.member_count} Members
                      </div>
                      <div className="flex items-center gap-2">
                        {comm.creator_id === currentUser.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('Are you sure you want to delete this community? This cannot be undone.')) {
                                deleteCommunity(comm.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateCommunityModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await createCommunity(data);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

function CommunityDetailView({ communityId, currentUser, onBack }: { communityId: string, currentUser: User, onBack: () => void }) {
  const { 
    community, 
    posts, 
    members, 
    files,
    loading, 
    addMember, 
    updateMemberRole, 
    kickMember,
    uploadFile,
    deleteFile 
  } = useCommunityDetails(communityId, currentUser.id);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'members' | 'files'>('feed');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddMember = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const { data: userToInvite, error: searchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', searchEmail)
        .single();

      if (searchError || !userToInvite) {
        alert("User not found with this email.");
        return;
      }

      await addMember(userToInvite.id);
      setSearchEmail('');
      setIsAddingMember(false);
    } catch (err) {
      alert("Error adding member. They might already be in the community.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto">
        <div className="h-64 bg-gray-900 relative">
          <Button 
            onClick={onBack}
            className="absolute top-6 left-6 z-20 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-none"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          {community.cover_url && <img src={community.cover_url} className="w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-10 left-10 flex items-end gap-6 z-10">
            <Avatar className="w-32 h-32 border-4 border-white shadow-2xl rounded-3xl">
              <AvatarImage src={community.icon_url} />
              <AvatarFallback className="bg-blue-600 text-white text-4xl font-bold">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-4 text-white">
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">{community.name}</h1>
              <p className="flex items-center gap-2 text-blue-100 font-medium">
                {community.type === 'private' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {community.type} Community • {community.member_count || 0} Members
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-2 px-10 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-8">
            {['feed', 'about', 'members', 'files'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl font-bold border-gray-200">
                <Search className="w-4 h-4 mr-2" /> Search
             </Button>
             <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold px-8">
                Share Link
             </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 p-10">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'feed' && (
              <div className="space-y-8">
                {/* Create Post Trigger */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={currentUser.profile_photo} />
                    <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" className="flex-1 justify-start text-gray-400 hover:bg-gray-50 rounded-2xl h-12 px-6 font-medium text-lg">
                    What's on your mind, {currentUser.name?.split(' ')[0]}?
                  </Button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No posts yet. Be the first to share something!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map(post => (
                      <div key={post.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        {/* Render existing post card content here */}
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <Avatar className="w-10 h-10">
                               <AvatarImage src={post.user?.profile_photo} />
                               <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div>
                               <p className="font-bold text-gray-900">{post.user?.name}</p>
                               <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                             </div>
                           </div>
                           {post.is_pinned && (
                             <Badge className="bg-orange-50 text-orange-600 border-none">
                               <Pin className="w-3 h-3 mr-1" /> Pinned
                             </Badge>
                           )}
                        </div>
                        <p className="text-gray-700 leading-relaxed font-medium">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-gray-900">Community Members</h3>
                  {community.creator_id === currentUser.id && (
                    <Button 
                      onClick={() => setIsAddingMember(!isAddingMember)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Member
                    </Button>
                  )}
                </div>

                {isAddingMember && (
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4 animate-in fade-in slide-in-from-top-4">
                    <Input 
                      placeholder="Enter user email..." 
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="rounded-xl bg-white border-none h-12 flex-1 shadow-sm"
                    />
                    <Button 
                      onClick={handleAddMember}
                      disabled={isSearching}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map(mem => (
                    <div key={mem.user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={mem.user.profile_photo} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                            {mem.user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-none mb-1">{mem.user.name}</p>
                          <p className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{mem.user.profession || 'Member'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`border-none font-bold text-[10px] uppercase px-3 ${mem.role === 'admin' ? 'bg-orange-50 text-orange-600' : mem.role === 'moderator' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {mem.role}
                        </Badge>

                        {/* Moderation Menu */}
                        {community.creator_id === currentUser.id && mem.user.id !== currentUser.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl w-48">
                              <DropdownMenuItem 
                                onClick={() => updateMemberRole(mem.user.id, mem.role === 'admin' ? 'member' : 'admin')}
                                className="font-bold text-sm py-3"
                              >
                                <Crown className="w-4 h-4 mr-2 text-orange-500" />
                                {mem.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateMemberRole(mem.user.id, mem.role === 'moderator' ? 'member' : 'moderator')}
                                className="font-bold text-sm py-3"
                              >
                                <ShieldAlert className="w-4 h-4 mr-2 text-purple-500" />
                                {mem.role === 'moderator' ? 'Demote to Member' : 'Make Moderator'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => kickMember(mem.user.id)}
                                className="font-bold text-sm py-3 text-red-600 focus:text-red-600"
                              >
                                <UserMinus className="w-4 h-4 mr-2" /> Kick from Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-8">
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" /> About Community
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-medium">{community.description || "No description provided."}</p>
                </section>
                <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" /> Community Rules
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-600 font-medium">
                    {community.rules || "Standard community guidelines apply. Be respectful and professional."}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-gray-900">Shared Files</h3>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-all">
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await uploadFile(file);
                        }
                      }} 
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {files.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                      <File className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No files shared yet.</p>
                    </div>
                  ) : (
                    files.map(file => (
                      <div key={file.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            {file.file_type?.includes('pdf') ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm truncate max-w-[200px] md:max-w-md">{file.file_name}</p>
                            <p className="text-xs text-gray-400 font-medium">
                              {(file.file_size / 1024 / 1024).toFixed(2)} MB • Shared by {file.uploader?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {(file.uploader_id === currentUser.id || community.creator_id === currentUser.id) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full hover:bg-red-50 hover:text-red-600"
                              onClick={() => deleteFile(file.id, file.file_url)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
               <h3 className="font-extrabold text-gray-900 mb-6 uppercase tracking-wider text-xs">Community Stats</h3>
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400 text-sm font-bold">Created</span>
                   <span className="text-gray-900 text-sm font-bold">{new Date(community.created_at).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400 text-sm font-bold">Visibility</span>
                   <Badge variant="outline" className="rounded-lg font-bold border-gray-200 capitalize">{community.type}</Badge>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400 text-sm font-bold">Topic</span>
                   <span className="text-gray-900 text-sm font-bold">Professional Networking</span>
                 </div>
               </div>
               <Button 
                 variant="outline" 
                 className="w-full mt-8 rounded-xl font-bold border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                 onClick={async () => {
                   // Import useCommunities here or pass leave function down
                   // For now, since it's a separate component, I'll use a direct supabase call or pass it
                   if (confirm('Are you sure you want to leave this community?')) {
                     await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', currentUser.id);
                     onBack();
                   }
                 }}
               >
                  Leave Community
               </Button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
               <Shield className="w-10 h-10 mb-4 opacity-50" />
               <h3 className="text-xl font-extrabold mb-2">Community Shield</h3>
               <p className="text-blue-100 text-sm font-medium mb-6">Our moderation tools help keep this space professional and productive.</p>
               <Button className="w-full rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-extrabold h-11 shadow-sm">
                  Report Issue
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
