export function StatCard({ icon: Icon, label, value, tone = "pink", hint }) {
  const tones = {
    pink: "bg-blush-100 text-blush-500",
    brown: "bg-cream-200 text-cocoa-500",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-sky-100 text-sky-600",
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-2xl p-3 ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-cocoa-400">{label}</p>
        <p className="truncate font-display text-2xl font-bold text-cocoa-900">{value}</p>
        {hint && <p className="text-xs text-cocoa-400">{hint}</p>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TableWrap({ children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] divide-y divide-cream-200">{children}</table>
      </div>
    </div>
  );
}
