import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActivityType } from "@/lib/types";

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
  icon: ReactNode;
}

export function ActivityItem({
  title,
  description,
  time,
  type,
  icon,
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
      <div className={cn(
        "p-2 rounded-full",
        type === "success" && "bg-green-100 text-green-600",
        type === "error" && "bg-red-100 text-red-600",
        type === "warning" && "bg-yellow-100 text-yellow-600",
        type === "info" && "bg-blue-100 text-blue-600"
      )}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
} 