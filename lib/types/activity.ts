export type ActivityAction = 'create' | 'update' | 'update_status' | 'delete';
export type ActivityType = 'info' | 'success' | 'error' | 'warning';

export interface ActivityLog {
  id: string;
  convenio_id: string;
  user_id: string;
  action: ActivityAction;
  status_from: string | null;
  status_to: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  ip_address: string;
  convenios?: {
    title: string;
    serial_number: string;
  };
  profiles?: {
    full_name: string;
  };
} 