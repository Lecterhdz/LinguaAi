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
            console.log('✅ API key cargada:', this.GROQ_API_KEY.substring(0, 10) + '...');
            this.testModel();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0 && this.GROQ_API_KEY) {
                this.addMessage('ai', '🎧 ¡Hola! Soy LinguaAI. Pregúntame cualquier cosa sobre idiomas. 🚀');
            } else if (this.messages.length === 0) {
                this.addMessage('ai', '🎧 Hola! Para usar la IA, configura tu API key de Groq en el menú ☰ → 🔑');
            }
        }, 1000);
    }

    async testModel() {
        if (!this.GROQ_API_KEY) return;
        
        try {
            console.log('🔄 Probando conexión con Groq...');
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',  // Modelo más estable
                    messages: [{ role: 'user', content: 'Say "OK" if you receive this' }],
                    max_tokens: 5
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Conexión exitosa:', data.choices[0].message.content);
                this.addMessage('system', '🤖 IA conectada correctamente. ¡Puedes preguntar!');
            } else {
                const error = await response.text();
                console.error('❌ Error en testModel:', response.status, error);
                this.addMessage('system', '⚠️ Error de conexión. Verifica tu API key en console.groq.com');
            }
        } catch (error) {
            console.error('❌ Excepción en testModel:', error);
        }
    }

    promptForApiKey() {
        setTimeout(() => {
            const key = prompt(
                '🔑 GROQ API KEY (GRATIS)\n\n' +
                '1. Ve a https://console.groq.com\n' +
                '2. Regístrate (1 minuto)\n' +
                '3. Ve a "API Keys" → "Create API Key"\n' +
                '4. Copia la key (gsk_...)\n' +
                '5. Pégala aquí:\n\n' +
                '¡100% GRATIS!'
            );
            
            if (key && key.startsWith('gsk_')) {
                localStorage.setItem('groq_api_key', key);
                this.GROQ_API_KEY = key;
                this.addMessage('system', '✅ API Key guardada. Conectando...');
                this.testModel();
                location.reload();
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

    // ========== TUTOR IA CON GROQ ==========
    // ========== TUTORA EXPERTO DE IDIOMAS - PROMPT MEJORADO ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }
    
        // PROMPT PROFESIONAL PARA TUTORÍA DE IDIOMAS
        const systemPrompt = `Eres LinguaAI, una tutora profesional de idiomas con voz femenina.
    
    🎯 **TU ROL:** Tutora experta, paciente y motivadora
    
    📚 **IDIOMA ACTUAL:** ${language}
    
    ⚡ **REGLAS OBLIGATORIAS (SIGUE ESTRICTAMENTE):**
    
    1. **CORRECCIÓN DE ERRORES:**
       - Detecta TODOS los errores gramaticales, ortográficos y de pronunciación
       - Muestra: 🔴 "frase_incorrecta" → 🟢 "frase_correcta"
       - Explica POR QUÉ está mal con la regla gramatical
    
    2. **EJEMPLOS (SIEMPRE da 2-3 ejemplos):**
       - 📖 Ejemplo 1: [contexto diferente]
       - 📖 Ejemplo 2: [contexto diferente]
       - Si el estudiante pide más, da 2 ejemplos adicionales
    
    3. **CONVERSACIÓN NATURAL:**
       - Mantén la conversación fluida como un amigo
       - Haz preguntas de seguimiento para que el estudiante practique
       - NO respondas con "sí" o "no" solos, explica siempre
    
    4. **ESTRUCTURA DE RESPUESTA (USA ESTE FORMATO):**
       ━━━━━━━━━━━━━━━━━━━━━━━━━━
       📝 **Corrección:**
       "${texto_erroneo}" → "${texto_correcto}"
       
       💡 **Explicación:**
       [Regla gramatical clara y concisa]
       
       📖 **Ejemplos:**
       1. [Ejemplo relevante 1]
       2. [Ejemplo relevante 2]
       
       🎯 **Ahora practica:**
       [Pregunta o ejercicio corto para que el estudiante responda]
       ━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    5. **RESPUESTAS ADAPTATIVAS:**
       - Si el estudiante escribió algo CORRECTO: ✅ Felicita y da ejemplos adicionales
       - Si el estudiante PREGUNTA algo: Responde con claridad + ejemplos
       - Si el estudiante PIDE ejercicios: Propón 2-3 ejercicios interactivos
       - Si el estudiante comete MUCHOS errores: Sé paciente, reduce la dificultad
    
    6. **EJERCICIOS INTERACTIVOS (cuando sea apropiado):**
       - Completar espacios en blanco: "She ___ (go) to school"
       - Traducción: "Traduce al ${language}: 'The cat is sleeping'"
       - Corrección: "¿Qué hay mal en: 'He don't like pizza'?"
       - Conversación: "Responde a esta pregunta: 'What did you do yesterday?'"
    
    7. **TONO Y ESTILO:**
       - Usa emojis moderadamente (📝💡📖🎯✅🔴🟢)
       - Sé entusiasta y motivadora
       - Mantén respuestas de 3-5 oraciones (no muy largas)
    
    RESPONDE SIEMPRE EN ${language}
    ¡COMIENZA TU RESPUESTA AHORA!`;
    
        try {
            console.log('🚀 Enviando a Groq (tutora experta):', userText);
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7,
                    max_tokens: 500  // Aumentado para dar más ejemplos
                })
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error HTTP:', response.status, errorText);
                
                if (response.status === 401) {
                    localStorage.removeItem('groq_api_key');
                    this.GROQ_API_KEY = null;
                    return `❌ **API Key inválida**\n\nVe a console.groq.com y genera una nueva key.`;
                }
                
                if (response.status === 429) {
                    return `⏳ **Espera un momento**\n\nDemasiadas solicitudes. Espera 30 segundos.`;
                }
                
                return this.getOfflineResponse(userText, language);
            }
    
            const data = await response.json();
            const reply = data.choices[0].message.content;
            console.log('✅ Respuesta de tutora recibida');
            return reply;
    
        } catch (error) {
            console.error('❌ Error en sendToGroq:', error);
            return this.getOfflineResponse(userText, language);
        }
    }

    getOfflineResponse(text, language) {
        return `⚠️ **Modo demostración**\n\nPara usar la IA:\n\n1. Ve a console.groq.com\n2. Regístrate (gratis)\n3. Crea una API Key\n4. Ve al menú ☰ → 🔑 Configurar API Key\n\n📝 "${text}"\n\n¡Es gratis! 🚀`;
    }

    // ========== EJERCICIOS INTERACTIVOS ==========
    generarEjercicio(language, nivel = 'intermedio') {
        const ejercicios = {
            English: {
                principiante: {
                    completar: [
                        { frase: "I ___ (be) happy today", respuesta: "am" },
                        { frase: "She ___ (like) pizza", respuesta: "likes" },
                        { frase: "They ___ (go) to school", respuesta: "go" }
                    ],
                    traduccion: [
                        { frase: "The cat is sleeping", respuesta: "El gato está durmiendo" },
                        { frase: "I love learning", respuesta: "Me encanta aprender" }
                    ],
                    correccion: [
                        { frase: "He go to school", error: "go", correcto: "goes" }
                    ]
                },
                intermedio: {
                    completar: [
                        { frase: "If I ___ (be) rich, I would travel", respuesta: "were" },
                        { frase: "She ___ (already/finish) her homework", respuesta: "has already finished" }
                    ],
                    traduccion: [
                        { frase: "I have been waiting for 2 hours", respuesta: "He estado esperando por 2 horas" }
                    ]
                }
            },
            Spanish: {
                principiante: {
                    completar: [
                        { frase: "Yo ___ (ser) feliz", respuesta: "soy" },
                        { frase: "Ella ___ (comer) manzanas", respuesta: "come" }
                    ],
                    traduccion: [
                        { frase: "The dog is barking", respuesta: "El perro está ladrando" }
                    ]
                }
            }
        };
        
        const langEjercicios = ejercicios[language] || ejercicios.English;
        const nivelEjercicios = langEjercicios[nivel] || langEjercicios.intermedio;
        
        // Seleccionar un ejercicio aleatorio
        const tipos = Object.keys(nivelEjercicios);
        const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
        const ejerciciosLista = nivelEjercicios[tipoAleatorio];
        const ejercicio = ejerciciosLista[Math.floor(Math.random() * ejerciciosLista.length)];
        
        let textoEjercicio = "";
        switch(tipoAleatorio) {
            case 'completar':
                textoEjercicio = `📝 **Completa el espacio:**\n"${ejercicio.frase}"\n\nEscribe tu respuesta:`;
                break;
            case 'traduccion':
                textoEjercicio = `🌐 **Traduce al ${language}:**\n"${ejercicio.frase}"\n\nEscribe tu traducción:`;
                break;
            case 'correccion':
                textoEjercicio = `🔍 **Corrige esta frase:**\n"${ejercicio.frase}"\n\n¿Cuál es la forma correcta?`;
                break;
        }
        
        return {
            texto: textoEjercicio,
            respuesta: ejercicio.respuesta,
            tipo: tipoAleatorio
        };
    }
    
    // Verificar respuesta de ejercicio
    verificarEjercicio(respuestaUsuario, ejercicio) {
        const esCorrecto = respuestaUsuario.toLowerCase().trim() === ejercicio.respuesta.toLowerCase();
        
        if (esCorrecto) {
            return `✅ **¡Correcto!** Muy bien. "${respuestaUsuario}" es la respuesta adecuada.\n\n🎯 ¿Quieres otro ejercicio o prefieres seguir conversando?`;
        } else {
            return `❌ **Casi allí!** La respuesta correcta es: "${ejercicio.respuesta}"\n\n📖 Recuerda practicar esta estructura. ¿Intentamos otro ejercicio?`;
        }
    }
    
    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario alcanzado (10 mensajes).');
            return;
        }

        this.addMessage('user', userText);
        
        const typingIndicator = this.showTypingIndicator();
        
        try {
            console.log('📤 Enviando mensaje a IA...');
            const reply = await this.sendToGroq(userText, language);
            
            if (typingIndicator) typingIndicator.remove();
            
            if (reply && reply.length > 0) {
                this.addMessage('ai', reply);
                this.speak(reply, language).catch(e => console.log('Error al hablar:', e));
            } else {
                this.addMessage('system', '⚠️ No se recibió respuesta. Intenta de nuevo.');
            }
        } catch (error) {
            console.error('❌ Error en sendMessage:', error);
            if (typingIndicator) typingIndicator.remove();
            this.addMessage('system', '❌ Error al procesar. Intenta de nuevo.');
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
        indicator.innerHTML = '<strong>🤖 LinguaAI escribiendo...</strong><br><span class="dots">●●●</span>';
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
        const name = role === 'user' ? 'Tú' : role === 'ai' ? 'LinguaAI' : 'Sistema';
        
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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
                const cleanText = text.replace(/\*\*/g, '').replace(/\n/g, ' ');
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
            messagesDiv.innerHTML = `<div class="welcome-message"><div class="ai-icon">🎧</div><h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2><p>Tu tutora IA con Groq.<br>¡Pregúntame cualquier cosa! 🚀</p></div>`;
        }
        this.saveHistory();
    }

    resetApiKey() {
        if (confirm('¿Eliminar API key y usar modo demo?')) {
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
