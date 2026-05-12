class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // CARGAR API KEY - PRIORIDAD ALTA
        this.GROQ_API_KEY = localStorage.getItem('groq_api_key') || sessionStorage.getItem('groq_api_key');
        
        // SI NO HAY KEY, PEDIRLA INMEDIATAMENTE
        if (!this.GROQ_API_KEY) {
            console.log('⚠️ No hay API key de Groq');
            this.promptForApiKey();
        } else {
            console.log('✅ API key de Groq cargada:', this.GROQ_API_KEY.substring(0, 10) + '...');
            this.testConnection();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0 && this.GROQ_API_KEY) {
                this.addMessage('ai', '🎧 ¡Hola! Soy LinguaAI con Groq. Pregúntame lo que sea sobre cualquier idioma. ¡Conversemos! 🚀');
            } else if (this.messages.length === 0) {
                this.addMessage('ai', '🎧 Hola! Para usar la IA avanzada, necesitas configurar tu API key de Groq. Ve al menú ☰ → 🔑 Configurar API Key');
            }
        }, 1000);
    }

    promptForApiKey() {
        const key = prompt(
            '🔑 ¡ACTIVA LA IA DE GROQ!\n\n' +
            '1. Ve a console.groq.com\n' +
            '2. Regístrate gratis (2 min)\n' +
            '3. Crea una API Key\n' +
            '4. Pégala aquí:\n\n' +
            'La key empieza con "gsk_"\n\n' +
            '¿La tienes? ¡Pégala ahora!'
        );
        
        if (key && key.startsWith('gsk_')) {
            localStorage.setItem('groq_api_key', key);
            this.GROQ_API_KEY = key;
            this.testConnection();
            this.addMessage('system', '✅ ¡API Key configurada! Ahora usaré IA de Groq. ¡Pregúntame cualquier cosa!');
            location.reload();
        } else if (key) {
            alert('❌ Key inválida. Debe empezar con "gsk_"');
            this.promptForApiKey();
        }
    }

    async testConnection() {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{ role: 'user', content: 'Say "OK" if you receive this' }],
                    max_tokens: 10
                })
            });
            
            if (response.ok) {
                console.log('✅ Groq conectado correctamente');
                this.addMessage('system', '🤖 IA de Groq activada. ¡Soy tu tutora personal!');
            } else {
                console.error('❌ Error conectando a Groq:', response.status);
                this.GROQ_API_KEY = null;
                localStorage.removeItem('groq_api_key');
            }
        } catch (error) {
            console.error('❌ No se pudo conectar:', error);
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

    // ========== TUTOR IA CON GROQ - VERSIÓN REAL ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return `⚠️ **No hay API key de Groq configurada**\n\nPara usar la IA, necesitas:\n\n1. Ve a console.groq.com\n2. Regístrate gratis\n3. Crea una API Key\n4. Ve al menú ☰ → 🔑 Configurar API Key\n\n¡Es gratis y toma 2 minutos! 🚀`;
        }

        // Prompt de TUTOR EXPERTO
        const systemPrompt = `Eres LinguaAI, una tutora profesional de idiomas con voz de mujer.

**ROL:** Tutora paciente, entusiasta y experta en ${language}

**INSTRUCCIONES ESTRICTAS:**
1. ✅ CORRIGE todos los errores gramaticales y ortográficos
2. ✅ EXPLICA POR QUÉ está mal (regla gramatical)
3. ✅ DA EJEMPLOS correctos
4. ✅ RESPONDE PREGUNTAS complejas sobre ${language}
5. ✅ MANTÉN conversación natural
6. ✅ USA emojis ocasionalmente para ser amigable
7. ✅ RESPUESTAS de 2-4 oraciones (no muy largas)

**FORMATO DE CORRECCIÓN:**
📝 "${texto_erroneo}" → "${texto_correcto}"
💡 Explicación: [regla gramatical]
📖 Ejemplo: [frase adicional]

**EJEMPLO DE RESPUESTA IDEAL:**
Usuario: "She go to school"
Tú: 📝 "She go to school" → "She goes to school"
💡 Explicación: En presente simple, con "she/he/it" se añade "s" al verbo
📖 Ejemplo: "She goes to school every day"
✏️ Ahora intenta: "He ___ (eat) an apple"

¡RESPONDE SIEMPRE EN ${language}!
¡Comienza a ayudar al estudiante!`;

        try {
            console.log('🚀 Enviando a Groq:', userText);
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.messages.slice(-15),
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.8,
                    max_tokens: 400
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error Groq:', errorData);
                
                if (response.status === 401) {
                    localStorage.removeItem('groq_api_key');
                    this.GROQ_API_KEY = null;
                    return `❌ **API Key inválida o expirada**\n\nVe a console.groq.com, genera una NUEVA key y configúrala en el menú 🔑`;
                }
                
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            console.log('✅ Respuesta de Groq recibida:', reply.substring(0, 100));
            return reply;

        } catch (error) {
            console.error('Error en Groq:', error);
            return `⚠️ **Error de conexión con Groq**\n\nVerifica tu conexión a internet y que la API key sea correcta.\n\n📝 Tu mensaje: "${userText}"\n\nIntenta de nuevo o configura otra key en el menú 🔑`;
        }
    }

    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario de demo alcanzado (10 mensajes). Actualiza a Pro.');
            return;
        }

        this.addMessage('user', userText);
        
        // Indicador de escritura
        const typingIndicator = this.showTypingIndicator();
        
        // Obtener respuesta de Groq
        const reply = await this.sendToGroq(userText, language);
        
        if (typingIndicator) typingIndicator.remove();
        
        this.addMessage('ai', reply);
        
        // Voz
        this.speak(reply, language).catch(e => console.log('Error al hablar:', e));
        
        if (window.auth) window.auth.incrementMessageCount();
        
        this.saveHistory();
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return null;
        
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = '<strong>🤖 LinguaAI pensando con Groq...</strong><br><span class="dots">●●●</span>';
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
        
        // Limpiar indicador anterior
        const oldIndicator = document.getElementById('typingIndicator');
        if (oldIndicator) oldIndicator.remove();
        
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
        if (confirm('¿Eliminar API key?')) {
            localStorage.removeItem('groq_api_key');
            sessionStorage.removeItem('groq_api_key');
            this.GROQ_API_KEY = null;
            location.reload();
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
