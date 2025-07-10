import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export async function renderDocx(templateBuffer: Buffer, data: Record<string, any>): Promise<Buffer> {
  try {
    console.log('📋 [DOCX Templater] Procesando template con datos...');
    
    // Limpiar datos para asegurar que son strings simples
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        processedData[key] = value;
      } else if (value != null) {
        processedData[key] = String(value);
      } else {
        processedData[key] = '';
      }
    }

    console.log('📝 [DOCX Templater] Datos procesados:', Object.keys(processedData));

    // Procesar el template DOCX
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Rellenar el template con los datos
    doc.render(processedData);

    // Generar el documento final
    const output = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    console.log('✅ [DOCX Templater] Template procesado exitosamente');
    return output;
  } catch (error) {
    console.error('❌ [DOCX Templater] Error al procesar template:', error);
    throw new Error(`Error al procesar el template DOCX: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 