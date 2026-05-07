class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // Mensaje de bienvenida después de 1 segundo
        setTimeout(() => {
            if (this.messages.length === 0) {
                this.addMessage('ai', '¡Hola! Soy LinguaAI. ¿Qué idioma quieres practicar hoy? 🇪🇸🇬🇧🇫🇷');
            }
        }, 1000);
    }

    setupVoice() {
        this.voice = null;
        if (window.speechSynthesis) {
            const setVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('Voces disponibles:', voices.map(v => `${v.name} (${v.lang})`));
                
                // Buscar voz femenina
                this.voice = voices.find(v => 
                    v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('samantha') ||
                    v.name.toLowerCase().includes('google') && v.lang.includes('en') ||
                    v.name.toLowerCase().includes('monica') ||
                    v.name.toLowerCase().includes('zira')
                ) || voices.find(v => v.lang.includes('es')) || voices[0];
                
                if (this.voice) {
                    console.log('✅ Voz seleccionada:', this.voice.name);
                }
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }
    
    // RESPUESTAS INTELIGENTES SIN API
    getSmartResponse(userText, language) {
        const text = userText.toLowerCase().trim();
        console.log(`💬 Procesando mensaje: "${text}" en ${language}`);
        
        // Base de respuestas por idioma
        const responses = {
            Spanish: {
                greetings: ['hola', 'buenos dias', 'buenas', 'quetal', 'hey', 'saludos', 'buenas tardes', 'buenas noches'],
                howAreYou: ['cómo estás', 'como estas', 'cómo te va', 'que tal', 'como andas', 'cómo andas'],
                name: ['cómo te llamas', 'tu nombre', 'quien eres', 'quién eres', 'como te llamas'],
                practice: ['practicar', 'vocabulario', 'gramática', 'ejercicio', 'aprender', 'estudiar', 'lecciones'],
                goodbye: ['adiós', 'chao', 'hasta luego', 'nos vemos', 'bye', 'hasta pronto'],
                thanks: ['gracias', 'thank', 'merci', 'danke', 'obrigado'],
                help: ['ayuda', 'que puedes hacer', 'funciones', 'comandos', 'que sabes hacer']
            },
            English: {
                greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings', 'howdy'],
                howAreYou: ['how are you', "what's up", 'how do you do', 'how is it going', 'how are ya', 'how are you doing'],
                name: ['what is your name', 'who are you', 'your name', 'call you', 'what are you'],
                practice: ['practice', 'vocabulary', 'grammar', 'exercise', 'learn', 'study', 'lessons'],
                goodbye: ['goodbye', 'bye', 'see you', 'farewell', 'good night', 'see ya'],
                thanks: ['thanks', 'thank you', 'appreciate', 'grateful'],
                help: ['help', 'what can you do', 'features', 'commands', 'capabilities']
            }
        };
        
        const langRes = responses[language] || responses.English;
        
        // Función para detectar patrones
        const matches = (patterns) => {
            return patterns.some(pattern => text.includes(pattern));
        };
        
        // Saludos
        if (matches(langRes.greetings)) {
            const replies = {
                Spanish: [
                    '¡Hola! ¿Cómo estás? ¡Qué gusto verte por aquí! 🌟',
                    '¡Bienvenido/a! ¿Listo para practicar español? 😊',
                    '¡Hola! ¿Qué tal? Vamos a aprender juntos. 📚',
                    '¡Saludos! Soy LinguaAI, tu tutora personal. ¿En qué puedo ayudarte? 🎧'
                ],
                English: [
                    'Hello! How are you today? Great to see you! 🌟',
                    'Hi there! Ready to practice English? 😊',
                    'Hey! How can I help you learn today? 📚',
                    'Greetings! I\'m LinguaAI, your personal tutor. How can I help you? 🎧'
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // ¿Cómo estás?
        if (matches(langRes.howAreYou)) {
            const replies = {
                Spanish: [
                    '¡Muy bien! Gracias por preguntar. Estoy emocionada de ayudarte con tu español. ¿Y tú cómo estás? 😊',
                    '¡Excelente! Siempre feliz de practicar idiomas. ¿Cómo va tu día? 🌟',
                    '¡Perfectamente! Lista para aprender. ¿Y tú, qué tal? 🎯'
                ],
                English: [
                    "I'm doing great! Thanks for asking. I'm excited to help you with your English. How about you? 😊",
                    "Excellent! Always happy to practice languages. How's your day going? 🌟",
                    "Perfect! Ready to learn. How about you? 🎯"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Nombre
        if (matches(langRes.name)) {
            const replies = {
                Spanish: [
                    '¡Soy LinguaAI! Tu tutora personal de idiomas con inteligencia artificial. Puedes llamarme Lingua. 🎧',
                    'Soy LinguaAI, creada para ayudarte a aprender idiomas de forma divertida. ¿En qué puedo ayudarte? ✨'
                ],
                English: [
                    "I'm LinguaAI! Your personal AI language tutor with a friendly voice. You can call me Lingua. 🎧",
                    "I'm LinguaAI, created to help you learn languages in a fun way. How can I help you? ✨"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Gracias
        if (matches(langRes.thanks)) {
            const replies = {
                Spanish: [
                    '¡De nada! Es un placer ayudarte a aprender. ¿Qué más quieres practicar? 😊',
                    '¡Para eso estoy! Sigue así, vas muy bien. 🎯',
                    '¡Encantada de ayudar! ¿Algo más en lo que pueda asistirte? 🌟'
                ],
                English: [
                    "You're welcome! It's a pleasure helping you learn. What else would you like to practice? 😊",
                    "That's what I'm here for! Keep it up, you're doing great. 🎯",
                    "Happy to help! Anything else I can assist you with? 🌟"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Despedidas
        if (matches(langRes.goodbye)) {
            const replies = {
                Spanish: [
                    '¡Hasta luego! Sigue practicando todos los días. ¡Nos vemos pronto! 👋',
                    '¡Adiós! Recuerda que la práctica hace al maestro. ¡Vuelve pronto! 🌟',
                    '¡Nos vemos! No olvides practicar un poco cada día. 📚'
                ],
                English: [
                    "Goodbye! Keep practicing every day. See you soon! 👋",
                    "Bye! Remember that practice makes perfect. Come back soon! 🌟",
                    "See you later! Don't forget to practice a little every day. 📚"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Practicar/Aprender
        if (matches(langRes.practice)) {
            const replies = {
                Spanish: [
                    '¡Genial! Podemos practicar:\n📚 Vocabulario básico\n💬 Frases comunes\n🎭 Conversación simulada\n🗣️ Pronunciación\n\n¿Qué prefieres?',
                    'Excelente elección. ¿Te gustaría empezar con saludos, números o frases útiles para viajar? ✈️',
                    '¡Me encanta! ¿Qué tema te interesa más? Comida, viajes, trabajo o familia? 🎯'
                ],
                English: [
                    "Great! We can practice:\n📚 Basic vocabulary\n💬 Common phrases\n🎭 Simulated conversation\n🗣️ Pronunciation\n\nWhat would you prefer?",
                    "Excellent choice. Would you like to start with greetings, numbers, or useful travel phrases? ✈️",
                    "I love it! What topic interests you most? Food, travel, work, or family? 🎯"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Ayuda
        if (matches(langRes.help)) {
            const replies = {
                Spanish: [
                    '¡Claro! Puedo ayudarte a:\n✅ Practicar conversación\n✅ Enseñar vocabulario\n✅ Corregir pronunciación\n✅ Explicar gramática\n\n¿Qué deseas hacer?',
                    'Mis funciones incluyen:\n🗣️ Conversación en 6 idiomas\n🔊 Lectura con voz femenina\n🎤 Reconocimiento de voz\n📚 Lecciones personalizadas\n\n¿Qué te gustaría probar?'
                ],
                English: [
                    "Sure! I can help you:\n✅ Practice conversation\n✅ Teach vocabulary\n✅ Correct pronunciation\n✅ Explain grammar\n\nWhat would you like to do?",
                    "My features include:\n🗣️ Conversation in 6 languages\n🔊 Reading with female voice\n🎤 Voice recognition\n📚 Personalized lessons\n\nWhat would you like to try?"
                ]
            };
            const replyList = replies[language] || replies.English;
            return replyList[Math.floor(Math.random() * replyList.length)];
        }
        
        // Respuesta personalizada por defecto
        const defaultReplies = {
            Spanish: [
                `📚 "¡Muy bien! \"${userText}\" está correcto en español. ¿Quieres aprender más frases relacionadas o prefieres practicar conversación?`,
                `🎯 ¡Excelente práctica! ¿Te gustaría que te enseñe vocabulario sobre "${userText}" o prefieres seguir conversando?`,
                `💬 Entiendo que dices "${userText}". En español, se usa en contextos como... ¿Quieres que te dé ejemplos?`
            ],
            English: [
                `📚 "Great! \"${userText}\" is correct in English. Would you like to learn more related phrases or practice conversation?`,
                `🎯 Excellent practice! Would you like me to teach you vocabulary about "${userText}" or continue the conversation?`,
                `💬 I understand you said "${userText}". In English, this is used in contexts like... Would you like examples?`
            ]
        };
        
        const replies = defaultReplies[language] || defaultReplies.English;
        return replies[Math.floor(Math.random() * replies.length)];
    }

    async sendMessage(userText, language) {
        // Verificar límite de demo
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario de demo alcanzado (10 mensajes). Actualiza a Pro.');
            if (document.getElementById('menuUpgrade')) {
                document.getElementById('menuUpgrade').click();
            }
            return;
        }

        // Agregar mensaje del usuario
        this.addMessage('user', userText);
        
        // Pequeña pausa para simular procesamiento (más natural)
        await this.delay(300);
        
        // Obtener respuesta inteligente
        const reply = this.getSmartResponse(userText, language);
        
        // Agregar respuesta de la IA
        this.addMessage('ai', reply);
        
        // Reproducir voz (sin esperar)
        this.speak(reply, language).catch(e => console.log('Error al hablar:', e));
        
        // Incrementar contador
        if (window.auth) {
            window.auth.incrementMessageCount();
        }
        
        // Guardar historial
        this.saveHistory();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addMessage(role, content) {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) {
            console.error('No se encontró chatMessages');
            return;
        }
        
        // Eliminar mensaje de "escribiendo" si existe
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const icon = role === 'user' ? '👤' : role === 'ai' ? '🤖' : 'ℹ️';
        const name = role === 'user' ? 'Tú' : role === 'ai' ? 'LinguaAI' : 'Sistema';
        
        messageDiv.innerHTML = `
            <strong>${icon} ${name}</strong>
            <div class="message-content">${this.escapeHtml(content)}</div>
        `;
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Guardar en historial
        if (role !== 'system') {
            this.messages.push({ role, content, timestamp: Date.now() });
        }
        
        // Limitar historial
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
                utterance.pitch = 1.25; // Más agudo = más femenino
                utterance.volume = 1;
                
                if (this.voice) {
                    utterance.voice = this.voice;
                }
                
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve();
                
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error('Error al hablar:', e);
                resolve();
            }
        });
    }

    saveHistory() {
        const user = window.auth?.getCurrentUser();
        if (user && this.messages.length > 0) {
            try {
                const history = this.messages.slice(-50);
                localStorage.setItem(`chat_history_${user.license}`, JSON.stringify(history));
            } catch (e) {
                console.error('Error guardando historial:', e);
            }
        }
    }

    loadHistory() {
        const user = window.auth?.getCurrentUser();
        if (user) {
            try {
                const history = localStorage.getItem(`chat_history_${user.license}`);
                if (history) {
                    this.messages = JSON.parse(history);
                    const recentMessages = this.messages.slice(-20);
                    recentMessages.forEach(msg => {
                        if (msg.role !== 'system') {
                            this.addMessage(msg.role, msg.content);
                        }
                    });
                }
            } catch (e) {
                console.error('Error cargando historial:', e);
            }
        }
    }

    clearHistory() {
        this.messages = [];
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.innerHTML = `
                <div class="welcome-message">
                    <div class="ai-icon">🎧</div>
                    <h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2>
                    <p>Tu tutora personal de idiomas con voz de mujer.<br>¿Qué quieres practicar hoy?</p>
                </div>
            `;
        }
        this.saveHistory();
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
        // Evitar procesamiento múltiple
        if (this.isProcessing) {
            console.log('⏳ Ya procesando un mensaje...');
            return;
        }
        
        const input = document.getElementById('userInput');
        const text = input?.value.trim();
        
        if (!text) return;
        
        this.isProcessing = true;
        
        // Deshabilitar botón de enviar
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
        }
        
        const language = document.getElementById('languageSelect')?.value || 'Spanish';
        
        try {
            await this.sendMessage(text, language);
        } catch (error) {
            console.error('Error en handleSend:', error);
            this.addMessage('system', '❌ Ocurrió un error. Por favor intenta de nuevo.');
        }
        
        // Limpiar input
        if (input) input.value = '';
        
        // Reactivar
        this.isProcessing = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
        
        // Enfocar input
        input?.focus();
    }

    async handleVoice() {
        const voiceBtn = document.getElementById('voiceBtn');
        const originalBg = voiceBtn?.style.background;
        
        if (voiceBtn) {
            voiceBtn.style.background = '#00d4ff';
            voiceBtn.style.transform = 'scale(1.1)';
        }
        
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
            this.addMessage('system', '❌ Tu navegador no soporta reconocimiento de voz');
            return;
        }
        
        const recognition = new SpeechRecognition();
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
                voiceBtn.style.background = originalBg;
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
                voiceBtn.style.background = originalBg;
                voiceBtn.style.transform = '';
            }
            const statusDiv = document.getElementById('voiceStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<span style="color: #ff4444;">❌ No se reconoció, intenta de nuevo</span>';
                setTimeout(() => { statusDiv.innerHTML = ''; }, 2000);
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
            await this.speak(lastMessage.content, document.getElementById('languageSelect')?.value || 'Spanish');
        } else {
            await this.speak("Hola, soy LinguaAI. Escribe algo y te ayudaré a practicar", 'Spanish');
        }
        
        setTimeout(() => {
            if (speakerBtn) speakerBtn.style.background = originalBg;
        }, 500);
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chat = new LinguaAIChat();
    });
} else {
    window.chat = new LinguaAIChat();
}
