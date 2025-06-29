import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";

export async function renderDocx(templateBuffer: Buffer, data: Record<string, any>): Promise<Buffer> {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  doc.setData(data);
  try {
    doc.render();
  } catch (error: any) {
    console.warn("Docxtemplater render error, intentando ignorar placeholders faltantes:", error);
    // Intentar segunda pasada ignorando errores
    try {
      // Marcar todas las keys faltantes como vacías
      if (error?.properties?.errors) {
        error.properties.errors.forEach((e: any) => {
          const tag = e.properties?.id || e.id;
          if (tag && !(tag in data)) {
            (data as any)[tag] = '';
          }
        });
        doc.setData(data);
        doc.render();
      } else {
        throw error;
      }
    } catch (err2) {
      console.error("Falló render incluso tras limpiar placeholders:", err2);
      throw err2;
    }
  }

  return Buffer.from(doc.getZip().generate({ type: "nodebuffer" }));
}

// Helper para leer archivo desde FS (solo para pruebas locales)
export function loadTemplate(path: string): Buffer {
  return fs.readFileSync(path);
} 