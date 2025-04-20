import React from "react";

export const BackgroundPattern = () => {
  return (
    <div className="fixed inset-0 bg-background -z-10 opacity-80">
      <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
        <defs>
          <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
            <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/30" />
          </pattern>
          <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
            <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/20" />
          </pattern>
        </defs>
        <rect width='100%' height='100%' fill='url(#pattern)' />
        <rect width='100%' height='100%' fill='url(#pattern2)' />
      </svg>
    </div>
  );
};

export default BackgroundPattern; 