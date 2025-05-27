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

  // Función helper para reemplazar campos
  const replaceFields = (text: string) => {
    let processed = text;
    fields.forEach((field) => {
      processed = processed.replace(
        new RegExp(`{${field.key}}`, 'g'),
        field.value
      );
    });
    return processed;
  };

  // Título
  children.push(
    new Paragraph({
      text: template.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Subtítulo
  children.push(
    new Paragraph({
      text: replaceFields(template.subtitle),
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Partes
  template.partes.forEach((parte) => {
    children.push(
      new Paragraph({
        text: replaceFields(parte),
        spacing: {
          after: 200,
        },
      })
    );
  });

  // Considerandos
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

  template.considerandos.forEach((considerando) => {
    children.push(
      new Paragraph({
        text: replaceFields(considerando),
        spacing: {
          after: 200,
        },
      })
    );
  });

  // Cláusulas
  template.clausulas.forEach((clausula) => {
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
    const lineas = clausula.contenido.split('\n');
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

  // Cierre
  children.push(
    new Paragraph({
      text: replaceFields(template.cierre),
      spacing: {
        before: 400,
        after: 400,
      },
    })
  );

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