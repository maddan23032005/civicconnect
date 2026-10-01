/**
 * PageHeader — uniform top section for all inner pages.
 * Provides the icon, title, subtitle, and optional action slot.
 */
export function PageHeader({ icon: Icon, iconTone = "text-navy-300", iconBg = "bg-navy-500/15", title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl ${iconBg} p-3 mt-0.5`}>
          <Icon size={22} className={iconTone} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
