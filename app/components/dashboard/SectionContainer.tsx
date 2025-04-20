import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

export interface SectionContainerProps {
  title: string;
  children: React.ReactNode;
  viewAllLink?: string;
  viewAllText?: string;
}

export const SectionContainer = ({
  title,
  children,
  viewAllLink,
  viewAllText = "Ver todo"
}: SectionContainerProps) => {
  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm text-primary flex items-center hover:underline">
            {viewAllText}
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
};

export default SectionContainer; 