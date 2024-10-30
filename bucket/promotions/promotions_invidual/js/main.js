function validateFile() {
    const fileInput = document.getElementById('fileInput');
    const errorDisplay = document.getElementById('errorDisplay');
    const file = fileInput.files[0];

    if (!file) {
        errorDisplay.innerHTML = '<p class="error-message">Por favor seleccione un archivo.</p>';
        return;
    }

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    if (fileExtension.toLowerCase() !== 'csv') {
        errorDisplay.innerHTML = '<p class="error-message">El archivo no es de tipo .csv</p>';
        return;
    }

    if (!/^[^\s]+_\d+$/.test(fileName.split('.')[0])) {
        errorDisplay.innerHTML = '<p class="error-message">El nombre del archivo no cumple con el formato requerido. AquÃ­ un ejemplo de como debe ser "Promociones_1234567".</p>';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n');

        let errorHTML = '';
        const separator = lines[0].includes(';') ? ';' : ',';
        if (separator !== ',') {
            errorHTML += '<p class="error-message">El separador de columnas no es una coma (,).</p>';
        }

        const headers = lines[0].split(separator).map(header => header.trim().replace(/^"(.+(?="$))"$/, '$1')); // Acepta encabezados con o sin comillas dobles
        const requiredHeaders = ['campaign_name', 'reason', 'start_date', 'end_date', 'discounted_price', 'campaign_status'];
        const optionalHeaders = ['barcode', 'sku', 'max_no_of_orders'];
        const allowedHeaders = [...requiredHeaders, ...optionalHeaders];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        const unknownColumns = headers.filter(header => !allowedHeaders.includes(header));

        if (missingHeaders.length > 0) {
            errorHTML += `<p class="error-message">Faltan los siguientes encabezados: ${missingHeaders.join(', ')}.</p>`;
        }

        if (unknownColumns.length > 0) {
            errorHTML += `<p class="error-message">El archivo contiene columnas no permitidas: ${unknownColumns.join(', ')}.</p>`;
        }

        let firstValues = null;
        let errorCount = 0;
        const maxErrorsToShow = 100; // Limitar el nÃºmero de errores a mostrar

        for (let i = 1; i < lines.length; i++) {
            if (errorCount >= maxErrorsToShow) {
                errorHTML += `<p class="error-message">Se han encontrado ${maxErrorsToShow} errores. Por favor revise el archivo.</p>`;
                break;
            }

            const line = lines[i].trim();
            if (line === '') continue;

            if (line.includes(';') && separator === ',') {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Se encontrÃ³ un separador de columnas incorrecto.</p>`;
                errorCount++;
                continue;
            } else if (line.includes(',') && separator === ';') {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Se encontrÃ³ un separador de columnas incorrecto.</p>`;
                errorCount++;
                continue;
            }

            const values = line.split(separator).map(value => value.trim().replace(/^"(.+(?="$))"$/, '$1')); // Acepta valores con o sin comillas dobles
            const barcodeIndex = headers.indexOf('barcode');
            const skuIndex = headers.indexOf('sku');

            if ((barcodeIndex !== -1 && skuIndex !== -1 && (values[barcodeIndex] && values[skuIndex])) ||
                (barcodeIndex === -1 && skuIndex === -1)) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Por cada registro debe existir informaciÃ³n solo para 'barcode' o 'sku'.</p>`;
                errorCount++;
            }

            headers.forEach(header => {
                const index = headers.indexOf(header);
                const value = values[index];
                if (header === 'max_no_of_orders') {
                    if (value.trim() !== '' && (isNaN(value) || value <= 0)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'max_no_of_orders' debe ser numÃ©rico y mayor que 0 o estar vacÃ­o.</p>`;
                        errorCount++;
                    }
                } else if (header === 'discounted_price') {
                    const price = parseFloat(value.replace(',', '.'));
                    if (isNaN(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'discounted_price' debe ser numÃ©rico, mayor que 0, y tener como mÃ¡ximo dos decimales. Se encontrÃ³ un valor de ${value}.</p>`;
                        errorCount++;
                    }
                } else if (header === 'start_date' || header === 'end_date') {
                    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo '${header}' debe tener el formato AAAA-MM-DD HH:MM:SS.</p>`;
                        errorCount++;
                    }
                } else if (header === 'campaign_status') {
                    if (!['1', '0', 'TRUE', 'FALSE', 'true', 'false'].includes(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'campaign_status' debe ser booleano (1, 0, TRUE, FALSE).</p>`;
                        errorCount++;
                    }
                } else if (header === 'campaign_name' || header === 'reason') {
                    if (typeof value !== 'string' || value.trim() === '') {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo '${header}' debe ser de tipo string y no estar vacÃ­o.</p>`;
                        errorCount++;
                    }
                }
            });

            // ComparaciÃ³n de valores de la primera lÃ­nea
            if (i === 1) {
                firstValues = values;
            } else if (firstValues) {
                ['campaign_name', 'reason', 'start_date', 'end_date', 'max_no_of_orders'].forEach(header => {
                    const index = headers.indexOf(header);
                    if (index !== -1 && values[index] !== firstValues[index]) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El valor del campo '${header}' no coincide con el valor de la primera lÃ­nea.</p>`;
                        errorCount++;
                    }
                });
            }
        }

        if (errorCount > 0) {
            errorHTML = `<p class="error-message">Se encontraron ${errorCount} errores</p>` + errorHTML;
        } else if (unknownColumns.length === 0 && missingHeaders.length === 0) {
            errorHTML = '<p class="success-message">Â¡Bien, el archivo se encuentra correcto!</p>';
        }

        errorDisplay.innerHTML = errorHTML;
    };

    reader.readAsText(file, 'UTF-8');
}
