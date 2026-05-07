// Sistema de autenticación y licencias
class AuthSystem {
    constructor() {
        this.storageKey = 'lingua_user';
        this.licensesKey = 'lingua_licenses';
        this.demoLimit = 10; // mensajes gratis por día
        this.initLicenses();
    }

    initLicenses() {
        if (!localStorage.getItem(this.licensesKey)) {
            const demoLicenses = {
                'DEMO-1234-5678': { email: 'demo@lingua.ai', activated: false, type: 'demo' },
                'PRO-FREE-TRIAL': { email: 'trial@lingua.ai', activated: false, type: 'demo' }
            };
            localStorage.setItem(this.licensesKey, JSON.stringify(demoLicenses));
        }
    }

    checkAdminMode() {
        return window.location.search.includes('admin=true');
    }

    loginWithLicense(licenseCode) {
        const licenses = JSON.parse(localStorage.getItem(this.licensesKey));
        if (licenses[licenseCode]) {
            const user = {
                license: licenseCode,
                email: licenses[licenseCode].email,
                isPro: licenseCode.startsWith('LG-') || licenses[licenseCode].type === 'pro',
                loginTime: Date.now(),
                messagesToday: 0,
                lastReset: new Date().toDateString()
            };
            licenses[licenseCode].activated = true;
            localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
            localStorage.setItem(this.storageKey, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, error: 'Licencia inválida' };
    }

    getCurrentUser() {
        const user = localStorage.getItem(this.storageKey);
        if (!user) return null;
        const userData = JSON.parse(user);
        
        // Reset diario para demo
        const today = new Date().toDateString();
        if (userData.lastReset !== today && !userData.isPro) {
            userData.messagesToday = 0;
            userData.lastReset = today;
            localStorage.setItem(this.storageKey, JSON.stringify(userData));
        }
        return userData;
    }

    canSendMessage() {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.isPro) return true;
        return user.messagesToday < this.demoLimit;
    }

    incrementMessageCount() {
        const user = this.getCurrentUser();
        if (user && !user.isPro) {
            user.messagesToday++;
            localStorage.setItem(this.storageKey, JSON.stringify(user));
        }
    }

    logout() {
        const user = this.getCurrentUser();
        if (user && !user.isPro) {
            // Limpiar historial al cerrar sesión
            localStorage.removeItem(`chat_history_${user.license}`);
        }
        localStorage.removeItem(this.storageKey);
        location.reload();
    }

    clearHistory() {
        const user = this.getCurrentUser();
        if (user) {
            localStorage.removeItem(`chat_history_${user.license}`);
            return true;
        }
        return false;
    }
}

window.auth = new AuthSystem();

// Verificar login al cargar
if (!window.auth.getCurrentUser() && !window.location.pathname.includes('admin.html')) {
    const license = prompt('🔐 Bienvenido a LinguaAI\nIngresa tu código de licencia:\n(DEMO-1234-5678 para demo)');
    if (license) {
        const result = window.auth.loginWithLicense(license);
        if (!result.success) {
            alert('Licencia inválida. Usa DEMO-1234-5678');
            window.auth.loginWithLicense('DEMO-1234-5678');
        }
    }
}
