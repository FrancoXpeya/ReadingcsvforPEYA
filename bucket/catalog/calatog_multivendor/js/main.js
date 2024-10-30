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
        errorDisplay.innerHTML = '<p class="error-message">El nombre del archivo debe contener solamente letras o caracteres especiales, y no debe tener guiones bajos ni nÃºmeros. AquÃ­ un ejemplo de como debe ser "CatalogoEspecial".</p>';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n');

        let errorHTML = '';
        let errorCount = 0;
        const maxErrorsToShow = 100;

        const separator = lines[0].includes(';') ? ';' : ',';
        if (separator !== ',') {
            errorHTML += '<p class="error-message">El separador de columnas no es una coma (,).</p>';
            errorCount++;
        }

        const headers = parseCSVLine(lines[0], separator).map(header => header.trim());
        const requiredHeaders = ['price', 'vendors'];
        const optionalHeaders = ['barcode', 'sku', 'active', 'quantity'];
        const allowedHeaders = requiredHeaders.concat(optionalHeaders);

        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        const presentOptionalHeaders = optionalHeaders.filter(header => headers.includes(header));
        const hasActive = headers.includes('active');
        const hasQuantity = headers.includes('quantity');

        // Check for missing required headers
        if (missingHeaders.length > 0) {
            errorHTML += `<p class="error-message">Faltan los siguientes encabezados: ${missingHeaders.join(', ')}.</p>`;
            errorCount++;
        }

        // Check for additional headers
        const extraHeaders = headers.filter(header => !allowedHeaders.includes(header));
        if (extraHeaders.length > 0) {
            errorHTML += `<p class="error-message">El archivo contiene columnas no permitidas: ${extraHeaders.join(', ')}.</p>`;
            errorCount++;
        }

        // Validate 'active' and 'quantity'
        if (hasActive && hasQuantity) {
            errorHTML += '<p class="error-message">No puede haber tanto "active" como "quantity" en el archivo. Debe haber solo uno de ellos.</p>';
            errorCount++;
        }

        if (!hasActive && !hasQuantity) {
            errorHTML += '<p class="error-message">El archivo debe contener al menos uno de los encabezados: "active" o "quantity".</p>';
            errorCount++;
        }

        // Check for optional headers validation
        if (presentOptionalHeaders.length === 0) {
            errorHTML += '<p class="error-message">Debe existir al menos una de las columnas: "barcode", "sku", "active", "quantity".</p>';
            errorCount++;
        }

        for (let i = 1; i < lines.length; i++) {
            if (errorCount >= maxErrorsToShow) {
                errorHTML += `<p class="error-message">Se han encontrado mÃ¡s de ${maxErrorsToShow} errores. Por favor revise el archivo.</p>`;
                break;
            }

            const line = lines[i].trim();
            if (line === '') continue;

            const values = parseCSVLine(line, separator).map(value => value.trim());

            if (values.length > headers.length) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Se encontraron mÃ¡s valores de los esperados.</p>`;
                errorCount++;
            }

            const barcodeIndex = headers.indexOf('barcode');
            const skuIndex = headers.indexOf('sku');
            const quantityIndex = headers.indexOf('quantity');
            const vendorsIndex = headers.indexOf('vendors');
            const activeIndex = headers.indexOf('active');
            const barcodeValue = barcodeIndex !== -1 ? values[barcodeIndex] : '';
            const skuValue = skuIndex !== -1 ? values[skuIndex] : '';
            const quantityValue = quantityIndex !== -1 ? values[quantityIndex] : '';
            const vendorsValue = vendorsIndex !== -1 ? values[vendorsIndex] : '';
            const activeValue = activeIndex !== -1 ? values[activeIndex] : '';

            if (barcodeIndex !== -1 && skuIndex !== -1 && barcodeValue && skuValue) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Por cada registro debe existir informaciÃ³n solo para 'barcode' o 'sku'.</p>`;
                errorCount++;
            }

            if ((barcodeIndex !== -1 && !barcodeValue && skuIndex === -1) || (skuIndex !== -1 && !skuValue && barcodeIndex === -1) || (barcodeIndex !== -1 && !barcodeValue && skuIndex !== -1 && !skuValue)) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: Por cada registro debe existir informaciÃ³n en 'barcode' o 'sku' y no deben estar vacÃ­os.</p>`;
                errorCount++;
            }

            if (barcodeIndex !== -1 && barcodeValue && !/^[a-zA-Z0-9]+$/.test(barcodeValue)) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'barcode' debe ser alfanumÃ©rico.</p>`;
                errorCount++;
            }

            if (skuIndex !== -1 && skuValue && !/^[a-zA-Z0-9]+$/.test(skuValue)) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'sku' debe ser alfanumÃ©rico.</p>`;
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

            if (quantityIndex !== -1) {
                const quantity = values[quantityIndex];
                if (!/^\d+$/.test(quantity) || parseInt(quantity, 10) <= 0) {
                    errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'quantity' debe ser un nÃºmero entero mayor que cero.</p>`;
                    errorCount++;
                }
            }
            

            if (activeIndex !== -1) {
                if (!/^(TRUE|FALSE|1|0)$/.test(activeValue)) {
                    errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'active' debe ser 'TRUE', 'FALSE', '1' o '0'.</p>`;
                    errorCount++;
                }
            }

            if (vendorsIndex !== -1 && !vendorsValue) {
                errorHTML += `<p class="error-message">Error en la lÃ­nea ${i + 1}: El campo 'vendors' no debe estar vacÃ­o.</p>`;
                errorCount++;
            }
        }

        if (errorCount > 0) {
            errorHTML = `<p class="error-message">Se encontraron ${errorCount} errores</p>` + errorHTML;
        } else {
            errorHTML = '<p class="success-message">Â¡Bien, el archivo se encuentra correcto!</p>';
        }

        errorDisplay.innerHTML = errorHTML;
    };

    reader.readAsText(file, 'UTF-8');
}

function parseCSVLine(line, separator) {
    let values = [];
    let insideQuote = false;
    let currentValue = '';

    for (let char of line) {
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === separator && !insideQuote) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    values.push(currentValue);

    return values;
}
