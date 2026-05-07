// Agregar al menú hamburguesa - opción para configurar API key
document.addEventListener('DOMContentLoaded', () => {
    // ... tu código existente ...
    
    // Añadir botón de API key si no existe
    const menuItems = document.querySelector('.menu-items');
    if (menuItems && !document.getElementById('menuApiKey')) {
        const apiKeyItem = document.createElement('li');
        apiKeyItem.innerHTML = '<button class="menu-item" id="menuApiKey">🔑 Configurar API Key</button>';
        const upgradeItem = document.getElementById('menuUpgrade');
        if (upgradeItem) {
            upgradeItem.parentNode.insertBefore(apiKeyItem, upgradeItem);
        } else {
            menuItems.appendChild(apiKeyItem);
        }
    }
    
    // Configurar API key
    document.getElementById('menuApiKey')?.addEventListener('click', () => {
        if (window.chat) {
            window.chat.promptForApiKey();
        } else {
            alert('Espera a que la app cargue completamente');
        }
    });
});
