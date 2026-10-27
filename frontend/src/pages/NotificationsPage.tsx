import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, PenSquare, HelpCircle, ClipboardList, Megaphone, Clock, Calendar } from 'lucide-react';
import { Card, Badge, Button, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
  icon: string;
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  assignment: PenSquare,
  quiz: HelpCircle,
  attendance: ClipboardList,
  timetable: Clock,
  announcement: Megaphone,
  material: Calendar,
};

const TYPE_COLORS: Record<string, string> = {
  warning: '#E8D36A',
  info: '#7DB7C9',
  danger: '#D98282',
  default: '#E8E2D0',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNotifications().then(setNotifications).catch(err => setError(err.message));
  }, []);

  async function markAllRead() {
    await Promise.all(notifications.filter(notification => !notification.read).map(notification => api.markNotificationRead(notification.id)));
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const notification = notifications.find(item => item.id === id);
    if (!notification || notification.read) return;
    await api.markNotificationRead(id);
    setNotifications(items => items.map(item => item.id === id ? { ...item, read: true } : item));
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a2e1e]">Notifications</h2>
          <p className="text-sm text-[#7a6a55] mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}

      <div className="space-y-2">
        {notifications.map(n => {
          const Icon = NOTIF_ICONS[n.icon] || Bell;
          return (
            <Card
              key={n.id}
              className={`p-4 flex items-start gap-3 ${!n.read ? 'border-l-4' : ''}`}
              style={!n.read ? { borderLeftColor: TYPE_COLORS[n.type] || '#E8E2D0' } as React.CSSProperties : undefined}
              onClick={() => void markRead(n.id)}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: TYPE_COLORS[n.type] + '30' }}>
                <Icon size={15} style={{ color: n.type === 'warning' ? '#9a6000' : n.type === 'info' ? '#2a6a82' : n.type === 'danger' ? '#b04040' : '#7a6a55' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[#1a2e1e]' : 'text-[#3a2e1a]'}`}>{n.message}</p>
                <p className="text-xs text-[#9a8a75] mt-0.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#2F4F3A] shrink-0 mt-2" />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
