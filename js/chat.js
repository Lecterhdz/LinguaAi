class LinguaAIChat {
    constructor() {
        // Cargar API key de forma segura desde sessionStorage
        this.GROQ_API_KEY = this.loadApiKey();
        this.isProcessing = false;
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // Verificar si hay API key configurada
        if (!this.GROQ_API_KEY) {
            this.showApiKeyPrompt();
        }
    }

    loadApiKey() {
        // Intentar cargar desde sessionStorage (seguro, no persiste después de cerrar)
        const savedKey = sessionStorage.getItem('groq_api_key');
        if (savedKey && savedKey.startsWith('gsk_')) {
            return savedKey;
        }
        
        // Intentar desde localStorage (persistente pero menos seguro)
        const persistentKey = localStorage.getItem('groq_api_key');
        if (persistentKey && persistentKey.startsWith('gsk_')) {
            return persistentKey;
        }
        
        return null;
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
        // Esperar a que el DOM esté listo
        setTimeout(() => {
            const useDemo = confirm(
                '🔑 Configuración de API Key de Groq\n\n' +
                'Sin API key: Modo demo (respuestas básicas)\n' +
                'Con API key: IA avanzada (recomendado)\n\n' +
                '¿Quieres configurar tu API key gratuita?\n\n' +
                '✓ Aceptar = Configurar API key\n' +
                '✓ Cancelar = Usar modo demo'
            );
            
            if (useDemo) {
                this.promptForApiKey();
            } else {
                this.addMessage('system', '📘 Modo demo activado. Puedes configurar API key desde el menú 🔑');
            }
        }, 1000);
    }

    promptForApiKey() {
        const key = prompt(
            '🔑 Obtén tu API Key de Groq (GRATIS):\n\n' +
            '1. Ve a https://console.groq.com\n' +
            '2. Regístrate con Google/GitHub\n' +
            '3. Ve a "API Keys" → "Create API Key"\n' +
            '4. Copia la key (empieza con gsk_)\n' +
            '5. Pégala aquí abajo:\n\n' +
            '¿Quieres guardarla solo por hoy? (Cancelar = guardar permanentemente)'
        );
        
        if (key && key.startsWith('gsk_')) {
            const persistent = confirm('¿Guardar la key permanentemente en este dispositivo?\n\n✓ Aceptar = Guardar (no la perderás al recargar)\n✗ Cancelar = Solo por hoy');
            this.saveApiKey(key, persistent);
            this.addMessage('system', '✅ API key configurada correctamente. ¡Disfruta de la IA avanzada!');
            return true;
        } else if (key) {
            alert('❌ Key inválida. Debe empezar con "gsk_"');
            this.promptForApiKey();
        }
        return false;
    }

    setupVoice() {
        this.voice = null;
        if (window.speechSynthesis) {
            const setVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                // Buscar voz femenina en español/inglés
                this.voice = voices.find(v => 
                    (v.lang.includes('es') && (v.name.includes('Mónica') || v.name.includes('Google') || v.name.includes('es-ES')))
                ) || voices.find(v => 
                    v.lang.includes('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Female'))
                ) || voices[0];
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }

    async sendToGroq(userText, language) {
        // Si no hay API key, usar modo demo
        if (!this.GROQ_API_KEY) {
            return this.getFallbackResponse(userText, language);
        }

        const systemPrompts = {
            Spanish: "Eres una tutora de español con voz de mujer, amable, paciente y entusiasta. Corrige errores suavemente. Da ejemplos cortos. Responde en español. Máximo 3 oraciones.",
            English: "You are a female English tutor, kind, patient and enthusiastic. Correct mistakes gently. Give short examples. Respond in English. Maximum 3 sentences.",
            French: "Tu es une tutrice de français avec voix féminine, gentille et patiente. Corrige les erreurs doucement. Réponds en français. Maximum 3 phrases.",
            German: "Du bist eine Deutsch-Tutorin mit weiblicher Stimme, freundlich und geduldig. Antworte auf Deutsch. Maximal 3 Sätze.",
            Italian: "Sei una tutor di italiano con voce femminile, gentile e paziente. Rispondi in italiano. Massimo 3 frasi.",
            Japanese: "あなたは女性の日本語チューターです。親切で忍耐強く、日本語で答えてください。最大3文。"
        };

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: systemPrompts[language] || systemPrompts.Spanish },
                        ...this.messages.slice(-10),
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7,
                    max_tokens: 200
                })
            });

            if (response.status === 401) {
                this.addMessage('system', '❌ API key inválida o expirada. Configura una nueva desde el menú 🔑');
                this.GROQ_API_KEY = null;
                sessionStorage.removeItem('groq_api_key');
                localStorage.removeItem('groq_api_key');
                return this.getFallbackResponse(userText, language);
            }

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error con Groq:', error);
            return this.getFallbackResponse(userText, language);
        }
    }

    getFallbackResponse(text, language) {
        const lowerText = text.toLowerCase();
        
        // Respuestas inteligentes para modo demo
        const responses = {
            Spanish: {
                greetings: ["¡Hola! ¿Cómo estás?", "¡Buenos días! ¿Listo para practicar?", "¡Hola! ¿Qué tal?"],
                howAreYou: ["¡Muy bien! Gracias por preguntar. ¿Y tú?", "Excelente, gracias. ¿Cómo va tu día?"],
                practice: ["¡Genial! Practiquemos vocabulario básico. ¿Qué temas te interesan?", "Perfecto. Vamos a aprender frases útiles."],
                goodbye: ["¡Hasta luego! Sigue practicando.", "¡Nos vemos! Recuerda practicar todos los días."],
                default: `📚 ¡Buena práctica! "${text}" está bien. ¿Quieres aprender más sobre ${language}?`
            },
            English: {
                greetings: ["Hello! How are you today?", "Hi there! Ready to practice?", "Hey! Great to see you!"],
                howAreYou: ["I'm doing great! Thanks for asking. How about you?", "Excellent! Ready to learn some English?"],
                practice: ["Awesome! Let's practice some basic vocabulary. What topics interest you?", "Perfect. Let's learn useful phrases."],
                goodbye: ["Goodbye! Keep practicing!", "See you later! Practice every day!"],
                default: `📚 Great practice! "${text}" is good. Would you like to learn more ${language}?`
            }
        };
        
        const r = responses[language] || responses.Spanish;
        
        if (/(hola|hello|hi|hey)/i.test(text)) {
            return r.greetings[Math.floor(Math.random() * r.greetings.length)];
        }
        if (/(cómo estás|how are you|como estas)/i.test(text)) {
            return r.howAreYou[Math.floor(Math.random() * r.howAreYou.length)];
        }
        if (/(adiós|bye|goodbye|chao|nos vemos)/i.test(text)) {
            return r.goodbye[Math.floor(Math.random() * r.goodbye.length)];
        }
        if (/(practicar|learn|practice|vocabulario)/i.test(text)) {
            return r.practice[Math.floor(Math.random() * r.practice.length)];
        }
        
        return r.default;
    }

    async sendMessage(userText, language) {
        if (!window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario de demo alcanzado (10 mensajes). Actualiza a Pro para mensajes ilimitados.');
            document.getElementById('menuUpgrade')?.click();
            return;
        }

        this.addMessage('user', userText);
        
        const typingIndicator = this.showTypingIndicator();
        
        const reply = await this.sendToGroq(userText, language);
        
        typingIndicator.remove();
        this.addMessage('ai', reply);
        
        await this.speak(reply, language);
        
        window.auth.incrementMessageCount();
        this.saveHistory();
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatMessages');
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing';
        indicator.innerHTML = '<strong>🤖 LinguaAI</strong><br><span class="dots">...</span>';
        messagesDiv.appendChild(indicator);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        let dotCount = 0;
        const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            const dots = '.'.repeat(dotCount);
            const dotSpan = indicator.querySelector('.dots');
            if (dotSpan) dotSpan.textContent = dots;
        }, 500);
        
        indicator.removeTyping = () => {
            clearInterval(interval);
            indicator.remove();
        };
        
        return indicator;
    }

    addMessage(role, content) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `
            <strong>${role === 'user' ? '👤 Tú' : role === 'ai' ? '🤖 LinguaAI' : 'ℹ️'}</strong>
            <div class="message-content">${this.escapeHtml(content)}</div>
        `;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        if (role !== 'system') {
            this.messages.push({ role, content, timestamp: Date.now() });
        }
        
        if (this.messages.length > 50) {
            this.messages = this.messages.slice(-50);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async speak(text, language) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                resolve();
                return;
            }
            
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            const langMap = {
                Spanish: 'es-ES',
                English: 'en-US',
                French: 'fr-FR',
                German: 'de-DE',
                Italian: 'it-IT',
                Japanese: 'ja-JP'
            };
            utterance.lang = langMap[language] || 'es-ES';
            utterance.rate = 0.95;
            utterance.pitch = 1.2;
            utterance.volume = 1;
            
            if (this.voice) {
                utterance.voice = this.voice;
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            
            window.speechSynthesis.speak(utterance);
        });
    }

    saveHistory() {
        const user = window.auth?.getCurrentUser();
        if (user) {
            const history = this.messages.slice(-50);
            localStorage.setItem(`chat_history_${user.license}`, JSON.stringify(history));
        }
    }

    loadHistory() {
        const user = window.auth?.getCurrentUser();
        if (user) {
            const history = localStorage.getItem(`chat_history_${user.license}`);
            if (history) {
                this.messages = JSON.parse(history);
                this.messages.forEach(msg => {
                    if (msg.role !== 'system') {
                        this.addMessage(msg.role, msg.content);
                    }
                });
            }
        }
    }

    clearHistory() {
        this.messages = [];
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML = `
            <div class="welcome-message">
                <div class="ai-icon">🎧</div>
                <h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2>
                <p>Tu tutora personal de idiomas con voz de mujer.<br>¿Qué quieres practicar hoy?</p>
            </div>
        `;
        this.saveHistory();
    }

    resetApiKey() {
        if (confirm('¿Eliminar la API key guardada? Volverás al modo demo.')) {
            sessionStorage.removeItem('groq_api_key');
            localStorage.removeItem('groq_api_key');
            this.GROQ_API_KEY = null;
            this.addMessage('system', '🔑 API key eliminada. Usando modo demo. Configura una nueva desde el menú.');
            this.promptForApiKey();
        }
    }

    initEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const speakerBtn = document.getElementById('speakerBtn');
        const userInput = document.getElementById('userInput');
        
        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode?.replaceChild(newSendBtn, sendBtn);
            document.getElementById('sendBtn').onclick = () => this.handleSend();
        }
        
        if (voiceBtn) {
            const newVoiceBtn = voiceBtn.cloneNode(true);
            voiceBtn.parentNode?.replaceChild(newVoiceBtn, voiceBtn);
            document.getElementById('voiceBtn').onclick = () => this.handleVoice();
        }
        
        if (speakerBtn) {
            const newSpeakerBtn = speakerBtn.cloneNode(true);
            speakerBtn.parentNode?.replaceChild(newSpeakerBtn, speakerBtn);
            document.getElementById('speakerBtn').onclick = () => this.handleSpeaker();
        }
        
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
        if (this.isProcessing) {
            this.addMessage('system', '⏳ Espera, estoy procesando...');
            return;
        }
        
        const input = document.getElementById('userInput');
        const text = input?.value.trim();
        if (!text) return;
        
        this.isProcessing = true;
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
        }
        
        const language = document.getElementById('languageSelect')?.value || 'Spanish';
        await this.sendMessage(text, language);
        
        if (input) input.value = '';
        this.isProcessing = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
    }

    async handleVoice() {
        const voiceBtn = document.getElementById('voiceBtn');
        const originalColor = voiceBtn?.style.background;
        if (voiceBtn) {
            voiceBtn.style.background = '#00d4ff';
            voiceBtn.style.transform = 'scale(1.1)';
        }
        
        const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        const languageMap = {
            Spanish: 'es-ES',
            English: 'en-US',
            French: 'fr-FR',
            German: 'de-DE',
            Italian: 'it-IT',
            Japanese: 'ja-JP'
        };
        
        const currentLang = document.getElementById('languageSelect')?.value || 'Spanish';
        recognition.lang = languageMap[currentLang] || 'es-ES';
        recognition.interimResults = false;
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            const input = document.getElementById('userInput');
            if (input) input.value = text;
            if (voiceBtn) {
                voiceBtn.style.background = originalColor;
                voiceBtn.style.transform = '';
            }
            const statusDiv = document.getElementById('voiceStatus');
            if (statusDiv) {
                statusDiv.innerHTML = `<span style="color: #00d4ff;">🎤 "${text}"</span>`;
                setTimeout(() => { statusDiv.innerHTML = ''; }, 2000);
            }
            this.handleSend();
        };
        
        recognition.onerror = () => {
            if (voiceBtn) {
                voiceBtn.style.background = originalColor;
                voiceBtn.style.transform = '';
            }
            const statusDiv = document.getElementById('voiceStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color: #ff4444;">❌ No se pudo reconocer, intenta de nuevo</span>';
                setTimeout(() => { statusDiv.innerHTML = ''; }, 2000);
            }
        };
        
        recognition.start();
    }

    async handleSpeaker() {
        const speakerBtn = document.getElementById('speakerBtn');
        const originalColor = speakerBtn?.style.background;
        if (speakerBtn) speakerBtn.style.background = '#00d4ff';
        
        const lastMessage = [...this.messages].reverse().find(m => m.role === 'ai');
        if (lastMessage) {
            await this.speak(lastMessage.content, document.getElementById('languageSelect')?.value || 'Spanish');
        } else {
            await this.speak("Hola, soy LinguaAI. Escribe algo y te ayudaré a practicar", 'Spanish');
        }
        
        setTimeout(() => {
            if (speakerBtn) speakerBtn.style.background = originalColor;
        }, 500);
    }
}

// Inicializar chat cuando el DOM esté listo
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chat = new LinguaAIChat();
    });
}
