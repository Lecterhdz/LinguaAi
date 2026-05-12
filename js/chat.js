class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // Cargar API key
        this.GROQ_API_KEY = localStorage.getItem('groq_api_key') || sessionStorage.getItem('groq_api_key');
        
        if (!this.GROQ_API_KEY) {
            this.promptForApiKey();
        } else {
            console.log('✅ API key cargada');
            // Probar el modelo Llama 4
            this.testModel();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0 && this.GROQ_API_KEY) {
                this.addMessage('ai', '🎧 ¡Hola! Soy LinguaAI con Llama 4. Pregúntame sobre cualquier idioma. ¡Soy más rápida e inteligente! 🚀');
            } else if (this.messages.length === 0) {
                this.addMessage('ai', '🎧 Hola! Para usar IA gratuita (Llama 4), configura tu API key de Groq en el menú ☰ → 🔑');
            }
        }, 1000);
    }

    async testModel() {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 5
                })
            });
            
            if (response.ok) {
                console.log('✅ Llama 4 Scout listo!');
                this.addMessage('system', '🤖 Llama 4 activado. ¡IA más rápida y precisa!');
            } else {
                console.error('❌ Error con Llama 4, usando fallback');
            }
        } catch (error) {
            console.error('Error probando modelo:', error);
        }
    }

    promptForApiKey() {
        setTimeout(() => {
            const key = prompt(
                '🔑 GROQ AI - GRATIS (Llama 4)\n\n' +
                '1. Ve a https://console.groq.com\n' +
                '2. Regístrate (gratis, 1 minuto)\n' +
                '3. Ve a "API Keys" → "Create API Key"\n' +
                '4. Copia la key (gsk_...)\n' +
                '5. Pégala aquí:\n\n' +
                'Usarás Llama 4 Scout - ¡GRATIS!'
            );
            
            if (key && key.startsWith('gsk_')) {
                localStorage.setItem('groq_api_key', key);
                this.GROQ_API_KEY = key;
                this.addMessage('system', '✅ ¡API Key configurada! Usando Llama 4 Scout. ¡Pregúntame cualquier cosa!');
                this.testModel();
            } else if (key) {
                alert('❌ Key inválida. Debe empezar con "gsk_"');
                this.promptForApiKey();
            }
        }, 2000);
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
                if (this.voice) console.log('🎤 Voz:', this.voice.name);
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }

    // ========== TUTOR IA CON LLAMA 4 SCOUT ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }

        const systemPrompt = `Eres LinguaAI, una tutora experta de ${language} con voz femenina, usando Llama 4.

🚀 **CARACTERÍSTICAS:** Rápida, inteligente, contextual

📚 **INSTRUCCIONES OBLIGATORIAS:**
1. CORRIGE errores gramaticales y ortográficos
2. EXPLICA POR QUÉ está mal (regla gramatical específica)
3. DA 2 ejemplos claros y variados
4. RESPONDE PREGUNTAS complejas sobre ${language}
5. ADAPTA tu nivel al estudiante
6. SÉ AMABLE pero precisa
7. MANTÉN respuestas de 3-4 oraciones

🎯 **FORMATO OBLIGATORIO:**
📝 "${frase_incorrecta}" → "${frase_correcta}"
💡 Explicación: [regla gramatical con criterio]
📖 Ejemplo 1: [frase correcta]
📖 Ejemplo 2: [otra frase correcta]
✏️ Ahora practica: [ejercicio corto]

RESPONDE SIEMPRE EN ${language}
¡SÉ ÚTIL Y PRECISA!`;

        try {
            console.log('🚀 Enviando a Llama 4:', userText);
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Llama 4 Scout
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.messages.slice(-15), // Contexto de conversación
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7,
                    max_tokens: 400,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error Groq:', errorData);
                
                if (response.status === 401) {
                    localStorage.removeItem('groq_api_key');
                    this.GROQ_API_KEY = null;
                    return `❌ **API Key inválida**\n\nGenera una NUEVA key en console.groq.com`;
                }
                
                if (response.status === 429) {
                    return `⏳ **Límite alcanzado**\n\nEspera 30 segundos antes de enviar más mensajes.`;
                }
                
                // Fallback a modelo alternativo si Llama 4 falla
                return await this.fallbackToLlama3(userText, language);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            console.log('✅ Llama 4 respondió');
            return reply;

        } catch (error) {
            console.error('Error en Llama 4:', error);
            return await this.fallbackToLlama3(userText, language);
        }
    }

    async fallbackToLlama3(userText, language) {
        console.log('🔄 Fallback a Llama 3.1');
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: `Eres una tutora de ${language}. Corrige errores, da ejemplos. Responde en ${language}.` },
                        { role: 'user', content: userText }
                    ],
                    max_tokens: 300
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content;
            }
            return this.getOfflineResponse(userText, language);
        } catch (error) {
            return this.getOfflineResponse(userText, language);
        }
    }

    getOfflineResponse(text, language) {
        return `⚠️ **Modo demostración**\n\nPara usar Llama 4 (IA gratuita):\n\n1. Ve a console.groq.com\n2. Regístrate (1 minuto)\n3. Crea una API Key\n4. Ve al menú ☰ → 🔑\n\n📝 "${text}"\n\n¡Es 100% gratis y mucho más inteligente! 🚀`;
    }

    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario alcanzado (10 mensajes). Actualiza a Pro.');
            return;
        }

        this.addMessage('user', userText);
        
        const typingIndicator = this.showTypingIndicator();
        
        try {
            const reply = await this.sendToGroq(userText, language);
            if (typingIndicator) typingIndicator.remove();
            this.addMessage('ai', reply);
            this.speak(reply, language).catch(e => console.log('Error al hablar:', e));
        } catch (error) {
            if (typingIndicator) typingIndicator.remove();
            this.addMessage('system', '❌ Error. Intenta de nuevo.');
        }
        
        if (window.auth) window.auth.incrementMessageCount();
        this.saveHistory();
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return null;
        
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = '<strong>🧠 LinguaAI (Llama 4) pensando...</strong><br><span class="dots">●●●</span>';
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
        
        const oldIndicator = document.getElementById('typingIndicator');
        if (oldIndicator) oldIndicator.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        const icon = role === 'user' ? '👤' : role === 'ai' ? '🤖' : 'ℹ️';
        const name = role === 'user' ? 'Tú' : role === 'ai' ? 'LinguaAI (Llama 4)' : 'Sistema';
        
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/📝/g, '<span style="color: #00d4ff;">📝</span>')
            .replace(/💡/g, '<span style="color: #ffd700;">💡</span>')
            .replace(/📖/g, '<span style="color: #7c3aed;">📖</span>')
            .replace(/✏️/g, '<span style="color: #00ff88;">✏️</span>')
            .replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `<strong>${icon} ${name}</strong><div class="message-content">${formattedContent}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        if (role !== 'system') {
            this.messages.push({ role, content, timestamp: Date.now() });
        }
        if (this.messages.length > 50) this.messages = this.messages.slice(-50);
    }

    async speak(text, language) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }
            try {
                window.speechSynthesis.cancel();
                const cleanText = text.replace(/\*\*/g, '').replace(/[📝💡📖✏️]/g, '').replace(/\n/g, ' ');
                const utterance = new SpeechSynthesisUtterance(cleanText);
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
            messagesDiv.innerHTML = `<div class="welcome-message"><div class="ai-icon">🧠</div><h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2><p>Tu tutora IA con <strong>Llama 4</strong>.<br>¡La IA más rápida e inteligente, 100% gratis! 🚀</p></div>`;
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
