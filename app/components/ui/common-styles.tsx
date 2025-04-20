import React from "react";

// Estilos comunes como cadenas de texto que se pueden importar
export const commonInputStyles = `
  w-full px-4 py-2.5 
  bg-card/50
  border border-border/60
  text-foreground
  rounded-md 
  placeholder-muted-foreground
  focus:border-primary/30
  focus:ring-1 
  focus:ring-primary/20
  focus:ring-offset-0 
  transition-colors
  hover:border-border
`;

export const commonCardStyles = `
  border border-border/60
  rounded-lg
  bg-card/80
  backdrop-blur-sm
  hover:border-primary/30
  hover:shadow-sm
  transition-all 
  duration-200
`;

export const commonLabelStyles = `
  block 
  text-sm 
  font-medium 
  mb-1.5 
  text-foreground/80
`;

export default {
  commonInputStyles,
  commonCardStyles,
  commonLabelStyles
};