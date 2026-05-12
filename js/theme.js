// Tema claro/oscuro con persistencia y manejo del selector
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

// Aplicar tema inicial
if (currentTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.textContent = '☀️';
} else {
    document.body.classList.remove('light');
    themeToggle.textContent = '🌙';
}

// Función para actualizar todos los elementos que dependen del tema
function updateThemeElements() {
    const isLight = document.body.classList.contains('light');
    const select = document.getElementById('languageSelect');
    const textarea = document.getElementById('userInput');
    
    if (select) {
        if (isLight) {
            select.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            select.style.color = '#1a1a1a';
        } else {
            select.style.backgroundColor = 'rgba(10, 10, 10, 0.8)';
            select.style.color = '#ffffff';
        }
    }
    
    if (textarea) {
        if (isLight) {
            textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            textarea.style.color = '#1a1a1a';
        } else {
            textarea.style.backgroundColor = 'rgba(10, 10, 10, 0.6)';
            textarea.style.color = '#ffffff';
        }
    }
}

// Alternar tema
themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    
    // Actualizar elementos visuales
    updateThemeElements();
    
    // Forzar actualización de select options
    const select = document.getElementById('languageSelect');
    if (select) {
        // Pequeño truco para forzar repaint
        select.style.display = 'none';
        setTimeout(() => {
            select.style.display = '';
        }, 10);
    }
});

// Ejecutar al cargar
updateThemeElements();

// También actualizar cuando cambie el idioma (por si acaso)
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
    languageSelect.addEventListener('change', () => {
        // Asegurar que los estilos se mantengan
        updateThemeElements();
    });
}
