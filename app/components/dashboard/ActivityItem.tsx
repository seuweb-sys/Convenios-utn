import React from "react";
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
  type,
  icon
}: ActivityItemProps) => {
  const typeClasses = {
    info: "bg-blue-100 dark:bg-blue-900/20 text-blue-500",
    success: "bg-green-100 dark:bg-green-900/20 text-green-500",
    warning: "bg-amber-100 dark:bg-amber-900/20 text-amber-500",
    error: "bg-red-100 dark:bg-red-900/20 text-red-500"
  };

  return (
    <div className="flex gap-3 items-start pb-3 border-b border-border/40 last:border-0 last:pb-0">
      <div className={`p-2 rounded-full ${typeClasses[type]}`}>
        {icon}
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