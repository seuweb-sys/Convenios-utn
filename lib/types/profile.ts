// Roles posibles en el sistema
export type UserRole = 'admin' | 'reviewer' | 'user';

// Estructura del perfil de usuario
export interface Profile {
  id: string; // uuid
  full_name: string | null; // Puede ser null si no se ha completado
  role: UserRole; // Solo permite los roles definidos
  created_at: string; // ISO date
  avatar_url: string | null; // URL de la imagen de perfil o null
}

// Datos necesarios para crear un nuevo perfil
export interface CreateProfileDTO {
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
}

// Datos que se pueden actualizar en un perfil
export interface UpdateProfileDTO {
  full_name?: string;
  role?: UserRole;
  avatar_url?: string;
} 