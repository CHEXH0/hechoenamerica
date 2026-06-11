import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  /** Smaller dot-style badge used as an overlay (e.g. on the avatar). */
  overlay?: boolean;
}

/**
 * Small red bubble showing a number of new updates.
 * Renders nothing when count is 0.
 */
const NotificationBadge = ({ count, className, overlay }: NotificationBadgeProps) => {
  if (!count || count < 1) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-red-500 text-white font-semibold leading-none",
        overlay
          ? "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] ring-2 ring-background"
          : "h-5 min-w-5 px-1.5 text-[11px]",
        className
      )}
      aria-label={`${label} new updates`}
    >
      {label}
    </span>
  );
};

export default NotificationBadge;
