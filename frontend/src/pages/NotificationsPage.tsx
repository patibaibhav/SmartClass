import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, PenSquare, HelpCircle, ClipboardList, Megaphone, Clock, Calendar } from 'lucide-react';
import { Card, Button, EmptyState } from '../components/ui';
import { api } from '../services/api';

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

interface NotificationItem {
  id: string;
  message: string;
  time?: string;
  created_at?: string;
  type?: string;
  icon?: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getNotifications()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setNotifications(res);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        if (isMounted) setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  function handleRead(id: string) {
    setNotifications(ns => ns.map(x => x.id === id ? { ...x, read: true } : x));
    api.markNotificationRead(id).catch(() => {});
  }

  function markAllRead() {
    notifications.forEach(n => {
      if (!n.read) api.markNotificationRead(n.id).catch(() => {});
    });
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
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

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading notifications...
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          message="No notifications right now."
          sub="You will receive alerts here about timetable changes, assignment deadlines, and notices."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = (n.icon && NOTIF_ICONS[n.icon]) || Bell;
            const notifType = n.type || 'info';
            return (
              <Card
                key={n.id}
                className={`p-4 flex items-start gap-3 cursor-pointer ${!n.read ? 'border-l-4' : ''}`}
                style={!n.read ? { borderLeftColor: TYPE_COLORS[notifType] || '#E8E2D0' } as React.CSSProperties : undefined}
                onClick={() => handleRead(n.id)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: (TYPE_COLORS[notifType] || '#E8E2D0') + '30' }}>
                  <Icon size={15} style={{ color: notifType === 'warning' ? '#9a6000' : notifType === 'danger' ? '#b04040' : '#2F4F3A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[#1a2e1e]' : 'text-[#3a2e1a]'}`}>{n.message}</p>
                  <p className="text-xs text-[#9a8a75] mt-0.5">{n.time || n.created_at?.slice(0, 10)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#2F4F3A] shrink-0 mt-2" />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
