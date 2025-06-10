// Exportamos todos los componentes desde un solo punto
export { ConvenioItem } from './ConvenioItem';
export { ConvenioTypeCard } from './ConvenioTypeCard';
export { ActivityItem } from './ActivityItem';
export { DashboardHeader } from './DashboardHeader';
export { SectionContainer } from './SectionContainer';
export { BackgroundPattern } from './BackgroundPattern';

// También exportamos los tipos
export type { ConvenioStatus } from './ConvenioItem';
export type { ConvenioColor } from './ConvenioTypeCard';
export type { ConvenioItemProps } from './ConvenioItem';
export type { ConvenioTypeCardProps } from './ConvenioTypeCard';
export type { ActivityType, ActivityItemProps } from './ActivityItem';
export type { DashboardHeaderProps } from './DashboardHeader';
export type { SectionContainerProps } from './SectionContainer';

// Exportar utilidades
export { formatTimeAgo, getIconForType, getColorForType } from '../../lib/dashboard/utils'; 