// Exportamos todos los componentes desde un solo punto
export { default as ConvenioItem } from './ConvenioItem';
export { default as ConvenioTypeCard } from './ConvenioTypeCard';
export { default as ActivityItem } from './ActivityItem';
export { default as DashboardHeader } from './DashboardHeader';
export { default as SectionContainer } from './SectionContainer';
export { default as BackgroundPattern } from './BackgroundPattern';

// También exportamos los tipos
export type { ConvenioStatus, ConvenioItemProps } from './ConvenioItem';
export type { ConvenioColor, ConvenioTypeCardProps } from './ConvenioTypeCard';
export type { ActivityType, ActivityItemProps } from './ActivityItem';
export type { DashboardHeaderProps } from './DashboardHeader';
export type { SectionContainerProps } from './SectionContainer'; 