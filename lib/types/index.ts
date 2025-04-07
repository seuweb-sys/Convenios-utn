export type UserRole = 'admin' | 'gestor' | 'usuario'

export interface User {
  id: string
  email: string
  role: UserRole
  department: string
  created_at: string
}

export type ConvenioStatus = 'borrador' | 'pendiente' | 'aprobado' | 'rechazado' | 'finalizado'

export interface Convenio {
  id: string
  title: string
  type: 'practicas' | 'marco'
  status: ConvenioStatus
  created_by: string
  created_at: string
  updated_at: string
  content: Record<string, any>
  metadata: Record<string, any>
}

export interface Template {
  id: string
  name: string
  type: 'practicas' | 'marco'
  content: string
  fields: string[]
} 