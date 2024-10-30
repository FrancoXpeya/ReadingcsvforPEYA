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

    // Validar el nombre del archivo
    const fileNamePattern = /^[^\d_]+$/;
    if (!fileNamePattern.test(fileName.split('.')[0])) {
        errorDisplay.innerHTML = '<p class="error-message">El nombre del archivo debe contener solamente letras o caracteres especiales, y no debe tener guiones bajos ni nÃºmeros. AquÃ­ un ejemplo de como debe ser "PromocionesEspecial".</p>';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split(/\r?\n/);

        let errorHTML = '';
        let separator = lines[0].includes(';') ? ';' : ',';
        if (separator !== ',') {
            errorHTML += '<p class="error-message">El separador de columnas no es una coma (,).</p>';
        }

        const headers = lines[0].split(separator).map(header => header.replace(/^"|"$/g, '').trim());

        const requiredHeaders = ['campaign_name', 'reason', 'start_date', 'end_date', 'discounted_price', 'campaign_status', 'vendors', 'exclude'];
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

        let firstVendorsValue = null;
        let firstExcludeValue = null;
        let errorCount = 0;
        const maxErrorsToShow = 100;

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

            // if continue without

            const values = line.split(separator).map(value => value.replace(/^"|"$/g, '').trim());

            const barcodeIndex = headers.indexOf('barcode');
            const skuIndex = headers.indexOf('sku');

            if ((barcodeIndex !== -1 && skuIndex !== -1 && (values[barcodeIndex] && values[skuIndex])) ||
                (barcodeIndex === -1 && skuIndex === -1) ||
                (barcodeIndex !== -1 && !values[barcodeIndex] && skuIndex !== -1 && !values[skuIndex])) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Por cada registro debe existir informaciÃ³n solo para 'barcode' o 'sku'.</p>`;
                errorCount++;
            }

            headers.forEach((header, index) => {
                const value = values[index];

                if (header === 'max_no_of_orders') {
                    if (value !== '' && (isNaN(value) || +value <= 0)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'max_no_of_orders' debe ser numÃ©rico y mayor que 0 o estar vacÃ­o.</p>`;
                        errorCount++;
                    }
                } else if (header === 'discounted_price') {
                    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'discounted_price' debe ser numÃ©rico con hasta dos decimales y mayor que 0.</p>`;
                        errorCount++;
                    } else if (+value <= 0) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'discounted_price' debe ser mayor que 0.</p>`;
                        errorCount++;
                    }
                } else if (header === 'start_date' || header === 'end_date') {
                    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo '${header}' debe tener el formato AAAA-MM-DD HH:MM:SS.</p>`;
                        errorCount++;
                    }
                } else if (header === 'campaign_status') {
                    if (!['1', '0', 'TRUE', 'FALSE', 'true', 'false'].includes(value.toUpperCase())) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'campaign_status' debe ser booleano (1, 0, TRUE, FALSE).</p>`;
                        errorCount++;
                    }
                } else if (header === 'campaign_name' || header === 'reason') {
                    if (typeof value !== 'string' || value === '') {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo '${header}' debe ser de tipo string y no estar vacÃ­o.</p>`;
                        errorCount++;
                    }
                } else if (header === 'vendors') {
                    if (!/^all$|^\d+(,\d+)*$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'vendors' debe ser 'all' o nÃºmeros separados por comas.</p>`;
                        errorCount++;
                    } else {
                        if (i === 1) {
                            firstVendorsValue = value;
                        } else if (value !== firstVendorsValue) {
                            errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El valor del campo 'vendors' no coincide con el valor de la primera lÃ­nea.</p>`;
                            errorCount++;
                        }
                    }
                } else if (header === 'exclude') {
                    const vendorsValue = values[headers.indexOf('vendors')];
                    if (vendorsValue === 'all' && value !== '' && !/^\d+(,\d+)*$/.test(value)) {
                        errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'exclude' solo puede contener nÃºmeros separados por comas si 'vendors' es 'all'.</p>`;
                        errorCount++;
                    } else {
                        if (i === 1) {
                            firstExcludeValue = value;
                        } else if (value !== firstExcludeValue) {
                            errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El valor del campo 'exclude' no coincide con el valor de la primera lÃ­nea.</p>`;
                            errorCount++;
                        }
                    }
                }
            });
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
