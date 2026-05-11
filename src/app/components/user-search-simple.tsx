import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Search, MessageCircle, Briefcase, Star, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface UserSearchSimpleProps {
  onUserSelect: (userId: string) => void;
  currentUserId: string;
}

interface SimpleUser {
  id: string;
  name: string | null;
  username: string | null;
  profession: string | null;
  skills: string | null;
  availability: string | null;
  rating: number | null;
}

export function UserSearchSimple({ onUserSelect, currentUserId }: UserSearchSimpleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const debouncedSearch = useCallback(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, skillFilter, availabilityFilter]);

  // Load all users on mount
  useEffect(() => {
    loadAllUsers();
  }, [currentUserId]);

  // Search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || skillFilter || (availabilityFilter && availabilityFilter !== 'all')) {
        searchUsers();
      } else {
        loadAllUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, skillFilter, availabilityFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSkillFilter('');
    setAvailabilityFilter('all');
    loadAllUsers();
  };

const loadAllUsers = async () => {
    setLoading(true);
    console.log('Loading users, excluding:', currentUserId);
    
    try {
      // Use users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, name, profession, about, availability')
        .neq('id', currentUserId)
        .limit(50);

      if (!usersError && usersData && usersData.length > 0) {
        const mapped = usersData.map(u => ({
          id: u.id,
          username: u.username || u.name,
          name: u.name,
          profession: u.profession,
          skills: u.about,
          availability: u.availability,
          rating: null
        }));
        console.log('Users loaded:', mapped.length);
        setUsers(mapped);
      } else {
        console.log('No users found');
        setUsers([]);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    console.log('Searching:', { searchQuery, skillFilter, availabilityFilter });
    
    try {
      // Build base query - users table
      let query = supabase
        .from('users')
        .select('id, username, name, profession, about, availability')
        .neq('id', currentUserId)
        .limit(50);

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,profession.ilike.%${searchQuery}%`);
      }

      // Apply skill filter
      if (skillFilter.trim()) {
        query = query.or(`about.ilike.%${skillFilter}%`);
      }

      // Apply availability filter
      if (availabilityFilter && availabilityFilter !== 'all') {
        query = query.eq('availability', availabilityFilter);
      }

      const { data: usersData, error: usersError } = await query;

      if (!usersError && usersData && usersData.length > 0) {
        const mapped = usersData.map(u => ({
          id: u.id,
          username: u.username || u.name,
          name: u.name,
          profession: u.profession,
          skills: u.about,
          availability: u.availability,
          rating: null
        }));
        console.log('Users search result:', mapped.length);
        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (!name && !username) return '??';
    const n = name || username || '';
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const hasFilters = searchQuery.trim() || skillFilter.trim() || availabilityFilter !== 'all';

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Filter Row */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="flex-1 text-sm"
          />
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-[110px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="hiring">Hiring</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-gray-400 mt-2">Searching...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">
              {hasFilters ? 'No users found' : 'No other users available yet'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-500 hover:text-blue-700 mt-2 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onUserSelect(user.id)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {user.name || user.username || 'Unknown'}
                    </p>
                    {user.rating && user.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-medium">{user.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    {user.username && (
                      <span>@{user.username}</span>
                    )}
                    {user.profession && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {user.profession}
                      </span>
                    )}
                    {user.skills && (
                      <span className="text-blue-600 truncate max-w-[100px]" title={user.skills}>
                        {user.skills.length > 15 ? user.skills.slice(0, 15) + '...' : user.skills}
                      </span>
                    )}
                    {user.availability && user.availability !== 'all' && (
                      <span className={`
                        px-1 rounded text-[10px]
                        ${user.availability === 'available' ? 'bg-green-100 text-green-700' : ''}
                        ${user.availability === 'busy' ? 'bg-red-100 text-red-700' : ''}
                        ${user.availability === 'hiring' ? 'bg-blue-100 text-blue-700' : ''}
                      `}>
                        {user.availability}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" className="bg-blue-500">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}