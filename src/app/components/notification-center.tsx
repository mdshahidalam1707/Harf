import React from 'react';
import { useNotifications } from '../hooks/use-notifications';
import { User } from '../../lib/supabase';
import { NotificationItem } from './notification-item';
import { Bell, MoreHorizontal, Check, Trash2, Settings } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface NotificationCenterProps {
  currentUser: User;
  onAction?: (type: string, data?: any) => void;
  onOpenSettings?: () => void;
}

export function NotificationCenter({ currentUser, onAction, onOpenSettings }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(currentUser);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative rounded-full w-10 h-10 p-0 hover:bg-white/20 transition-colors">
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-white border-2 text-[10px] h-5 min-w-[20px] flex items-center justify-center p-0.5 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white border-l border-gray-100 shadow-2xl">
        <SheetHeader className="p-6 border-b border-gray-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6" /> Notifications
            </SheetTitle>
            <div className="flex gap-2">
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-white hover:bg-white/20 text-xs font-bold"
              >
                <Check className="w-4 h-4 mr-1" /> Mark all read
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-blue-100/80 text-xs mt-1">You have {unreadCount} unread alerts</p>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-gray-400">Loading your alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-12">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-200">
                <Bell className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h4>
              <p className="text-sm text-gray-500 max-w-[240px]">We'll notify you here when you get new messages, job applications, or likes.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={(n) => onAction?.(n.type, n.data)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <Button 
            variant="outline" 
            className="w-full rounded-xl font-bold text-gray-600 border-gray-200 hover:bg-white hover:text-blue-600 transition-all"
            onClick={onOpenSettings}
          >
             <Settings className="w-4 h-4 mr-2" /> Notification Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
