// Definición básica para un campo del formulario dinámico
export interface FieldDefinition {
    name: string; // Identificador único del campo (ej: 'nombreConvenio')
    label: string; // Etiqueta visible para el usuario (ej: 'Nombre del Convenio')
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file'; // Tipo de input HTML
    required?: boolean; // Si el campo es obligatorio
    step: number; // Número del paso (wizard) al que pertenece este campo
    placeholder?: string; // Texto de ejemplo dentro del campo
    validation?: string; // Podría ser un regex como string, o una clave para validaciones predefinidas
    options?: Array<{ value: string | number; label: string }>; // Opciones para 'select', 'radio', 'checkbox'
    defaultValue?: any; // Valor por defecto del campo
    gridWidth?: number; // Opcional: para controlar el ancho en un layout de grid (ej: 1 a 12)
} 