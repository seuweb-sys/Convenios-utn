import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, UnderlineType, AlignmentType } from 'docx';

interface TemplateField {
  key: string;
  value: string;
}

interface Clausula {
  titulo: string;
  contenido: string;
}

interface ConvenioTemplate {
  title: string;
  subtitle: string;
  partes: string[];
  considerandos: string[];
  clausulas: Clausula[];
  cierre: string;
}

export function processTemplate(template: ConvenioTemplate, fields: TemplateField[]) {
  const children: any[] = [];

  // Validar y normalizar la estructura del template
  const normalizedTemplate = {
    title: template?.title || 'CONVENIO',
    subtitle: template?.subtitle || '',
    partes: Array.isArray(template?.partes) ? template.partes : [],
    considerandos: Array.isArray(template?.considerandos) ? template.considerandos : [],
    clausulas: Array.isArray(template?.clausulas) ? template.clausulas : [],
    cierre: template?.cierre || ''
  };

  // Log para debuggear template incompleto
  if (!template?.title || !template?.partes || !template?.considerandos || !template?.clausulas) {
    console.warn('Template incompleto detectado:', {
      title: !!template?.title,
      partes: !!template?.partes,
      considerandos: !!template?.considerandos,
      clausulas: !!template?.clausulas,
      cierre: !!template?.cierre
    });
  }

  // Función helper para reemplazar campos
  const replaceFields = (text: string) => {
    // Validar que text no sea undefined o null
    if (text == null || typeof text !== 'string') {
      console.warn('Texto del template es null/undefined:', text);
      return '';
    }
    
    let processed = text;
    
    // Validar que fields sea un array válido
    if (!Array.isArray(fields)) {
      console.error('fields no es un array válido:', fields);
      return processed;
    }
    
    fields.forEach((field) => {
      // Validar que field sea un objeto válido
      if (!field || typeof field !== 'object') {
        console.error('Field inválido:', field);
        return;
      }
      
      // Validar que field.key exista
      if (!field.key || typeof field.key !== 'string') {
        console.error('field.key inválido:', field);
        return;
      }
      
      // Validar que field.value no sea undefined o null
      const safeValue = (field.value != null) ? String(field.value) : '';
      
      // Log para debuggear campos faltantes
      if (!field.value) {
        console.warn(`Campo '${field.key}' está vacío o undefined`);
      }
      
      try {
        processed = processed.replace(
          new RegExp(`{${field.key}}`, 'g'),
          safeValue
        );
      } catch (error) {
        console.error(`Error procesando campo '${field.key}':`, error);
      }
    });
    
    // Detectar placeholders no reemplazados
    const unreplacedPlaceholders = processed.match(/{[^}]+}/g);
    if (unreplacedPlaceholders) {
      console.warn('Placeholders no encontrados:', unreplacedPlaceholders);
      // Reemplazar placeholders no encontrados con texto por defecto
      unreplacedPlaceholders.forEach(placeholder => {
        try {
          processed = processed.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), '[CAMPO FALTANTE]');
        } catch (error) {
          console.error(`Error reemplazando placeholder ${placeholder}:`, error);
        }
      });
    }
    
    return processed;
  };

  // Título
  children.push(
    new Paragraph({
      text: normalizedTemplate.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Subtítulo (solo si existe)
  if (normalizedTemplate.subtitle) {
    children.push(
      new Paragraph({
        text: replaceFields(normalizedTemplate.subtitle),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      })
    );
  }

  // Partes
  normalizedTemplate.partes.forEach((parte) => {
    children.push(
      new Paragraph({
        text: replaceFields(parte),
        spacing: {
          after: 200,
        },
      })
    );
  });

  // Considerandos (solo si hay)
  if (normalizedTemplate.considerandos.length > 0) {
    children.push(
      new Paragraph({
        text: "CONSIDERANDO:",
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    normalizedTemplate.considerandos.forEach((considerando) => {
      children.push(
        new Paragraph({
          text: replaceFields(considerando),
          spacing: {
            after: 200,
          },
        })
      );
    });
  }

  // Cláusulas
  normalizedTemplate.clausulas.forEach((clausula) => {
    children.push(
      new Paragraph({
        text: `CLÁUSULA ${clausula.titulo}:`,
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 400,
          after: 200,
        },
      })
    );

    // Procesar el contenido que puede tener saltos de línea
    const lineas = (clausula.contenido || '').split('\n');
    lineas.forEach((linea) => {
      children.push(
        new Paragraph({
          text: replaceFields(linea),
          spacing: {
            after: 200,
          },
        })
      );
    });
  });

  // Cierre (solo si existe)
  if (normalizedTemplate.cierre) {
    children.push(
      new Paragraph({
        text: replaceFields(normalizedTemplate.cierre),
        spacing: {
          before: 400,
          after: 400,
        },
      })
    );
  }

  return children;
}

export function createDocument(template: ConvenioTemplate, fields: TemplateField[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: processTemplate(template, fields),
    }],
  });

  return doc;
} 