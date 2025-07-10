import mammoth from 'mammoth';

export interface DocxContent {
  html: string;
  text: string;
  messages: string[];
}

// Función para post-procesar y mejorar el HTML extraído
function enhanceExtractedHtml(html: string): string {
  console.log('🔧 [DOCX Reader] Post-procesando HTML para mejorar tablas...');
  
  // Si no hay tablas detectadas, intentar reconstruir desde patrones de texto
  if (!html.includes('<table')) {
    console.log('🔍 [DOCX Reader] No se detectaron tablas HTML, buscando patrones...');
    
    // Buscar patrones que podrían ser tablas (múltiples | en líneas consecutivas)
    const lines = html.split('\n');
    let enhancedHtml = html;
    let inTable = false;
    let tableBuffer: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar posibles filas de tabla (contienen múltiples separadores)
      const hasSeparators = (line.match(/\|\s/g) || []).length >= 2;
      const hasTabSeparators = (line.match(/\t/g) || []).length >= 2;
      
      if (hasSeparators || hasTabSeparators) {
        if (!inTable) {
          console.log('📋 [DOCX Reader] Iniciando tabla detectada en línea:', i + 1);
          inTable = true;
          tableBuffer = ['<table border="1" style="border-collapse: collapse; width: 100%;">'];
        }
        
        // Convertir línea a fila de tabla
        let cells = line.split(/\|\s*|\t+/).filter(cell => cell.trim());
        if (cells.length >= 2) {
          const row = '<tr>' + cells.map(cell => `<td style="padding: 8px; border: 1px solid #ccc;">${cell.trim()}</td>`).join('') + '</tr>';
          tableBuffer.push(row);
        }
        
      } else if (inTable && line.length === 0) {
        // Línea vacía puede indicar fin de tabla
        tableBuffer.push('</table>');
        const tableHtml = tableBuffer.join('\n');
        enhancedHtml = enhancedHtml.replace(
          lines.slice(i - tableBuffer.length + 2, i + 1).join('\n'),
          tableHtml
        );
        console.log('✅ [DOCX Reader] Tabla completada con', tableBuffer.length - 2, 'filas');
        inTable = false;
        tableBuffer = [];
      }
    }
    
    // Cerrar tabla si quedó abierta
    if (inTable && tableBuffer.length > 1) {
      tableBuffer.push('</table>');
      const tableHtml = tableBuffer.join('\n');
      enhancedHtml += '\n' + tableHtml;
      console.log('✅ [DOCX Reader] Tabla final completada con', tableBuffer.length - 2, 'filas');
    }
    
    return enhancedHtml;
  }
  
  console.log('✅ [DOCX Reader] HTML ya contiene tablas, no se requiere post-procesamiento');
  return html;
}

export async function extractDocxContent(file: File): Promise<DocxContent> {
  console.log('🔍 [DOCX Reader] Iniciando extracción de contenido...');
  console.log('📁 [DOCX Reader] Archivo:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  });

  try {
    // Opciones para mammoth - configurar para extraer máximo contenido
    const options = {
      // Configuración mejorada para tablas
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true,
      
      convertImage: mammoth.images.imgElement(function(image: any) {
        console.log('🖼️ [DOCX Reader] Procesando imagen:', {
          contentType: image.contentType,
          hasData: !!image.read
        });
        
        // Convertir imágenes a base64 embebidas
        return image.read("base64").then(function(imageBuffer: string) {
          console.log('✅ [DOCX Reader] Imagen convertida a base64, tamaño:', imageBuffer.length);
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`
          };
        }).catch((imgError: any) => {
          console.error('❌ [DOCX Reader] Error al procesar imagen:', imgError);
          return { src: '' }; // Imagen vacía en caso de error
        });
      }),
      
      // Preservar estilos y formateo + TABLAS
      styleMap: [
        // Headings
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        
        // Formato de texto
        "b => strong",
        "i => em", 
        "u => u",
        
        // TABLAS - mapeo explícito
        "table => table",
        "tr => tr", 
        "td => td",
        "th => th",
        
        // Estilos de párrafo
        "p[style-name='Normal'] => p:fresh",
        "p => p:fresh"
      ],
      
      // Transformaciones adicionales para preservar estructura
      transformDocument: function(element: any) {
        // Asegurar que las tablas se preserven
        if (element.type === "table") {
          console.log('🔄 [DOCX Reader] Procesando tabla con', element.children?.length || 0, 'filas');
        }
        return element;
      }
    };
    
    console.log('⚙️ [DOCX Reader] Configuración mammoth:', {
      hasImageConverter: !!options.convertImage,
      styleMappings: options.styleMap.length
    });
    
    // Mammoth puede trabajar directamente con File objects en el browser
    console.log('📖 [DOCX Reader] Extrayendo HTML...');
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, options);
    
    console.log('📝 [DOCX Reader] Extrayendo texto plano...');
    const textResult = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    
    console.log('✅ [DOCX Reader] Extracción completada exitosamente');
    console.log('📊 [DOCX Reader] Resultados:', {
      htmlLength: htmlResult.value.length,
      textLength: textResult.value.length,
      messagesCount: htmlResult.messages.length,
      hasImages: htmlResult.value.includes('<img'),
      hasTables: htmlResult.value.includes('<table'),
      hasFormatting: htmlResult.value.includes('<strong') || htmlResult.value.includes('<em')
    });
    
    // Log de warnings/mensajes de mammoth
    if (htmlResult.messages.length > 0) {
      console.warn('⚠️ [DOCX Reader] Mensajes de mammoth:', htmlResult.messages.map(m => m.message));
    }
    
    // Muestra de contenido extraído (primeros 200 caracteres)
    console.log('📄 [DOCX Reader] Vista previa HTML:', htmlResult.value.substring(0, 200) + '...');
    console.log('📄 [DOCX Reader] Vista previa texto:', textResult.value.substring(0, 200) + '...');
    
    return {
      html: enhanceExtractedHtml(htmlResult.value),
      text: textResult.value,
      messages: htmlResult.messages.map(m => m.message)
    };
    
  } catch (error) {
    console.error('❌ [DOCX Reader] Error durante la extracción:', error);
    console.error('❌ [DOCX Reader] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    throw new Error(`Error al procesar el archivo DOCX: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function processDocxForTemplate(file: File): Promise<string> {
  console.log('🎯 [DOCX Reader] Procesando DOCX para template...');
  
  try {
    const content = await extractDocxContent(file);
    
    console.log('✅ [DOCX Reader] Contenido procesado para template');
    console.log('📋 [DOCX Reader] Longitud final del HTML:', content.html.length);
    
    // Retornar HTML procesado para usar en templates
    return content.html;
    
  } catch (error) {
    console.error('❌ [DOCX Reader] Error al procesar DOCX para template:', error);
    throw error;
  }
} 