import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { notificationApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Card, Button, Skeleton, EmptyState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = () =>
    notificationApi
      .mine({ limit: 50 })
      .then((r) => { setItems(r.notifications); setUnread(r.unreadCount); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      toast.success("All marked as read");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const open = async (n) => {
    if (!n.read) {
      try { await notificationApi.markRead(n.id); load(); } catch { /* noop */ }
    }
  };

  return (
    <PageLayout>
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <PageHeader
          icon={Bell}
          iconTone="text-saffron-500"
          iconBg="bg-saffron-500/10"
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread alert${unread > 1 ? "s" : ""}` : "You're all caught up"}
          action={
            unread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAll}>
                <CheckCheck size={15} /> Mark all read
              </Button>
            )
          }
        />
      </Reveal>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="No notifications"
            message="Updates about your applications, grievances and payments will appear here."
          />
        </Card>
      ) : (
        <Stagger className="space-y-3">
          {items.map((n) => {
            const body = (
              <Card
                hover
                className={`p-5 ${!n.read ? "border-navy-500/30 bg-navy-500/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100">{n.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{n.message}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </Card>
            );

            return (
              <StaggerItem key={n.id}>
                {n.link ? (
                  <Link to={n.link} onClick={() => open(n)}>{body}</Link>
                ) : (
                  <div role="button" tabIndex={0} onClick={() => open(n)} onKeyDown={(e) => e.key === "Enter" && open(n)}>{body}</div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
    </PageLayout>
  );
}
