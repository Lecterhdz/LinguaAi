// ============================================
// SISTEMA DE LICENCIAS PRO - LINGUAAI
// ============================================

class AuthSystem {
    constructor() {
        this.storageKey = 'lingua_user';
        this.licensesKey = 'lingua_licenses';
        this.demoLimit = 10; // mensajes gratis por día
        this.initLicenses();
        this.checkAndResetDailyCounters();
    }

    // Inicializar licencias de demostración
    initLicenses() {
        if (!localStorage.getItem(this.licensesKey)) {
            const defaultLicenses = {
                // Licencias demo gratuitas
                'DEMO-1234-5678': { 
                    email: 'demo@linguai.com', 
                    activated: false, 
                    type: 'demo',
                    createdAt: Date.now()
                },
                'DEMO-FREE-TRIAL': { 
                    email: 'trial@linguai.com', 
                    activated: false, 
                    type: 'demo',
                    createdAt: Date.now()
                },
                // Licencia Pro para pruebas - ¡AHORA SÍ FUNCIONA!
                'PRO-TEST-2024': { 
                    email: 'test@linguai.com', 
                    activated: false, 
                    type: 'pro',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 año
                    durationDays: 365
                },
                // Licencia Pro adicional para pruebas
                'LG-PRO-2024': { 
                    email: 'pro@linguai.com', 
                    activated: false, 
                    type: 'pro',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 días
                    durationDays: 90
                },
                // Licencia Premium
                'PREMIUM-2024': { 
                    email: 'premium@linguai.com', 
                    activated: false, 
                    type: 'pro',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (180 * 24 * 60 * 60 * 1000), // 180 días
                    durationDays: 180
                }
            };
            localStorage.setItem(this.licensesKey, JSON.stringify(defaultLicenses));
            console.log('✅ Licencias inicializadas:', Object.keys(defaultLicenses));
        } else {
            // Verificar si faltan licencias y agregarlas
            const current = JSON.parse(localStorage.getItem(this.licensesKey));
            const neededLicenses = ['PRO-TEST-2024', 'LG-PRO-2024', 'PREMIUM-2024'];
            let updated = false;
            
            for (const license of neededLicenses) {
                if (!current[license]) {
                    current[license] = {
                        email: `${license.toLowerCase()}@linguai.com`,
                        activated: false,
                        type: 'pro',
                        createdAt: Date.now(),
                        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000),
                        durationDays: 365
                    };
                    updated = true;
                    console.log(`✅ Licencia añadida: ${license}`);
                }
            }
            
            if (updated) {
                localStorage.setItem(this.licensesKey, JSON.stringify(current));
            }
        }
    }
    
    // Mejorar loginWithLicense para dar más información
    loginWithLicense(licenseCode) {
        console.log(`🔐 Intentando login con licencia: ${licenseCode}`);
        
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        const license = licenses[licenseCode];
        
        if (!license) {
            console.error(`❌ Licencia no encontrada: ${licenseCode}`);
            console.log('Licencias disponibles:', Object.keys(licenses));
            return { success: false, error: `❌ Licencia inválida: "${licenseCode}" no existe. Usa: DEMO-1234-5678, PRO-TEST-2024, DEMO-FREE-TRIAL` };
        }
        
        // Verificar expiración
        if (license.type === 'pro' && license.expiresAt && Date.now() > license.expiresAt) {
            console.error(`❌ Licencia expirada: ${licenseCode}`);
            return { success: false, error: '❌ Licencia expirada. Contacta con soporte para renovar.' };
        }
        
        const today = new Date().toDateString();
        
        const user = {
            license: licenseCode,
            email: license.email,
            isPro: license.type === 'pro',
            loginTime: Date.now(),
            messagesToday: 0,
            lastReset: today
        };
        
        // Marcar licencia como activada
        license.activated = true;
        license.lastUsed = Date.now();
        localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        
        console.log(`✅ Login exitoso: ${licenseCode} (${license.type})`);
        
        return { 
            success: true, 
            user,
            message: license.type === 'pro' ? '🎉 ¡Bienvenido a LinguaAI PRO! Mensajes ilimitados.' : '📘 Modo Demo activado. 10 mensajes/día.'
        };
    }

    // Verificar y resetear contadores diarios
    checkAndResetDailyCounters() {
        const user = this.getCurrentUser();
        if (user) {
            const today = new Date().toDateString();
            if (user.lastReset !== today && !user.isPro) {
                user.messagesToday = 0;
                user.lastReset = today;
                localStorage.setItem(this.storageKey, JSON.stringify(user));
            }
        }
    }

    // Verificar si es modo administrador
    checkAdminMode() {
        return window.location.search.includes('admin=true');
    }

    // Generar nueva licencia PRO (solo admin)
    generateProLicense(email, durationDays = 30) {
        const prefix = 'LG';
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const licenseCode = `${prefix}-${random}-${random2}`;
        
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        licenses[licenseCode] = {
            email: email,
            activated: false,
            type: 'pro',
            createdAt: Date.now(),
            expiresAt: Date.now() + (durationDays * 24 * 60 * 60 * 1000),
            durationDays: durationDays
        };
        localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
        
        return licenseCode;
    }

    // Verificar si una licencia es válida
    isValidLicense(licenseCode) {
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        const license = licenses[licenseCode];
        
        if (!license) return false;
        
        // Verificar expiración para licencias PRO
        if (license.type === 'pro' && license.expiresAt) {
            if (Date.now() > license.expiresAt) {
                return false; // Licencia expirada
            }
        }
        
        return true;
    }

    // Obtener tiempo restante de licencia
    getLicenseRemainingTime(licenseCode) {
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        const license = licenses[licenseCode];
        
        if (!license || license.type !== 'pro' || !license.expiresAt) return null;
        
        const remaining = license.expiresAt - Date.now();
        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return { days, remaining };
    }

    // Login con código de licencia
    loginWithLicense(licenseCode) {
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        const license = licenses[licenseCode];
        
        if (!license) {
            return { success: false, error: '❌ Licencia inválida. Verifica el código.' };
        }
        
        // Verificar expiración
        if (license.type === 'pro' && license.expiresAt && Date.now() > license.expiresAt) {
            return { success: false, error: '❌ Licencia expirada. Contacta con soporte para renovar.' };
        }
        
        const today = new Date().toDateString();
        
        const user = {
            license: licenseCode,
            email: license.email,
            isPro: license.type === 'pro',
            loginTime: Date.now(),
            messagesToday: 0,
            lastReset: today
        };
        
        // Marcar licencia como activada
        license.activated = true;
        license.lastUsed = Date.now();
        localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        
        return { 
            success: true, 
            user,
            message: license.type === 'pro' ? '🎉 ¡Bienvenido a LinguaAI PRO!' : '📘 Modo Demo activado. 10 mensajes/día.'
        };
    }

    // Obtener usuario actual
    getCurrentUser() {
        const user = localStorage.getItem(this.storageKey);
        if (!user) return null;
        
        const userData = JSON.parse(user);
        
        // Verificar si la licencia sigue siendo válida
        if (!this.isValidLicense(userData.license)) {
            this.logout();
            return null;
        }
        
        // Reset diario para usuarios demo
        const today = new Date().toDateString();
        if (userData.lastReset !== today && !userData.isPro) {
            userData.messagesToday = 0;
            userData.lastReset = today;
            localStorage.setItem(this.storageKey, JSON.stringify(userData));
        }
        
        return userData;
    }

    // Verificar si puede enviar mensaje
    canSendMessage() {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.isPro) return true;
        return user.messagesToday < this.demoLimit;
    }

    // Obtener mensajes restantes del día
    getRemainingMessages() {
        const user = this.getCurrentUser();
        if (!user) return 0;
        if (user.isPro) return Infinity;
        return Math.max(0, this.demoLimit - user.messagesToday);
    }

    // Incrementar contador de mensajes
    incrementMessageCount() {
        const user = this.getCurrentUser();
        if (user && !user.isPro) {
            user.messagesToday++;
            localStorage.setItem(this.storageKey, JSON.stringify(user));
        }
    }

    // Cerrar sesión
    logout() {
        const user = this.getCurrentUser();
        if (user) {
            // Limpiar historial de demo
            if (!user.isPro) {
                localStorage.removeItem(`chat_history_${user.license}`);
            }
        }
        localStorage.removeItem(this.storageKey);
        window.location.reload();
    }

    // Limpiar historial del usuario actual
    clearHistory() {
        const user = this.getCurrentUser();
        if (user) {
            localStorage.removeItem(`chat_history_${user.license}`);
            return true;
        }
        return false;
    }

    // Obtener estadísticas (solo admin)
    getAdminStats() {
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        const users = [];
        
        for (const [code, data] of Object.entries(licenses)) {
            users.push({
                code: code,
                email: data.email,
                type: data.type,
                activated: data.activated,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                lastUsed: data.lastUsed
            });
        }
        
        const activeProUsers = users.filter(u => u.type === 'pro' && u.activated).length;
        const totalLicenses = users.length;
        const expiredLicenses = users.filter(u => u.expiresAt && Date.now() > u.expiresAt).length;
        
        return {
            totalLicenses,
            activeProUsers,
            expiredLicenses,
            demoUsers: totalLicenses - activeProUsers,
            users
        };
    }
}

// Inicializar sistema de autenticación
window.auth = new AuthSystem();

// Verificar login al cargar (solo en páginas no-admin)
if (!window.location.pathname.includes('admin.html') && !window.auth.getCurrentUser()) {
    // Mostrar modal de login personalizado
    const showLoginModal = () => {
        const license = prompt(
            '🔐 LINGUAAI - TUTOR IA DE IDIOMAS\n\n' +
            'Ingresa tu código de licencia:\n\n' +
            '📘 MODO DEMO (gratis): DEMO-1234-5678\n' +
            '💎 MODO PRO: Código de licencia\n\n' +
            '¿No tienes licencia? Usa DEMO-1234-5678\n\n' +
            'Código:'
        );
        
        if (license) {
            const result = window.auth.loginWithLicense(license);
            if (!result.success) {
                alert(result.error + '\n\nUsando modo demo...');
                window.auth.loginWithLicense('DEMO-1234-5678');
            } else {
                alert(result.message);
            }
        } else {
            // Usar demo por defecto
            window.auth.loginWithLicense('DEMO-1234-5678');
        }
    };
    
    showLoginModal();
}
