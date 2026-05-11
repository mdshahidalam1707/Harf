import React from 'react';
import { Notification } from '../../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Heart, MessageSquare, UserPlus, CheckCircle, Bell, Trash2, PhoneMissed, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onMarkRead, onDelete, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'connection_request': return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'connection_accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'missed_call': return <PhoneMissed className="w-4 h-4 text-red-600" />;
      case 'job_application': return <Briefcase className="w-4 h-4 text-emerald-500" />;
      case 'application_update': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMessage = () => {
    const senderName = (notification as any).sender?.name || 'Someone';
    switch (notification.type) {
      case 'like': return <span><strong>{senderName}</strong> liked your post.</span>;
      case 'comment': return <span><strong>{senderName}</strong> commented on your post.</span>;
      case 'connection_request': return <span><strong>{senderName}</strong> sent you a connection request.</span>;
      case 'connection_accepted': return <span><strong>{senderName}</strong> accepted your connection request.</span>;
      case 'message': return <span><strong>{senderName}</strong> sent you a message.</span>;
      case 'follow': return <span><strong>{senderName}</strong> started following you.</span>;
      case 'missed_call': return <span>You missed a call from <strong>{senderName}</strong>.</span>;
      case 'job_application': return <span><strong>{senderName}</strong> {notification.data?.message || 'applied for your job'}: <strong>{notification.data?.job_title}</strong></span>;
      case 'application_update': return <span>{notification.data?.message || 'Your application status was updated'}.</span>;
      default: return <span>New activity from <strong>{senderName}</strong>.</span>;
    }
  };

  return (
    <div 
      className={`group flex items-start gap-3 p-4 border-b border-gray-50 transition-colors cursor-pointer ${notification.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
      onClick={() => {
        if (!notification.is_read) onMarkRead(notification.id);
        if (onClick) onClick(notification);
      }}
    >
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={(notification as any).sender?.profile_photo} />
          <AvatarFallback className="bg-gray-200 text-gray-600">
            {(notification as any).sender?.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
          {getIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 leading-tight">
          {getMessage()}
        </div>
        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          {!notification.is_read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
        </div>
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
