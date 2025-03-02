document.addEventListener('DOMContentLoaded', () => {
  // Elementos principales
  const urlsTextarea = document.getElementById('urlsTextarea');
  const saveBtn = document.getElementById('saveBtn');
  const validateBtn = document.getElementById('validateBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const backBtn = document.getElementById('backBtn');
  const homeLink = document.getElementById('homeLink');
  const messageContainer = document.getElementById('messageContainer');
  const validUrlsCount = document.getElementById('validUrlsCount');
  const invalidUrlsCount = document.getElementById('invalidUrlsCount');
  const totalUrlsCount = document.getElementById('totalUrlsCount');
  const urlListContainer = document.getElementById('urlListContainer');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // Elementos de pestañas
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // URLs almacenadas
  let storedUrls = [];
  
  // Cargar URLs guardadas
  loadSavedUrls();
  
  // ===== Funciones para gestionar URLs =====
  
  function loadSavedUrls() {
    chrome.storage.local.get(['savedUrls'], (result) => {
      if (result.savedUrls && Array.isArray(result.savedUrls)) {
        storedUrls = result.savedUrls;
        urlsTextarea.value = storedUrls.join('\n');
        renderUrlList();
        updateUrlStats();
      }
    });
  }
  
  function saveUrls(urls) {
    chrome.storage.local.set({ savedUrls: urls }, () => {
      showMessage('success', '✅ Enlaces guardados correctamente');
    });
  }
  
  function validateUrl(url) {
    try {
      url = url.trim();
      if (!url) return false;
      
      const urlObj = new URL(url);
      const isValidPath = /\/item\/.+\-\d{6,}$/.test(urlObj.pathname);
      return urlObj.hostname.includes('wallapop.com') && isValidPath;
    } catch {
      return false;
    }
  }
  
  function validateUrls(urlsText) {
    const lines = urlsText.split('\n');
    const validUrls = [];
    const invalidUrls = [];
    
    lines.forEach(line => {
      const url = line.trim();
      if (url) {
        if (validateUrl(url)) {
          validUrls.push(url);
        } else {
          invalidUrls.push(url);
        }
      }
    });
    
    return { validUrls, invalidUrls };
  }
  
  function updateUrlStats() {
    // Validar todas las URLs actuales
    const { validUrls, invalidUrls } = validateUrls(urlsTextarea.value);
    
    // Actualizar contadores
    validUrlsCount.textContent = validUrls.length;
    invalidUrlsCount.textContent = invalidUrls.length;
    totalUrlsCount.textContent = validUrls.length + invalidUrls.length;
  }
  
  function showMessage(type, message, duration = 5000) {
    // Eliminar mensajes previos
    messageContainer.innerHTML = '';
    
    // Crear elemento de mensaje
    const messageBox = document.createElement('div');
    messageBox.className = `info-box ${type}`;
    
    // Icono apropiado según tipo de mensaje
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'exclamation-circle';
    
    messageBox.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <div class="info-content">
        <p>${message}</p>
      </div>
    `;
    
    // Añadir a contenedor
    messageContainer.appendChild(messageBox);
    
    // Auto-eliminar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        messageBox.remove();
      }, duration);
    }
  }
  
  // ===== Funciones para la interfaz de usuario =====
  
  function switchTab(tabIndex) {
    tabs.forEach((tab, index) => {
      if (index === tabIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    tabContents.forEach((content, index) => {
      if (index === tabIndex) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }
  
  function renderUrlList() {
    // Limpiar la lista actual
    urlListContainer.innerHTML = '';
    
    // Obtener plantilla
    const template = document.getElementById('urlItemTemplate');
    
    // Añadir cada URL a la lista
    storedUrls.forEach((url, index) => {
      // Clonar la plantilla
      const urlItem = template.content.cloneNode(true);
      const urlItemDiv = urlItem.querySelector('.url-item');
      const urlText = urlItem.querySelector('.url-item-text');
      const editBtn = urlItem.querySelector('.edit-btn');
      const deleteBtn = urlItem.querySelector('.delete-btn');
      
      // Establecer texto e índice de URL
      urlText.textContent = url;
      urlItemDiv.dataset.index = index;
      
      // Añadir icono de validación
      const isValid = validateUrl(url);
      const validationIcon = document.createElement('i');
      validationIcon.className = `url-validation-icon ${isValid ? 'valid fas fa-check-circle' : 'invalid fas fa-exclamation-circle'}`;
      urlText.prepend(validationIcon);
      
      // Configurar botones
      editBtn.addEventListener('click', () => {
        editUrlItem(index);
      });
      
      deleteBtn.addEventListener('click', () => {
        deleteUrlItem(index);
      });
      
      // Añadir a la lista
      urlListContainer.appendChild(urlItem);
    });
    
    // Mostrar mensaje si la lista está vacía
    if (storedUrls.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'url-item';
      emptyMessage.style.justifyContent = 'center';
      emptyMessage.style.color = '#7f8c8d';
      emptyMessage.innerHTML = '<i class="fas fa-info-circle"></i> No hay enlaces guardados.';
      urlListContainer.appendChild(emptyMessage);
    }
  }
  
  function addUrlItem() {
    const url = prompt('Introduce el enlace de Wallapop:');
    if (url) {
      if (validateUrl(url)) {
        storedUrls.push(url);
        updateTextareaFromList();
        renderUrlList();
        updateUrlStats();
        showMessage('success', '✅ Enlace añadido correctamente');
      } else {
        showMessage('error', '❌ El enlace no es válido. Formato requerido: https://es.wallapop.com/item/título-del-producto-123456');
      }
    }
  }
  
  function editUrlItem(index) {
    const currentUrl = storedUrls[index];
    const newUrl = prompt('Editar enlace:', currentUrl);
    
    if (newUrl && newUrl !== currentUrl) {
      if (validateUrl(newUrl)) {
        storedUrls[index] = newUrl;
        updateTextareaFromList();
        renderUrlList();
        updateUrlStats();
        showMessage('success', '✅ Enlace actualizado correctamente');
      } else {
        showMessage('error', '❌ El enlace no es válido. Formato requerido: https://es.wallapop.com/item/título-del-producto-123456');
      }
    }
  }
  
  function deleteUrlItem(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
      storedUrls.splice(index, 1);
      updateTextareaFromList();
      renderUrlList();
      updateUrlStats();
      showMessage('success', '✅ Enlace eliminado correctamente');
    }
  }
  
  function clearAllUrls() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los enlaces?')) {
      storedUrls = [];
      updateTextareaFromList();
      renderUrlList();
      updateUrlStats();
      showMessage('success', '✅ Todos los enlaces han sido eliminados');
    }
  }
  
  function updateTextareaFromList() {
    urlsTextarea.value = storedUrls.join('\n');
  }
  
  function updateListFromTextarea() {
    const { validUrls } = validateUrls(urlsTextarea.value);
    storedUrls = validUrls;
    renderUrlList();
  }
  
  function exportUrls() {
    const { validUrls } = validateUrls(urlsTextarea.value);
    
    if (validUrls.length === 0) {
      showMessage('warning', '⚠️ No hay enlaces válidos para exportar');
      return;
    }
    
    try {
      // Crear objeto de datos
      const exportData = {
        format: 'wallapop-auto-updater',
        version: '2.1',
        timestamp: new Date().toISOString(),
        urls: validUrls
      };
      
      // Convertir a JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Crear blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Crear URL objeto
      const url = URL.createObjectURL(blob);
      
      // Crear elemento de enlace y simular clic
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallapop-links-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      
      // Liberar URL
      URL.revokeObjectURL(url);
      
      showMessage('success', `✅ Exportados ${validUrls.length} enlaces correctamente`);
    } catch (error) {
      console.error('Error al exportar:', error);
      showMessage('error', '❌ Error al exportar los enlaces');
    }
  }
  
  function importUrls() {
    fileInput.click();
  }
  
  function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        // Primero intentar como JSON
        const content = e.target.result;
        
        try {
          // Intentar parsear como JSON
          const jsonData = JSON.parse(content);
          
          if (jsonData.format === 'wallapop-auto-updater' && Array.isArray(jsonData.urls)) {
            const newUrls = jsonData.urls.filter(url => validateUrl(url));
            
            if (newUrls.length > 0) {
              // Preguntar si quiere reemplazar o añadir
              const action = confirm('¿Quieres reemplazar los enlaces existentes?\nAceptar = Reemplazar\nCancelar = Añadir');
              
              if (action) {
                // Reemplazar
                storedUrls = newUrls;
              } else {
                // Añadir (evitando duplicados)
                newUrls.forEach(url => {
                  if (!storedUrls.includes(url)) {
                    storedUrls.push(url);
                  }
                });
              }
              
              updateTextareaFromList();
              renderUrlList();
              updateUrlStats();
              showMessage('success', `✅ Importados ${newUrls.length} enlaces correctamente`);
            } else {
              showMessage('warning', '⚠️ No se encontraron enlaces válidos en el archivo');
            }
          } else {
            throw new Error('Formato JSON no válido');
          }
        } catch (jsonError) {
          // Si falla como JSON, intentar como texto plano
          const lines = content.split(/\r?\n/);
          const newUrls = lines.map(line => line.trim()).filter(url => validateUrl(url));
          
          if (newUrls.length > 0) {
            // Preguntar si quiere reemplazar o añadir
            const action = confirm('¿Quieres reemplazar los enlaces existentes?\nAceptar = Reemplazar\nCancelar = Añadir');
            
            if (action) {
              // Reemplazar
              storedUrls = newUrls;
            } else {
              // Añadir (evitando duplicados)
              newUrls.forEach(url => {
                if (!storedUrls.includes(url)) {
                  storedUrls.push(url);
                }
              });
            }
            
            updateTextareaFromList();
            renderUrlList();
            updateUrlStats();
            showMessage('success', `✅ Importados ${newUrls.length} enlaces correctamente`);
          } else {
            showMessage('warning', '⚠️ No se encontraron enlaces válidos en el archivo');
          }
        }
      } catch (error) {
        console.error('Error al importar:', error);
        showMessage('error', '❌ Error al importar el archivo');
      }
      
      // Resetear input de archivo
      fileInput.value = '';
    };
    
    reader.onerror = function() {
      showMessage('error', '❌ Error al leer el archivo');
      fileInput.value = '';
    };
    
    // Leer como texto
    reader.readAsText(file);
  }
  
  // ===== Event Listeners =====
  
  // Cambio de pestañas
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      switchTab(index);
    });
  });
  
  // Cambios en textarea
  urlsTextarea.addEventListener('input', () => {
    updateUrlStats();
  });
  
  urlsTextarea.addEventListener('blur', () => {
    updateListFromTextarea();
  });
  
  // Botón guardar
  saveBtn.addEventListener('click', () => {
    const { validUrls, invalidUrls } = validateUrls(urlsTextarea.value);
    
    if (validUrls.length === 0) {
      showMessage('error', '❌ No hay enlaces válidos para guardar. Formato requerido: https://es.wallapop.com/item/título-del-producto-123456');
      return;
    }
    
    if (invalidUrls.length > 0) {
      const continuar = confirm(`Se han encontrado ${invalidUrls.length} enlaces no válidos que serán ignorados. ¿Deseas continuar y guardar solo los ${validUrls.length} enlaces válidos?`);
      if (!continuar) return;
    }
    
    storedUrls = validUrls;
    saveUrls(validUrls);
    renderUrlList();
    updateUrlStats();
  });
  
  // Botón validar
  validateBtn.addEventListener('click', () => {
    const { validUrls, invalidUrls } = validateUrls(urlsTextarea.value);
    
    if (invalidUrls.length === 0 && validUrls.length > 0) {
      showMessage('success', `✅ Todos los enlaces (${validUrls.length}) son válidos.`);
    } else if (invalidUrls.length > 0) {
      showMessage('warning', `⚠️ Se encontraron ${invalidUrls.length} enlaces no válidos de un total de ${validUrls.length + invalidUrls.length}.`);
      
      // Marcar enlaces inválidos en textarea
      const lines = urlsTextarea.value.split('\n');
      const markedLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !validateUrl(trimmedLine)) {
          return `❌ ${line}`;
        }
        return line;
      });
      
      urlsTextarea.value = markedLines.join('\n');
    } else {
      showMessage('warning', '⚠️ No hay enlaces para validar.');
    }
  });
  
  // Botón exportar
  exportBtn.addEventListener('click', exportUrls);
  
  // Botón importar
  importBtn.addEventListener('click', importUrls);
  
  // Input de archivo
  fileInput.addEventListener('change', handleFileImport);
  
  // Botones de lista
  addUrlBtn.addEventListener('click', addUrlItem);
  clearAllBtn.addEventListener('click', clearAllUrls);
  
  // Botones de navegación
  backBtn.addEventListener('click', () => {
    window.close();
  });
  
  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });
  
  // Inicializar estadísticas de URL
  updateUrlStats();
});
