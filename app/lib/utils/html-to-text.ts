/**
 * Convierte HTML a texto plano manteniendo formato básico
 * @param html - Contenido HTML a convertir
 * @returns Texto plano con formato básico
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  
  // Reemplazar etiquetas HTML comunes con formato de texto
  let text = html
    // Párrafos - agregar doble salto para separación
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    
    // Saltos de línea
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Listas - mejorar formato
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '- ')  // Cambiar • por - para mejor compatibilidad
    .replace(/<\/li>/gi, '\n')
    
    // Énfasis - mantener texto sin formato especial para consistencia
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
    
    // Encabezados - agregar separación
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n\n')
    
    // Div y span
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
    
    // Eliminar cualquier etiqueta HTML restante
    .replace(/<[^>]*>/g, '')
    
    // Decodificar entidades HTML comunes
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Limpiar espacios múltiples y saltos de línea excesivos
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
    
  // Agregar espaciado uniforme para que el texto se vea más consistente
  text = text.replace(/\n\n/g, '\n\n');
    
  return text;
} 