// ============================================
// LINGUAAI - APP PRINCIPAL
// ============================================

// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 LinguaAI iniciando...');
    
    // Verificar modo administrador
    if (window.location.search.includes('admin=true') && !window.location.pathname.includes('admin.html')) {
        console.log('🔐 Redirigiendo a panel admin...');
        window.location.href = '/admin.html?admin=true';
        return;
    }
    
    // Inicializar sistema de autenticación si no existe
    if (!window.auth) {
        console.log('📝 Inicializando sistema de autenticación...');
        // auth.js ya debería estar cargado
    }
    
    // Mostrar información del usuario
    function updateUserInfo() {
        const user = window.auth?.getCurrentUser();
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const licenseStatus = document.getElementById('licenseStatus');
        const versionBadge = document.getElementById('versionBadge');
        
        if (user) {
            if (userEmailDisplay) {
                userEmailDisplay.textContent = user.email || (user.isPro ? 'Usuario Pro' : 'Usuario Demo');
            }
            if (licenseStatus) {
                licenseStatus.textContent = user.isPro ? '💎 PRO' : '📘 Demo Mode';
                licenseStatus.style.color = user.isPro ? '#ffd700' : '#00d4ff';
            }
            if (versionBadge) {
                versionBadge.textContent = user.isPro ? 'PRO' : 'DEMO';
                versionBadge.style.background = user.isPro ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 212, 255, 0.2)';
                versionBadge.style.borderColor = user.isPro ? '#ffd700' : '#00d4ff';
            }
            
            // Mostrar mensaje de bienvenida personalizado
            setTimeout(() => {
                if (window.chat && !sessionStorage.getItem('welcome_shown')) {
                    const welcomeMsg = user.isPro 
                        ? `🎉 ¡Bienvenido de nuevo, ${user.email || 'Usuario Pro'}! Tienes acceso ilimitado a todas las funciones. ¿Qué idioma quieres practicar hoy?`
                        : `📘 Hola ${user.email || 'Usuario Demo'}! Tienes ${window.auth?.getRemainingMessages() || 10} mensajes gratis hoy. ¿Qué te gustaría aprender?`;
                    
                    if (window.chat.addMessage) {
                        window.chat.addMessage('system', welcomeMsg);
                        sessionStorage.setItem('welcome_shown', 'true');
                    }
                }
            }, 1500);
        }
    }
    
    // Actualizar indicador de mensajes restantes
    function updateUsageIndicator() {
        const user = window.auth?.getCurrentUser();
        const indicator = document.getElementById('remainingMessages');
        const container = document.getElementById('usageIndicator');
        
        if (container && indicator) {
            if (user?.isPro) {
                container.innerHTML = '💎 <span id="remainingMessages">∞</span> mensajes ilimitados (PRO)';
                container.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1))';
                container.style.border = '1px solid rgba(255,215,0,0.3)';
            } else {
                const remaining = window.auth?.getRemainingMessages() || 0;
                indicator.textContent = remaining;
                container.innerHTML = '📘 <span id="remainingMessages">' + remaining + '</span> mensajes restantes hoy';
                container.style.background = 'rgba(0, 212, 255, 0.1)';
                container.style.border = '1px solid rgba(0, 212, 255, 0.2)';
                
                if (remaining === 0) {
                    container.style.background = 'rgba(255, 0, 0, 0.15)';
                    container.style.border = '1px solid #ff4444';
                    container.innerHTML = '⚠️ <span id="remainingMessages">0</span> mensajes restantes. ¡Actualiza a PRO!';
                } else if (remaining <= 3) {
                    container.style.background = 'rgba(255, 165, 0, 0.15)';
                    container.style.border = '1px solid #ffa500';
                }
            }
        }
    }
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator && !window.location.hostname === 'localhost') {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('✅ Service Worker registrado:', reg.scope);
            })
            .catch(err => {
                console.log('⚠️ Service Worker error:', err);
            });
    }
    
    // Detectar si la app se puede instalar como PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación opcional
        const installBtn = document.createElement('button');
        installBtn.innerHTML = '📱 Instalar App';
        installBtn.className = 'install-btn';
        installBtn.style.position = 'fixed';
        installBtn.style.bottom = '20px';
        installBtn.style.right = '20px';
        installBtn.style.zIndex = '1000';
        installBtn.style.background = 'linear-gradient(135deg, #00d4ff, #7c3aed)';
        installBtn.style.border = 'none';
        installBtn.style.borderRadius = '50px';
        installBtn.style.padding = '12px 20px';
        installBtn.style.color = 'white';
        installBtn.style.cursor = 'pointer';
        installBtn.style.fontWeight = 'bold';
        installBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        
        installBtn.onclick = () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ Usuario instaló la PWA');
                }
                installBtn.remove();
                deferredPrompt = null;
            });
        };
        
        document.body.appendChild(installBtn);
        
        // Ocultar botón después de 10 segundos
        setTimeout(() => {
            if (installBtn && installBtn.parentNode) {
                installBtn.style.opacity = '0';
                setTimeout(() => installBtn.remove(), 1000);
            }
        }, 10000);
    });
    
    // Manejar visibilidad de la app (cuando vuelve a primer plano)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ App visible nuevamente');
            updateUsageIndicator();
            updateUserInfo();
            
            // Recargar historial si es necesario
            if (window.chat && window.chat.loadHistory) {
                window.chat.loadHistory();
            }
        }
    });
    
    // Configurar atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + N: Nuevo chat
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('menuNewChat')?.click();
        }
        // Ctrl + K: Configurar API Key
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('menuApiKey')?.click();
        }
        // Ctrl + L: Cerrar sesión
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            document.getElementById('menuLogout')?.click();
        }
        // Ctrl + H: Abrir/cerrar menú
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.toggleMenu?.();
        }
    });
    
    // Configurar auto-resize del textarea
    const textarea = document.getElementById('userInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
    
    // Guardar última conversación antes de cerrar
    window.addEventListener('beforeunload', () => {
        if (window.chat && window.chat.saveHistory) {
            window.chat.saveHistory();
        }
    });
    
    // Animación de entrada para los mensajes existentes
    const messages = document.querySelectorAll('.message');
    messages.forEach((msg, index) => {
        msg.style.animation = `fadeIn 0.3s ease ${index * 0.05}s`;
    });
    
    // Configurar selector de idioma con efecto visual
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const selectedLang = e.target.options[e.target.selectedIndex].text;
            console.log(`🌐 Idioma cambiado a: ${selectedLang}`);
            
            // Mostrar notificación visual
            const notification = document.createElement('div');
            notification.className = 'language-notification';
            notification.innerHTML = `🌐 Cambiado a ${selectedLang}`;
            notification.style.position = 'fixed';
            notification.style.bottom = '100px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.background = 'rgba(0, 212, 255, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '8px 16px';
            notification.style.borderRadius = '20px';
            notification.style.fontSize = '0.9rem';
            notification.style.zIndex = '1000';
            notification.style.backdropFilter = 'blur(10px)';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 500);
            }, 2000);
        });
    }
    
    // Inicializar todo
    updateUserInfo();
    updateUsageIndicator();
    
    // Actualizar indicador cada minuto
    setInterval(updateUsageIndicator, 60000);
    
    // Verificar si el chat se inicializó correctamente
    setTimeout(() => {
        if (!window.chat) {
            console.error('❌ Chat no inicializado. Verificando...');
            if (typeof LinguaAIChat !== 'undefined') {
                console.log('🔄 Reinicializando chat...');
                window.chat = new LinguaAIChat();
            }
        } else {
            console.log('✅ Chat inicializado correctamente');
        }
    }, 2000);
    
    console.log('✅ LinguaAI lista para usar');
});

// Función para mostrar toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = type === 'error' ? 'rgba(255, 68, 68, 0.95)' : 'rgba(0, 212, 255, 0.95)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.fontSize = '0.9rem';
    toast.style.zIndex = '2000';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    toast.style.fontWeight = 'bold';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Función para verificar conexión a internet
function checkOnlineStatus() {
    const status = navigator.onLine;
    if (!status) {
        showToast('📡 Sin conexión a internet. Usando modo offline.', 'warning');
    }
    return status;
}

window.addEventListener('online', () => {
    showToast('✅ Conexión restablecida', 'success');
});

window.addEventListener('offline', () => {
    showToast('⚠️ Sin conexión a internet', 'warning');
});

// Exportar funciones globales
window.showToast = showToast;
window.checkOnlineStatus = checkOnlineStatus;
