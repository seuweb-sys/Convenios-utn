import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type ActivityType = "info" | "success" | "warning" | "error";

export interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
  icon: React.ReactNode;
}

export const ActivityItem = ({
  title,
  description,
  time,
  type = "info",
  icon
}: ActivityItemProps) => {
  const typeClasses = {
    info: "bg-blue-100 dark:bg-blue-900/20 text-blue-500",
    success: "bg-green-100 dark:bg-green-900/20 text-green-500",
    warning: "bg-amber-100 dark:bg-amber-900/20 text-amber-500",
    error: "bg-red-100 dark:bg-red-900/20 text-red-500"
  };

  const iconGlowClasses = {
    info: "bg-blue-500/20 dark:bg-blue-500/30",
    success: "bg-green-500/20 dark:bg-green-500/30",
    warning: "bg-amber-500/20 dark:bg-amber-500/30",
    error: "bg-red-500/20 dark:bg-red-500/30",
  };

  const iconTextClasses = {
    info: "text-blue-400",
    success: "text-green-400",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  return (
    <div className="flex gap-3 items-start pb-3 border-b border-border/40 last:border-0 last:pb-0">
      <div className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5",
        iconGlowClasses[type] 
      )}>
        <div className={cn(
          "absolute inset-0 rounded-lg blur-sm opacity-70",
          iconGlowClasses[type]
        )}></div>
        <div className={cn("relative z-10", iconTextClasses[type])}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium">{title}</p>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default ActivityItem; 