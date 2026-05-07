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
                console.log('Voces disponibles:', voices.map(v => `${v.name} (${v.lang}) - ${v.gender || 'unknown'}`));
                
                // Lista prioritaria de voces femeninas
                const femaleVoices = [
                    // Español - voces femeninas
                    { name: 'Google español', lang: 'es-ES', keywords: ['Google', 'español', 'Mónica', 'Paulina', 'Mia'] },
                    // Inglés - voces femeninas  
                    { name: 'Google UK English Female', lang: 'en-GB', keywords: ['Google', 'UK English Female', 'Samantha', 'Victoria', 'Female'] },
                    { name: 'Google US English Female', lang: 'en-US', keywords: ['Google', 'US English Female', 'Female'] },
                    // Genéricas
                    { name: 'Microsoft Sabina', lang: 'es-MX', keywords: ['Sabina', 'Dalia', 'Microsoft'] },
                    { name: 'Microsoft Zira', lang: 'en-US', keywords: ['Zira', 'Microsoft', 'Female'] }
                ];
                
                // Buscar voz femenina
                for (const target of femaleVoices) {
                    const found = voices.find(v => 
                        target.keywords.some(keyword => v.name.includes(keyword)) &&
                        (v.lang.includes('es') || v.lang.includes('en'))
                    );
                    if (found) {
                        this.voice = found;
                        console.log('✅ Voz femenina seleccionada:', this.voice.name);
                        break;
                    }
                }
                
                // Fallback: buscar cualquier voz con "female" en el nombre
                if (!this.voice) {
                    this.voice = voices.find(v => 
                        v.name.toLowerCase().includes('female') || 
                        v.name.toLowerCase().includes('mujer') ||
                        v.name.toLowerCase().includes('samantha')
                    );
                }
                
                // Último recurso: primera voz disponible
                if (!this.voice && voices.length > 0) {
                    this.voice = voices[0];
                    console.log('⚠️ Usando voz por defecto:', this.voice.name);
                }
            };
            
            setVoices();
            // Algunos navegadores cargan voces después
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
        const lowerText = text.toLowerCase().trim();
        console.log(`🔍 Procesando: "${lowerText}" en ${language}`);
        
        // Respuestas más inteligentes por idioma
        const responses = {
            Spanish: {
                greetings: ['hola', 'buenos dias', 'buenas tardes', 'qué tal', 'hey', 'saludos'],
                howAreYou: ['cómo estás', 'como estas', 'cómo te va', 'que tal', 'como andas'],
                name: ['cómo te llamas', 'tu nombre', 'quien eres', 'quién eres'],
                practice: ['practicar', 'vocabulario', 'gramática', 'ejercicio', 'aprender', 'estudiar'],
                goodbye: ['adiós', 'chao', 'hasta luego', 'nos vemos', 'bye'],
                thanks: ['gracias', 'thank you', 'merci', 'danke'],
                weather: ['clima', 'tiempo', 'hace calor', 'hace frío'],
                help: ['ayuda', 'help', 'que puedes hacer', 'funciones']
            },
            English: {
                greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
                howAreYou: ['how are you', "what's up", 'how do you do', 'how is it going', 'how are ya'],
                name: ['what is your name', 'who are you', 'your name', 'call you'],
                practice: ['practice', 'vocabulary', 'grammar', 'exercise', 'learn', 'study'],
                goodbye: ['goodbye', 'bye', 'see you', 'farewell', 'good night'],
                thanks: ['thanks', 'thank you', 'appreciate'],
                weather: ['weather', 'temperature', 'hot', 'cold', 'rain'],
                help: ['help', 'what can you do', 'features', 'commands']
            }
        };
        
        const langResponses = responses[language] || responses.English;
        
        // Función para detectar patrones
        const detectPattern = (patterns) => {
            return patterns.some(pattern => lowerText.includes(pattern));
        };
        
        // Detectar tipo de mensaje
        if (detectPattern(langResponses.greetings)) {
            const replies = {
                Spanish: ['¡Hola! ¿Cómo estás? ¡Qué gusto verte por aquí! 🌟', '¡Bienvenido/a! ¿Listo para practicar español? 😊', '¡Hola! ¿Qué tal? Vamos a aprender juntos. 📚'],
                English: ['Hello! How are you today? Great to see you! 🌟', 'Hi there! Ready to practice English? 😊', 'Hey! How can I help you learn today? 📚']
            };
            return replies[language]?.[Math.floor(Math.random() * 3)] || replies.English[0];
        }
        
        if (detectPattern(langResponses.howAreYou)) {
            const replies = {
                Spanish: ['¡Muy bien! Gracias por preguntar. Estoy emocionada de ayudarte con tu español. ¿Y tú cómo estás? 😊', '¡Excelente! Siempre feliz de practicar idiomas. ¿Cómo va tu día? 🌟'],
                English: ["I'm doing great! Thanks for asking. I'm excited to help you with your English. How about you? 😊", "Excellent! Always happy to practice languages. How's your day going? 🌟"]
            };
            return replies[language]?.[0] || replies.English[0];
        }
        
        if (detectPattern(langResponses.name)) {
            const replies = {
                Spanish: ['¡Soy LinguaAI! Tu tutora personal de idiomas con inteligencia artificial. Puedes llamarme Lingua. 🎧', 'Soy LinguaAI, creada para ayudarte a aprender idiomas de forma divertida. ¿En qué puedo ayudarte? ✨'],
                English: ["I'm LinguaAI! Your personal AI language tutor with a friendly voice. You can call me Lingua. 🎧", "I'm LinguaAI, created to help you learn languages in a fun way. How can I help you? ✨"]
            };
            return replies[language]?.[0] || replies.English[0];
        }
        
        if (detectPattern(langResponses.thanks)) {
            const replies = {
                Spanish: ['¡De nada! Es un placer ayudarte a aprender. ¿Qué más quieres practicar? 😊', '¡Para eso estoy! Sigue así, vas muy bien. 🎯'],
                English: ["You're welcome! It's a pleasure helping you learn. What else would you like to practice? 😊", "That's what I'm here for! Keep it up, you're doing great. 🎯"]
            };
            return replies[language]?.[0] || replies.English[0];
        }
        
        if (detectPattern(langResponses.goodbye)) {
            const replies = {
                Spanish: ['¡Hasta luego! Sigue practicando todos los días. ¡Nos vemos pronto! 👋', '¡Adiós! Recuerda que la práctica hace al maestro. ¡Vuelve pronto! 🌟'],
                English: ["Goodbye! Keep practicing every day. See you soon! 👋", "Bye! Remember that practice makes perfect. Come back soon! 🌟"]
            };
            return replies[language]?.[0] || replies.English[0];
        }
        
        if (detectPattern(langResponses.practice)) {
            const replies = {
                Spanish: ['¡Genial! Podemos practicar:\n📚 Vocabulario básico\n💬 Frases comunes\n🎭 Conversación simulada\n🗣️ Pronunciación\n\n¿Qué prefieres?', 'Excelente elección. ¿Te gustaría empezar con saludos, números o frases útiles para viajar? ✈️'],
                English: ["Great! We can practice:\n📚 Basic vocabulary\n💬 Common phrases\n🎭 Simulated conversation\n🗣️ Pronunciation\n\nWhat would you prefer?", "Excellent choice. Would you like to start with greetings, numbers, or useful travel phrases? ✈️"]
            };
            return replies[language]?.[0] || replies.English[0];
        }
        
        // Respuesta personalizada basada en el mensaje del usuario
        const personalizedReplies = {
            Spanish: `¡Excelente mensaje! "${text}" está muy bien escrito en español. ¿Quieres que te ayude con más vocabulario relacionado o prefieres practicar conversación? 🎯`,
            English: `Great message! "${text}" is well written in English. Would you like help with more related vocabulary or prefer to practice conversation? 🎯`
        };
        
        return personalizedReplies[language] || personalizedReplies.English;
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
        
        try {
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
            utterance.pitch = 1.3; // Más agudo = más femenino
            utterance.volume = 1;
            
            // Forzar voz femenina guardada
            if (this.voice) {
                utterance.voice = this.voice;
                console.log('🎤 Usando voz:', this.voice.name);
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                console.error('Error al hablar:', e);
                resolve();
            };
            
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Error en speak:', e);
            resolve();
        }
    });
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
