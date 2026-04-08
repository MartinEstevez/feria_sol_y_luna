const SHEET_EMPRENDEDORES = "Emprendedores";
const SHEET_FERIAS = "Ferias";

function doPost(e) {
  // Manejador principal para atrapar errores y evitar que la app se rompa
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);

    // ============================================
    // 1. LÓGICA PARA AGREGAR FERIAS
    // ============================================
    if (data.action === 'add_feria') {
      const sheetF = ss.getSheetByName(SHEET_FERIAS);
      const lastRow = sheetF.getLastRow();
      
      // Genera un ID autoincremental para las ferias (001, 002, etc.)
      let maxId = 0;
      if (lastRow > 1) {
        const values = sheetF.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < values.length; r++) {
          let val = values[r][0].toString();
          let match = val.match(/\d+/);
          if (match) {
            let num = parseInt(match[0], 10);
            if (num > maxId) maxId = num;
          }
        }
      }
      const nextId = Utilities.formatString("%03d", maxId + 1);

      sheetF.appendRow([nextId, data.nombre_feria, data.ubicacion, data.fecha, new Date()]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============================================
    // 2. LÓGICA DE BORRADO DE EMPRENDEDORES
    // ============================================
    if (data.action === 'delete' && data.row_index) {
      ss.getSheetByName(SHEET_EMPRENDEDORES).deleteRow(data.row_index);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Eliminado" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============================================
    // 3. LÓGICA DE EDICIÓN DE EMPRENDEDORES
    // ============================================
    if (data.action === 'update' && data.row_index) {
      const sheetE = ss.getSheetByName(SHEET_EMPRENDEDORES);
      const filaRange = sheetE.getRange(data.row_index, 1, 1, 11); // Ahora son 11 columnas con la feria
      
      // Forzamos formato texto en el ID
      sheetE.getRange(data.row_index, 1).setNumberFormat("@");
      
      const filaActualizada = [
        data.codigo_interno.toString().replace(/'/g, ''), 
        data.nombre_apellido, 
        data.rubro,
        data.opcion_elegida, 
        data.medida_gazebo || "", 
        data.valor_total || 0, 
        data.sena || 0,
        (data.pago_completo === "Sí" || data.pago_completo === true) ? "Sí" : "No",
        data.instagram, 
        data.fecha_registro || new Date(),
        data.feria_asignada || "" // La feria a la que pertenece
      ];
      
      filaRange.setValues([filaActualizada]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Actualizado" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ============================================
    // 4. LÓGICA DE CREACIÓN DE EMPRENDEDORES
    // ============================================
    const sheetE = ss.getSheetByName(SHEET_EMPRENDEDORES);
    let finalCodigo = "";
    
    // Verificamos si ya viene con un código desde el Autocompletado
    if (data.codigo_interno && data.codigo_interno.toString().trim() !== "") {
      finalCodigo = data.codigo_interno.toString().replace(/'/g, '');
    } else {
      // Si es nuevo de verdad, buscamos el número más alto en toda la columna
      const lastRow = sheetE.getLastRow();
      let maxId = 0;
      if (lastRow > 1) {
        const values = sheetE.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = 0; r < values.length; r++) {
          let val = values[r][0].toString();
          let match = val.match(/\d+/);
          if (match) {
            let num = parseInt(match[0], 10);
            if (num > maxId) maxId = num;
          }
        }
      }
      finalCodigo = Utilities.formatString("%03d", maxId + 1);
    }

    const filaE = [
      finalCodigo, 
      data.nombre_apellido || "", 
      data.rubro || "",
      data.opcion_elegida || "", 
      data.medida_gazebo || "",
      data.valor_total || 0, 
      data.sena || 0,
      (data.pago_completo === true || data.pago_completo === "Sí") ? "Sí" : "No",
      data.instagram || "", 
      new Date(),
      data.feria_asignada || "" // Columna extra para asociarlo a una feria
    ];

    sheetE.appendRow(filaE);
    
    // IMPORTANTE: Después de agregar la fila, forzamos que la celda del código sea texto ("@")
    sheetE.getRange(sheetE.getLastRow(), 1).setNumberFormat("@").setValue(finalCodigo);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", codigo: finalCodigo }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Si algo falla, le mandamos el error a React en vez de que colapse silenciosamente
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ============================================
  // Si React nos pide la lista de FERIAS
  // ============================================
  if (e.parameter.type === 'ferias') {
    const sheetF = ss.getSheetByName(SHEET_FERIAS);
    // Si la hoja no existe o está vacía, mandamos un array vacío
    if (!sheetF || sheetF.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const dataF = sheetF.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(arrayToObj(dataF)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ============================================
  // Por defecto (Si React no pide tipo): EMPRENDEDORES
  // ============================================
  const sheetE = ss.getSheetByName(SHEET_EMPRENDEDORES);
  if (!sheetE || sheetE.getLastRow() <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const dataE = sheetE.getDataRange().getValues();
  const headers = dataE[0];
  const result = [];
  
  // Mapeamos los datos y les agregamos el "row_index" (vital para poder editar/borrar después)
  for (let i = 1; i < dataE.length; i++) {
    let obj = { row_index: i + 1 }; 
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = dataE[i][j];
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Función auxiliar para convertir la tabla de Excel en JSON fácil de leer para React
function arrayToObj(data) {
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}