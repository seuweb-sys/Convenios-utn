import { createClient } from '@/utils/supabase/server';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  convenio_id?: string;
  action_type?: string;
}

export class NotificationService {
  private static async createNotification(data: NotificationData) {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...data,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Convenio creado exitosamente
  static async convenioCreated(userId: string, convenioTitle: string, convenioId: string) {
    await this.createNotification({
      user_id: userId,
      title: '✅ Convenio creado exitosamente',
      message: `Tu convenio "${convenioTitle}" ha sido creado y enviado para revisión.`,
      type: 'success',
      convenio_id: convenioId,
      action_type: 'convenio_created'
    });
  }

  // Convenio enviado a corrección
  static async convenioSentToCorrection(userId: string, convenioTitle: string, convenioId: string, observaciones?: string) {
    await this.createNotification({
      user_id: userId,
      title: '📝 Corrección solicitada',
      message: `Tu convenio "${convenioTitle}" requiere correcciones. ${observaciones ? `Observaciones: ${observaciones}` : ''}`,
      type: 'warning',
      convenio_id: convenioId,
      action_type: 'correction_requested'
    });
  }

  // Convenio aprobado
  static async convenioApproved(userId: string, convenioTitle: string, convenioId: string) {
    await this.createNotification({
      user_id: userId,
      title: '🎉 Convenio aprobado',
      message: `¡Felicitaciones! Tu convenio "${convenioTitle}" ha sido aprobado y está listo.`,
      type: 'success',
      convenio_id: convenioId,
      action_type: 'convenio_approved'
    });
  }

  // Convenio rechazado
  static async convenioRejected(userId: string, convenioTitle: string, convenioId: string, reason?: string) {
    await this.createNotification({
      user_id: userId,
      title: '❌ Convenio rechazado',
      message: `Tu convenio "${convenioTitle}" ha sido rechazado. ${reason ? `Motivo: ${reason}` : ''}`,
      type: 'error',
      convenio_id: convenioId,
      action_type: 'convenio_rejected'
    });
  }

  // Convenio reenviado después de corrección
  static async convenioResubmitted(userId: string, convenioTitle: string, convenioId: string) {
    await this.createNotification({
      user_id: userId,
      title: '🔄 Convenio reenviado',
      message: `Tu convenio "${convenioTitle}" ha sido reenviado para revisión después de las correcciones.`,
      type: 'info',
      convenio_id: convenioId,
      action_type: 'convenio_resubmitted'
    });
  }

  // Documento generado
  static async documentGenerated(userId: string, convenioTitle: string, convenioId: string) {
    await this.createNotification({
      user_id: userId,
      title: '📄 Documento generado',
      message: `El documento final para "${convenioTitle}" ha sido generado y está disponible para descarga.`,
      type: 'success',
      convenio_id: convenioId,
      action_type: 'document_generated'
    });
  }

  // Recordatorio de pendientes (para admins)
  static async pendingConveniosReminder(userId: string, count: number) {
    await this.createNotification({
      user_id: userId,
      title: '⏰ Convenios pendientes',
      message: `Tienes ${count} convenio${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} de revisión.`,
      type: 'info',
      action_type: 'pending_reminder'
    });
  }

  // Observación agregada
  static async observationAdded(userId: string, convenioTitle: string, convenioId: string, observation: string) {
    await this.createNotification({
      user_id: userId,
      title: '💬 Nueva observación',
      message: `Se agregó una observación a "${convenioTitle}": ${observation.substring(0, 100)}${observation.length > 100 ? '...' : ''}`,
      type: 'info',
      convenio_id: convenioId,
      action_type: 'observation_added'
    });
  }

  // Sistema: Mantenimiento programado
  static async systemMaintenance(userId: string, maintenanceDate: string) {
    await this.createNotification({
      user_id: userId,
      title: '🔧 Mantenimiento programado',
      message: `El sistema estará en mantenimiento el ${maintenanceDate}. Guarda tu trabajo antes de esa fecha.`,
      type: 'warning',
      action_type: 'system_maintenance'
    });
  }

  // Notificación personalizada
  static async custom(userId: string, title: string, message: string, type: 'success' | 'warning' | 'info' | 'error', convenioId?: string) {
    await this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      convenio_id: convenioId,
      action_type: 'custom'
    });
  }
} 