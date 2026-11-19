import { Loader2 } from "lucide-react";

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin text-blush-500 ${className}`} />;
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-cocoa-400">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cocoa-300/50 bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-blush-100 p-4 text-blush-500">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-xl">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-cocoa-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
      <p>{message || "Something went wrong."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline btn-sm mt-3">
          Try again
        </button>
      )}
    </div>
  );
}
