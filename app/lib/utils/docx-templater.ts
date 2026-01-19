import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export async function renderDocx(templateBuffer: Buffer, data: Record<string, any>): Promise<Buffer> {
  try {
    console.log('📋 [DOCX Templater] Procesando template con datos...');

    // Procesar datos para docxtemplater
    // - Arrays se pasan directamente (para loops {#array}...{/array})
    // - Objetos se pasan directamente (para acceso anidado)
    // - Strings y números se pasan tal cual
    // - null/undefined se convierten a string vacío
    const processedData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // Soportar arrays para loops en el template
        processedData[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            // Procesar cada objeto del array
            const processedItem: Record<string, any> = {};
            for (const [k, v] of Object.entries(item)) {
              if (v != null) {
                processedItem[k] = typeof v === 'string' ? v : String(v);
              } else {
                processedItem[k] = '';
              }
            }
            return processedItem;
          }
          return item != null ? String(item) : '';
        });
      } else if (typeof value === 'object' && value !== null) {
        // Soportar objetos anidados
        const processedObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          if (v != null) {
            processedObj[k] = typeof v === 'string' ? v : String(v);
          } else {
            processedObj[k] = '';
          }
        }
        processedData[key] = processedObj;
      } else if (typeof value === 'string') {
        processedData[key] = value;
      } else if (value != null) {
        processedData[key] = String(value);
      } else {
        processedData[key] = '';
      }
    }

    console.log('📝 [DOCX Templater] Datos procesados:', Object.keys(processedData));

    // Log arrays para debug
    const arrayKeys = Object.keys(processedData).filter(k => Array.isArray(processedData[k]));
    if (arrayKeys.length > 0) {
      console.log('📝 [DOCX Templater] Arrays encontrados:', arrayKeys.map(k => `${k}(${processedData[k].length})`));
    }

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