// Menú hamburguesa con overlay transparente y funcionalidades completas

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const hamburger = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    
    // Función para alternar el menú
    function toggleMenu() {
        if (!hamburger || !sideMenu || !overlay) return;
        
        hamburger.classList.toggle('active');
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevenir scroll cuando el menú está abierto
        if (sideMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    
    // Event listeners para abrir/cerrar menú
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }
    
    // Cerrar menú con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu?.classList.contains('active')) {
            toggleMenu();
        }
    });
    
    // ========== ACCIONES DEL MENÚ ==========
    
    // 1. Nuevo Chat
    const menuNewChat = document.getElementById('menuNewChat');
    if (menuNewChat) {
        menuNewChat.addEventListener('click', () => {
            if (confirm('¿Iniciar un nuevo chat? Se borrará la conversación actual.')) {
                if (window.chat) {
                    window.chat.clearHistory();
                    window.chat.messages = [];
                }
                // Recargar la página para resetear todo
                location.reload();
            }
            toggleMenu();
        });
    }
    
    // 2. Borrar Historial
    const menuClearHistory = document.getElementById('menuClearHistory');
    if (menuClearHistory) {
        menuClearHistory.addEventListener('click', () => {
            if (confirm('¿Borrar todo el historial de conversación? Esta acción no se puede deshacer.')) {
                if (window.chat) {
                    window.chat.clearHistory();
                }
                // Limpiar localStorage del usuario actual
                const user = window.auth?.getCurrentUser();
                if (user) {
                    localStorage.removeItem(`chat_history_${user.license}`);
                }
                // Mostrar mensaje de confirmación
                const messagesDiv = document.getElementById('chatMessages');
                if (messagesDiv && window.chat) {
                    messagesDiv.innerHTML = `
                        <div class="welcome-message">
                            <div class="ai-icon">🗑️</div>
                            <h2>Historial <span class="ai-glow">borrado</span></h2>
                            <p>Tu historial de conversación ha sido eliminado.<br>¡Comienza una nueva práctica!</p>
                        </div>
                    `;
                    window.chat.messages = [];
                }
            }
            toggleMenu();
        });
    }
    
    // 3. Configurar API Key (NUEVA OPCIÓN)
    const menuApiKey = document.getElementById('menuApiKey');
    if (menuApiKey) {
        menuApiKey.addEventListener('click', () => {
            const hasKey = sessionStorage.getItem('groq_api_key') || localStorage.getItem('groq_api_key');
            
            const option = confirm(
                hasKey ? 
                '🔑 Configuración de API Key\n\n✓ Aceptar = Cambiar API Key\n✗ Cancelar = Eliminar API Key actual' :
                '🔑 Configurar API Key de Groq\n\n✓ Aceptar = Agregar nueva API Key\n✗ Cancelar = Cancelar'
            );
            
            if (option) {
                // Cambiar/Agregar API key
                const newKey = prompt(
                    '🔑 Ingresa tu API Key de Groq:\n\n' +
                    '1. Ve a https://console.groq.com\n' +
                    '2. Inicia sesión o regístrate\n' +
                    '3. Ve a "API Keys" → "Create API Key"\n' +
                    '4. Copia la key (empieza con gsk_)\n' +
                    '5. Pégala aquí abajo:\n\n' +
                    '¿Guardar permanentemente? (OK = sí, Cancelar = solo por hoy)'
                );
                
                if (newKey && newKey.startsWith('gsk_')) {
                    const persistent = confirm('¿Guardar la key permanentemente en este dispositivo?\n\nOK = Sí, la recordaré\nCancelar = Solo por hoy');
                    
                    if (persistent) {
                        localStorage.setItem('groq_api_key', newKey);
                        sessionStorage.removeItem('groq_api_key');
                        alert('✅ API Key guardada permanentemente');
                    } else {
                        sessionStorage.setItem('groq_api_key', newKey);
                        localStorage.removeItem('groq_api_key');
                        alert('✅ API Key guardada solo para esta sesión');
                    }
                    
                    // Recargar el chat para aplicar cambios
                    if (window.chat) {
                        window.chat.GROQ_API_KEY = newKey;
                        // Mostrar mensaje de confirmación
                        if (window.chat.addMessage) {
                            window.chat.addMessage('system', '✅ API Key configurada correctamente. ¡Usando IA avanzada!');
                        }
                    }
                } else if (newKey) {
                    alert('❌ API Key inválida. Debe comenzar con "gsk_"');
                }
            } else if (hasKey) {
                // Eliminar API key
                if (confirm('⚠️ ¿Eliminar la API Key guardada? Volverás al modo demo.')) {
                    sessionStorage.removeItem('groq_api_key');
                    localStorage.removeItem('groq_api_key');
                    if (window.chat) {
                        window.chat.GROQ_API_KEY = null;
                        if (window.chat.addMessage) {
                            window.chat.addMessage('system', '🔑 API Key eliminada. Usando modo demo.');
                        }
                    }
                    alert('✅ API Key eliminada. Modo demo activado.');
                }
            }
            
            toggleMenu();
        });
    }
    
    // 4. Upgrade a Pro
    const menuUpgrade = document.getElementById('menuUpgrade');
    if (menuUpgrade) {
        menuUpgrade.addEventListener('click', () => {
            const modal = document.getElementById('upgradeModal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                // Si no existe el modal, mostrar prompt
                const license = prompt(
                    '💎 LINGUAAI PRO\n\n' +
                    'Ingresa tu código de licencia Pro:\n' +
                    '(Ejemplo: LG-XXXX-XXXX-XXXX)\n\n' +
                    '¿No tienes licencia? Contacta con soporte.'
                );
                if (license) {
                    if (window.auth) {
                        const result = window.auth.loginWithLicense(license);
                        if (result.success) {
                            alert('🎉 ¡Pro activado correctamente! Recargando...');
                            location.reload();
                        } else {
                            alert('❌ Licencia inválida. Verifica el código.');
                        }
                    }
                }
            }
            toggleMenu();
        });
    }
    
    // 5. Cerrar Sesión
    const menuLogout = document.getElementById('menuLogout');
    if (menuLogout) {
        menuLogout.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión? Se borrará el historial de la sesión demo.')) {
                if (window.auth) {
                    window.auth.logout();
                } else {
                    localStorage.removeItem('lingua_user');
                    location.reload();
                }
            }
            toggleMenu();
        });
    }
    
    // 6. Cerrar modal de upgrade (si existe)
    const closeModal = document.querySelector('#upgradeModal .close');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const modal = document.getElementById('upgradeModal');
            if (modal) modal.style.display = 'none';
        });
    }
    
    // 7. Activar licencia Pro desde modal
    const activatePro = document.getElementById('activatePro');
    if (activatePro) {
        activatePro.addEventListener('click', () => {
            const licenseInput = document.getElementById('licenseCode');
            const license = licenseInput?.value.trim();
            
            if (license) {
                if (window.auth) {
                    const result = window.auth.loginWithLicense(license);
                    if (result.success) {
                        alert('🎉 ¡Licencia Pro activada! Recargando...');
                        location.reload();
                    } else {
                        alert('❌ Código de licencia inválido');
                    }
                }
            } else {
                alert('Por favor ingresa un código de licencia');
            }
        });
    }
    
    // 8. Cerrar modal haciendo clic fuera
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // 9. Actualizar información del usuario en el menú
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
        } else {
            if (userEmailDisplay) userEmailDisplay.textContent = 'Usuario Demo';
            if (licenseStatus) licenseStatus.textContent = '📘 Demo Mode';
            if (versionBadge) versionBadge.textContent = 'DEMO';
        }
    }
    
    // 10. Verificar admin mode
    if (window.location.search.includes('admin=true')) {
        console.log('🔐 Modo Administrador activado');
        const menuItems = document.querySelector('.menu-items');
        if (menuItems && !document.getElementById('menuAdmin')) {
            const adminItem = document.createElement('li');
            adminItem.innerHTML = '<button class="menu-item" id="menuAdmin" style="border: 1px solid #ff4444;">🛡️ Panel Admin</button>';
            const logoutItem = document.getElementById('menuLogout');
            if (logoutItem) {
                logoutItem.parentNode.insertBefore(adminItem, logoutItem);
            } else {
                menuItems.appendChild(adminItem);
            }
            
            document.getElementById('menuAdmin')?.addEventListener('click', () => {
                window.location.href = '/admin.html?admin=true';
            });
        }
    }
    
    // Actualizar información del usuario
    updateUserInfo();
    
    // Exportar función toggle para uso global
    window.toggleMenu = toggleMenu;
});
