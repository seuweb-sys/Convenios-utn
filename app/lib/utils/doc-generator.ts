import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, UnderlineType, AlignmentType } from 'docx';

interface TemplateField {
  key: string;
  value: string | any[]; // Ahora puede ser array
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

// Normaliza valores dinámicos antes de ser inyectados en el documento
function normalizeFields(fields: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = { ...fields };

  // Normalizaciones específicas
  if (normalized.entidad_cuit && typeof normalized.entidad_cuit === 'string') {
    const digits = String(normalized.entidad_cuit).replace(/[^0-9]/g, '');
    if (digits.length === 11) {
      normalized.entidad_cuit = digits.replace(/(\d{2})(\d{8})(\d)/, '$1-$2-$3');
    }
  }

  if (normalized.mes && typeof normalized.mes === 'string') {
    normalized.mes = String(normalized.mes)
      .toLowerCase()
      .replace(/^([a-zñáéíóúü])(.*)$/i, (_, first, rest) => first.toUpperCase() + rest);
  }

  // Normalizar array de partes si existe
  if (Array.isArray(normalized.partes)) {
    normalized.partes = normalized.partes.map(p => {
      // Normalizar cuit dentro de cada parte
      if (p.cuit) {
        const digits = String(p.cuit).replace(/[^0-9]/g, '');
        if (digits.length === 11) {
          return { ...p, cuit: digits.replace(/(\d{2})(\d{8})(\d)/, '$1-$2-$3') };
        }
      }
      return p;
    });
  }

  return normalized;
}

export function processTemplate(template: ConvenioTemplate, fieldsRecord: Record<string, any>) {
  const fields = normalizeFields(fieldsRecord);
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

  // Función helper para reemplazar campos con soporte de loops
  // Retorna un array de strings (líneas) para manejar loops que generan múltiples líneas
  const replaceFields = (text: string): string[] => {
    if (text == null || typeof text !== 'string') return [''];

    // Detectar bloque loop: {#arrayName}contenido{/arrayName}
    const loopRegex = /{#(\w+)}([\s\S]*?){\/\1}/g;
    let processedText = text;

    // Si no hay loops, comportamiento normal
    if (!loopRegex.test(text)) {
      return [replaceSingleString(text, fields)];
    }

    // Si hay loops, procesamos
    // Nota: Por simplicidad, asumimos que si hay un loop, puede afectar a todo el párrafo 
    // o lo dividimos. Para mantenerlo simple, expandimos el loop y retornamos array.

    // Extraer partes estáticas y dinámicas
    const result: string[] = [];
    let lastIndex = 0;

    // Reset regex
    loopRegex.lastIndex = 0;
    let match;

    while ((match = loopRegex.exec(text)) !== null) {
      const arrayName = match[1];
      const itemsTemplate = match[2];
      const beforeLoop = text.substring(lastIndex, match.index);

      // Agregar texto antes del loop
      if (beforeLoop) result.push(replaceSingleString(beforeLoop, fields));

      const arrayData = fields[arrayName];
      if (Array.isArray(arrayData)) {
        arrayData.forEach(item => {
          // Reemplazar campos del item en el template del loop
          result.push(replaceSingleString(itemsTemplate, item));
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Texto después del loop
    const afterLoop = text.substring(lastIndex);
    if (afterLoop) result.push(replaceSingleString(afterLoop, fields));

    return result;
  };

  const replaceSingleString = (text: string, data: Record<string, any>): string => {
    let processed = text;
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        processed = processed.replace(new RegExp(`{${key}}`, 'g'), String(value));
      }
    });
    // Limpiar placeholders no encontrados
    return processed.replace(/{[^}]+}/g, (match) => {
      // No eliminar si parece un tag de control
      if (match.startsWith('{#') || match.startsWith('{/')) return match;
      return '[FALTA]';
    });
  };

  // Título
  children.push(
    new Paragraph({
      text: normalizedTemplate.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Subtítulo
  if (normalizedTemplate.subtitle) {
    const subtitleLines = replaceFields(normalizedTemplate.subtitle);
    subtitleLines.forEach(line => {
      children.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    });
  }

  // Partes
  normalizedTemplate.partes.forEach((parte) => {
    // replaceFields ahora retorna array de líneas
    const lines = replaceFields(parte);
    lines.forEach(line => {
      if (!line.trim()) return; // Ignorar líneas vacías
      children.push(
        new Paragraph({
          text: line,
          spacing: { after: 200 },
        })
      );
    });
  });

  // Considerandos
  if (normalizedTemplate.considerandos.length > 0) {
    children.push(
      new Paragraph({
        text: "CONSIDERANDO:",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    normalizedTemplate.considerandos.forEach((considerando) => {
      const lines = replaceFields(considerando);
      lines.forEach(line => {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 200 },
          })
        );
      });
    });
  }

  // Cláusulas
  normalizedTemplate.clausulas.forEach((clausula) => {
    children.push(
      new Paragraph({
        text: `CLÁUSULA ${clausula.titulo}:`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const mainLines = replaceFields(clausula.contenido);
    mainLines.forEach(block => {
      block.split('\n').forEach(line => {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 200 },
          })
        );
      });
    });
  });

  // Cierre
  if (normalizedTemplate.cierre) {
    const lines = replaceFields(normalizedTemplate.cierre);
    lines.forEach(line => {
      children.push(
        new Paragraph({
          text: line,
          spacing: { before: 400, after: 400 },
        })
      );
    });
  }

  return children;
}

export function createDocument(template: ConvenioTemplate, fields: Record<string, any> | any[]) {
  // Convertir array de fields a objeto si es necesario (compatibilidad)
  let fieldsObj: Record<string, any> = {};
  if (Array.isArray(fields)) {
    fields.forEach(f => {
      if (f.key) fieldsObj[f.key] = f.value;
    });
  } else {
    fieldsObj = fields;
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: processTemplate(template, fieldsObj),
    }],
  });

  return doc;
}