import { useState, useEffect } from 'react';
import { NotificationSettings } from './NotificationSettings';
import { Bell, Check, Trash2, Package, Star, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
    id: number;
    userId: number;
    type: 'order_placed' | 'status_update' | 'welcome' | 'admin_alert';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationCenter = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications'),
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30s
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => api.patch(`/notifications/${id}/read`, {}),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/read-all', {}),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'order_placed':
            case 'status_update':
                return <Package className="h-4 w-4 text-primary" />;
            case 'welcome':
                return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
            case 'admin_alert':
                return <Info className="h-4 w-4 text-red-500" />;
            default:
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
        }
    };

    if (!user) return null;

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-1 bg-primary text-white border-2 border-background animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(380px,calc(100vw-1rem))] p-0 rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-secondary/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-black italic uppercase tracking-tight text-lg">Alerts</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{unreadCount} Unread</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-bold uppercase tracking-widest h-7 hover:bg-white"
                            onClick={() => markAllAsReadMutation.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground font-medium italic">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b last:border-0 hover:bg-secondary/20 transition-colors flex gap-4 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                            >
                                <div className="h-10 w-10 rounded-xl bg-white shadow-sm border flex items-center justify-center shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold leading-none ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                            >
                                                View
                                            </Link>
                                        )}
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-3 text-center bg-secondary/10">
                    <DropdownMenuItem onSelect={() => setTimeout(() => setSettingsOpen(true), 0)} className="min-h-10 cursor-pointer justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                        Notification Settings
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
        <NotificationSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
};
