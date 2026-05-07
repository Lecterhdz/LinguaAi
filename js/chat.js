class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // Cargar API key de Groq
        this.GROQ_API_KEY = this.loadApiKey();
        
        // Verificar si hay API key
        if (!this.GROQ_API_KEY) {
            this.showApiKeyPrompt();
        } else {
            this.testApiConnection();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0) {
                this.addMessage('ai', '🎧 ¡Hola! Soy LinguaAI, tu tutora IA. Escríbeme en el idioma que quieras practicar y conversaremos naturalmente. ¡Te corregiré y ayudaré a mejorar! 🚀');
            }
        }, 1000);
    }

    loadApiKey() {
        return sessionStorage.getItem('groq_api_key') || localStorage.getItem('groq_api_key') || null;
    }

    saveApiKey(key, persistent = false) {
        if (persistent) {
            localStorage.setItem('groq_api_key', key);
        } else {
            sessionStorage.setItem('groq_api_key', key);
        }
        this.GROQ_API_KEY = key;
    }

    showApiKeyPrompt() {
        setTimeout(() => {
            const useGroq = confirm(
                '🤖 LINGUAAI - TUTOR IA CON GROQ\n\n' +
                '¿Quieres usar la IA avanzada de Groq (gratis)?\n\n' +
                '✅ SÍ - IA conversacional real\n' +
                '❌ NO - Modo básico offline\n\n' +
                '¡Regístrate gratis en console.groq.com!'
            );
            
            if (useGroq) {
                const key = prompt(
                    '🔑 Ingresa tu API Key de Groq:\n\n' +
                    '1. Ve a console.groq.com\n' +
                    '2. Regístrate gratis\n' +
                    '3. Crea una API Key\n' +
                    '4. Pégala aquí:\n\n' +
                    '(La key empieza con gsk_)'
                );
                
                if (key && key.startsWith('gsk_')) {
                    const save = confirm('¿Guardar la key permanentemente?');
                    this.saveApiKey(key, save);
                    this.addMessage('system', '✅ API Key de Groq configurada. ¡Usando IA avanzada!');
                    this.testApiConnection();
                } else if (key) {
                    this.addMessage('system', '❌ API Key inválida. Usando modo offline.');
                }
            } else {
                this.addMessage('system', '📘 Modo offline activado. Para IA avanzada, configura API Key en el menú 🔑');
            }
        }, 1500);
    }

    async testApiConnection() {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${this.GROQ_API_KEY}` }
            });
            if (response.ok) {
                console.log('✅ Groq API conectada correctamente');
                this.addMessage('system', '🤖 IA avanzada lista. ¡Conversa conmigo naturalmente!');
            } else {
                console.error('❌ Error conectando a Groq');
                this.GROQ_API_KEY = null;
            }
        } catch (error) {
            console.error('❌ No se pudo conectar a Groq:', error);
            this.GROQ_API_KEY = null;
        }
    }

    setupVoice() {
        this.voice = null;
        if (window.speechSynthesis) {
            const setVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                this.voice = voices.find(v => 
                    v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('samantha') ||
                    v.name.toLowerCase().includes('monica') ||
                    v.name.toLowerCase().includes('zira')
                ) || voices[0];
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }

    // ========== TUTOR IA CON GROQ ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }

        // Sistema de prompts para ser un buen tutor
        const systemPrompt = `Eres LinguaAI, una tutora de idiomas con voz de mujer. Tus características:

📚 **Personalidad:** Amable, paciente, entusiasta, motivadora
🎯 **Objetivo:** Ayudar al estudiante a mejorar su ${language}

**REGLAS IMPORTANTES:**
1. CORRIGE errores gramaticales y ortográficos
2. DA ejemplos relevantes
3. EXPLICA por qué algo está mal
4. MOTIVA al estudiante a seguir practicando
5. ADAPTA tu nivel al del estudiante
6. HAZ preguntas para mantener la conversación
7. RESPUESTAS cortas (máximo 3-4 oraciones)

**RESPONDE SIEMPRE EN ${language}**
**SI EL ESTUDIANTE COMETE UN ERROR:**
- Primero, muestra la corrección: "📝 Corrección: X → Y"
- Luego, explica brevemente la regla
- Finalmente, pide que lo intente de nuevo

**EJEMPLO DE RESPUESTA IDEAL:**
"📝 'She go to school' → 'She goes to school'
✅ Explicación: En presente simple, con 'she' usamos 'goes'
✏️ Ahora intenta tú: 'She ___ (eat) an apple'"

¡Comienza la conversación!`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile', // Modelo gratuito y potente
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.messages.slice(-10), // Contexto de los últimos mensajes
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.addMessage('system', '❌ API Key inválida. Configura una nueva en el menú 🔑');
                    this.GROQ_API_KEY = null;
                    sessionStorage.removeItem('groq_api_key');
                    localStorage.removeItem('groq_api_key');
                    return this.getOfflineResponse(userText, language);
                }
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            console.log('🤖 Groq respondió:', reply);
            return reply;

        } catch (error) {
            console.error('Error con Groq:', error);
            return this.getOfflineResponse(userText, language);
        }
    }

    // Fallback offline cuando no hay API key
    getOfflineResponse(text, language) {
        return `⚠️ **Modo offline activado**\n\nPara usar la IA tutor, configura tu API Key de Groq en el menú (☰ → 🔑 Configurar API Key).\n\n📝 Tu mensaje: "${text}"\n\n✅ Regístrate gratis en console.groq.com y obtén tu key.`;
    }

    async sendMessage(userText, language) {
        // Verificar límite de demo
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario de demo alcanzado (10 mensajes). Actualiza a Pro.');
            return;
        }

        // Mostrar mensaje del usuario
        this.addMessage('user', userText);
        
        // Mostrar indicador de "escribiendo"
        const typingIndicator = this.showTypingIndicator();
        
        // Obtener respuesta de Groq
        const reply = await this.sendToGroq(userText, language);
        
        // Remover indicador
        if (typingIndicator) typingIndicator.remove();
        
        // Mostrar respuesta
        this.addMessage('ai', reply);
        
        // Reproducir voz
        this.speak(reply, language).catch(e => console.log('Error al hablar:', e));
        
        // Incrementar contador
        if (window.auth) {
            window.auth.incrementMessageCount();
        }
        
        // Guardar historial
        this.saveHistory();
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return null;
        
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = '<strong>🤖 LinguaAI</strong><br><span class="dots">●●●</span>';
        messagesDiv.appendChild(indicator);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        let dotCount = 0;
        const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            const dots = '●'.repeat(dotCount) + '○'.repeat(3 - dotCount);
            const span = indicator.querySelector('.dots');
            if (span) span.textContent = dots;
        }, 300);
        
        return {
            remove: () => {
                clearInterval(interval);
                if (indicator && indicator.remove) indicator.remove();
            }
        };
    }

    addMessage(role, content) {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        const icon = role === 'user' ? '👤' : role === 'ai' ? '🤖' : 'ℹ️';
        const name = role === 'user' ? 'Tú' : role === 'ai' ? 'LinguaAI' : 'Sistema';
        
        messageDiv.innerHTML = `<strong>${icon} ${name}</strong><div class="message-content">${this.escapeHtml(content)}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        if (role !== 'system') {
            this.messages.push({ role, content, timestamp: Date.now() });
        }
        if (this.messages.length > 50) this.messages = this.messages.slice(-50);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async speak(text, language) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = language === 'Spanish' ? 'es-ES' : 'en-US';
                utterance.rate = 0.9;
                utterance.pitch = 1.25;
                if (this.voice) utterance.voice = this.voice;
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve();
                window.speechSynthesis.speak(utterance);
            } catch (e) { resolve(); }
        });
    }

    saveHistory() {
        const user = window.auth?.getCurrentUser();
        if (user && this.messages.length) {
            localStorage.setItem(`chat_history_${user.license}`, JSON.stringify(this.messages.slice(-50)));
        }
    }

    loadHistory() {
        const user = window.auth?.getCurrentUser();
        if (user) {
            const history = localStorage.getItem(`chat_history_${user.license}`);
            if (history) {
                this.messages = JSON.parse(history);
                this.messages.slice(-20).forEach(msg => {
                    if (msg.role !== 'system') this.addMessage(msg.role, msg.content);
                });
            }
        }
    }

    clearHistory() {
        this.messages = [];
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.innerHTML = `<div class="welcome-message"><div class="ai-icon">🎧</div><h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2><p>Tu tutora IA con Groq.<br>¡Conversa naturalmente y mejora tu idioma! 🚀</p></div>`;
        }
        this.saveHistory();
    }

    resetApiKey() {
        if (confirm('¿Eliminar API key y volver al modo offline?')) {
            sessionStorage.removeItem('groq_api_key');
            localStorage.removeItem('groq_api_key');
            this.GROQ_API_KEY = null;
            this.addMessage('system', '🔑 API key eliminada. Usando modo offline.');
            this.showApiKeyPrompt();
        }
    }

    initEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            const newBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode?.replaceChild(newBtn, sendBtn);
            document.getElementById('sendBtn').onclick = () => this.handleSend();
        }
        
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            const newVoiceBtn = voiceBtn.cloneNode(true);
            voiceBtn.parentNode?.replaceChild(newVoiceBtn, voiceBtn);
            document.getElementById('voiceBtn').onclick = () => this.handleVoice();
        }
        
        const speakerBtn = document.getElementById('speakerBtn');
        if (speakerBtn) {
            const newSpeakerBtn = speakerBtn.cloneNode(true);
            speakerBtn.parentNode?.replaceChild(newSpeakerBtn, speakerBtn);
            document.getElementById('speakerBtn').onclick = () => this.handleSpeaker();
        }
        
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.onkeypress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            };
        }
    }

    async handleSend() {
        if (this.isProcessing) return;
        
        const input = document.getElementById('userInput');
        const text = input?.value.trim();
        if (!text) return;
        
        this.isProcessing = true;
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
        }
        
        const language = document.getElementById('languageSelect')?.value || 'English';
        await this.sendMessage(text, language);
        
        if (input) input.value = '';
        this.isProcessing = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
        input?.focus();
    }

    async handleVoice() {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
            this.addMessage('system', '❌ Tu navegador no soporta reconocimiento de voz');
            return;
        }
        
        const voiceBtn = document.getElementById('voiceBtn');
        const originalBg = voiceBtn?.style.background;
        if (voiceBtn) {
            voiceBtn.style.background = '#00d4ff';
            voiceBtn.style.transform = 'scale(1.1)';
        }
        
        const recognition = new SpeechRecognition();
        const currentLang = document.getElementById('languageSelect')?.value || 'English';
        recognition.lang = currentLang === 'Spanish' ? 'es-ES' : 'en-US';
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            const input = document.getElementById('userInput');
            if (input) input.value = text;
            if (voiceBtn) {
                voiceBtn.style.background = originalBg;
                voiceBtn.style.transform = '';
            }
            this.handleSend();
        };
        
        recognition.onerror = () => {
            if (voiceBtn) {
                voiceBtn.style.background = originalBg;
                voiceBtn.style.transform = '';
            }
        };
        
        recognition.start();
    }

    async handleSpeaker() {
        const speakerBtn = document.getElementById('speakerBtn');
        const originalBg = speakerBtn?.style.background;
        if (speakerBtn) speakerBtn.style.background = '#00d4ff';
        
        const lastMessage = [...this.messages].reverse().find(m => m.role === 'ai');
        if (lastMessage) {
            await this.speak(lastMessage.content, document.getElementById('languageSelect')?.value || 'English');
        }
        
        setTimeout(() => {
            if (speakerBtn) speakerBtn.style.background = originalBg;
        }, 500);
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.chat = new LinguaAIChat(); });
} else {
    window.chat = new LinguaAIChat();
}
