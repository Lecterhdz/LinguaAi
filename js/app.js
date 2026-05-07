// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    // Verificar admin
    if (window.location.search.includes('admin=true')) {
        window.location.href = '/admin.html';
        return;
    }
    
    // Mostrar mensaje de bienvenida con voz
    setTimeout(() => {
        const welcomeMsg = "¡Hola! Soy LinguaAI, tu tutora personal de idiomas. ¿Qué te gustaría practicar hoy?";
        if (window.chat) {
            window.chat.speak(welcomeMsg, 'Spanish');
        }
    }, 1000);
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('PWA registrada:', reg);
        });
    }
});
