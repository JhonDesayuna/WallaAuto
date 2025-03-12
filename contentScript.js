let lastProcessedUrl = null; // Para evitar ejecuciones repetidas en la misma URL
let isAutomationActive = false; // Bandera para controlar si la automatización está activa

// Verificar el estado de la extensión al cargar
chrome.runtime.sendMessage({ action: "getStatus" }, response => {
  if (response && typeof response.isRunning !== 'undefined') {
    isAutomationActive = response.isRunning;
    console.log(`Estado de automatización: ${isAutomationActive ? "Activo" : "Inactivo"}`);
    
    // Solo ejecutamos main al inicio si la automatización está activa
    if (isAutomationActive) {
      main();
    }
  }
});

function detectPageType() {
  const path = window.location.pathname;
  if (path.includes("/item/")) return "DETAIL";
  if (path.includes("/app/catalog/edit/")) return "EDIT";
  if (path.includes("/app/catalog/published")) return "PUBLISHED";
  return "OTHER";
}

function handleDetailPage() {
  console.log("📌 Detectada página de detalle, intentando redirigir a edición...");
  setTimeout(() => {
    const editButton = document.querySelector('button.item-detail-square-button_ItemDetailSquareButton--edit__FRjPo');
    if (editButton) {
      editButton.click();
    } else {
      console.error("❌ Botón Editar no encontrado.");
      chrome.runtime.sendMessage({ action: "updateFailed", reason: "Edit button not found" });
    }
  }, 2000);
}

function handleEditPage() {
  console.log("📌 Detectada página de edición, buscando botón de actualización...");
  setTimeout(() => {
    const wallaButtons = document.querySelectorAll("walla-button");
    let updateClicked = false;

    wallaButtons.forEach(button => {
      if (button.shadowRoot) {
        const btn = button.shadowRoot.querySelector("button");
        if (btn?.innerText.includes("Actualizar")) {
          btn.click();
          updateClicked = true;

          // Ya no necesitamos enviar el mensaje aquí, lo haremos cuando detectemos la página published
        }
      }
    });

    if (!updateClicked) {
      console.error("❌ Botón Actualizar no encontrado.");
      chrome.runtime.sendMessage({ action: "updateFailed", reason: "Update button not found" });
    }
  }, 4000);
}

function handlePublishedPage() {
  console.log("✅ Producto actualizado correctamente, notificando éxito...");
  chrome.runtime.sendMessage({ action: "updateCompleted" });
}

function main() {
  // No hacer nada si la automatización no está activa
  if (!isAutomationActive) {
    console.log("⏸️ La automatización está inactiva, no se realizará ninguna acción.");
    return;
  }

  const currentUrl = window.location.href;
  if (currentUrl === lastProcessedUrl) return; // Evitar ejecuciones repetidas en la misma URL

  lastProcessedUrl = currentUrl;
  const pageType = detectPageType();
  console.log(`📌 Tipo de página detectado: ${pageType} - URL: ${currentUrl}`);

  switch (pageType) {
    case "DETAIL":
      handleDetailPage();
      break;
    case "EDIT":
      handleEditPage();
      break;
    case "PUBLISHED":
      handlePublishedPage();
      break;
    default:
      console.warn(`⚠️ Página no compatible: ${currentUrl}`);
  }
}

// Ejecutar `main` cuando la URL cambie y escuchar cambios en el estado de la extensión
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "urlChanged") {
    // Verificar el estado actual antes de procesar
    chrome.runtime.sendMessage({ action: "getStatus" }, response => {
      if (response && response.isRunning) {
        isAutomationActive = true;
        main();
      } else {
        isAutomationActive = false;
        console.log("⏸️ La automatización está inactiva, no se realizarán acciones.");
      }
    });
  } 
  // También podemos escuchar mensajes de cambio de estado directamente
  else if (message.action === "stateChanged") {
    isAutomationActive = message.isRunning;
    console.log(`Estado de automatización actualizado: ${isAutomationActive ? "Activo" : "Inactivo"}`);
  }
});

// NO ejecutamos main automáticamente al cargar, solo cuando verificamos que la automatización está activa