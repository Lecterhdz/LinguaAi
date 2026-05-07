// Menú hamburguesa con overlay transparente
const hamburger = document.getElementById('hamburgerBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('menuOverlay');

function toggleMenu() {
    hamburger.classList.toggle('active');
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = sideMenu.classList.contains('active') ? 'hidden' : '';
}

hamburger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Acciones del menú
document.getElementById('menuNewChat').addEventListener('click', () => {
    document.getElementById('chatMessages').innerHTML = '';
    window.chat.messages = [];
    window.chat.saveHistory();
    toggleMenu();
    location.reload(); // Reiniciar chat
});

document.getElementById('menuClearHistory').addEventListener('click', () => {
    if (confirm('¿Borrar todo el historial de conversación?')) {
        window.auth.clearHistory();
        location.reload();
    }
});

document.getElementById('menuUpgrade').addEventListener('click', () => {
    document.getElementById('upgradeModal').style.display = 'flex';
    toggleMenu();
});

document.getElementById('menuLogout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión? Se borrará el historial demo.')) {
        window.auth.logout();
    }
});

// Modal upgrade
document.querySelector('.close').onclick = () => {
    document.getElementById('upgradeModal').style.display = 'none';
};

document.getElementById('activatePro').onclick = () => {
    const license = document.getElementById('licenseCode').value;
    if (license) {
        const result = window.auth.loginWithLicense(license);
        if (result.success) {
            alert('🎉 ¡Pro activado! Recarga la página.');
            location.reload();
        } else {
            alert('❌ Licencia inválida. Contacta con soporte.');
        }
    }
};

// Mostrar email en menú
const user = window.auth.getCurrentUser();
if (user) {
    document.getElementById('userEmailDisplay').innerText = user.email || 'Usuario Pro';
    document.getElementById('licenseStatus').innerText = user.isPro ? '💎 PRO' : '📘 Demo';
    document.getElementById('versionBadge').innerText = user.isPro ? 'PRO' : 'DEMO';
}
