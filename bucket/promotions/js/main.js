function validateFile() {
    const fileInput = document.getElementById('fileInput');
    const errorDisplay = document.getElementById('errorDisplay');
    const file = fileInput.files[0];

    // Verificar si se seleccionÃ³ un archivo
    if (!file) {
        errorDisplay.innerHTML = '<p class="error-message">Por favor seleccione un archivo.</p>';
        return;
    }

    // Verificar si la extensiÃ³n es CSV
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    if (fileExtension.toLowerCase() !== 'csv') {
        errorDisplay.innerHTML = '<p class="error-message">El archivo no es de tipo .csv</p>';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n');

        // Inicializar variable para verificar si hay errores
        let errorHTML = '';
        let errorCount = 0; // Se agregÃ³ esta lÃ­nea para contar los errores
        const maxErrorsToShow = 100; // Limitar el nÃºmero de errores a mostrar

        // Validar el separador de columnas
        const separator = lines[0].includes(';') ? ';' : ',';
        if (separator !== ',') {
            errorHTML += '<p class="error-message">El separador de columnas no es una coma (,).</p>';
            errorCount++;
        }

        // Obtener encabezados y verificar existencia
        const headers = lines[0].split(separator).map(header => header.trim()); // Eliminar espacios alrededor de los encabezados
        const requiredHeaders = ['barcode', 'sku', 'price', 'active'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            errorHTML += `<p class="error-message">Faltan los siguientes encabezados: ${missingHeaders.join(', ')}.</p>`;
            errorCount++;
        }

        // Validar contenido de cada lÃ­nea
        for (let i = 1; i < lines.length; i++) {
            if (errorCount >= maxErrorsToShow) {  // Se agregÃ³ esta condiciÃ³n para limitar los errores mostrados
                errorHTML += `<p class="error-message">Se han encontrado mÃ¡s de ${maxErrorsToShow} errores. Por favor revise el archivo.</p>`;
                break;
            }

            const line = lines[i].trim();
            if (line === '') continue;

            // Validar separador de columnas
            if (line.includes(';') && separator === ',') {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Se encontrÃ³ un separador de columnas incorrecto.</p>`;
                errorCount++;
                continue;
            } else if (line.includes(',') && separator === ';') {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Se encontrÃ³ un separador de columnas incorrecto.</p>`;
                errorCount++;
                continue;
            }

            const values = line.split(separator);

            // Validar que cada registro tenga informaciÃ³n para solo uno de los campos barcode o sku
            const barcodeIndex = headers.indexOf('barcode');
            const skuIndex = headers.indexOf('sku');
            if ((barcodeIndex !== -1 && skuIndex !== -1 && (values[barcodeIndex] && values[skuIndex])) || 
                (barcodeIndex === -1 && skuIndex === -1) || 
                (barcodeIndex !== -1 && !values[barcodeIndex] && skuIndex !== -1 && !values[skuIndex])) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Por cada registro debe existir informaciÃ³n solo para 'barcode' o 'sku'.</p>`;
                errorCount++;
            }

            // Validar tipos de datos
            if (barcodeIndex !== -1 && isNaN(values[barcodeIndex])) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'barcode' debe ser de tipo string.</p>`;
                errorCount++;
            }

            if (skuIndex !== -1 && isNaN(values[skuIndex])) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'sku' debe ser de tipo string.</p>`;
                errorCount++;
            }

            const priceIndex = headers.indexOf('price');
            if (priceIndex !== -1) {
                const price = parseFloat(values[priceIndex].replace(',', '.'));
                if (isNaN(price) || price <= 0 || !(/^\d+(\.\d{1,2})?$/.test(values[priceIndex]))) {
                    errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'price' debe ser numÃ©rico y tener como mÃ¡ximo dos decimales.</p>`;
                    errorCount++;
                }
            }

            const activeIndex = headers.indexOf('active');
            if (activeIndex !== -1 && !['0', '1', 'true', 'false'].includes(values[activeIndex].toLowerCase())) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'active' debe ser un valor booleano (0, 1, true o false).</p>`;
                errorCount++;
            }
        }

        // Si se encontraron errores, mostrarlos
        if (errorCount > 0) {  // Se agrega el conteo total de errores
            errorHTML = `<p class="error-message">Se encontraron ${errorCount} errores</p>` + errorHTML;
        } else {
            errorHTML = '<p class="success-message">Â¡Felicitaciones, el archivo es correcto!</p>';
        }

        errorDisplay.innerHTML = errorHTML;
    };

    // Leer el archivo como texto
    reader.readAsText(file);
}
