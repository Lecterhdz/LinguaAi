class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.currentExercise = null; // Para ejercicios interactivos
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        // Cargar API key
        this.GROQ_API_KEY = localStorage.getItem('groq_api_key') || sessionStorage.getItem('groq_api_key');
        
        if (!this.GROQ_API_KEY) {
            this.promptForApiKey();
        } else {
            console.log('[OK] API key cargada:', this.GROQ_API_KEY.substring(0, 10) + '...');
            this.testModel();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0 && this.GROQ_API_KEY) {
                this.addMessage('ai', '[FELICITACIONES] ¡Hola! Soy LinguaAI, tu tutora de idiomas. ¿Que quieres practicar hoy? [LIBRO]');
            } else if (this.messages.length === 0) {
                this.addMessage('ai', '[SALUDO] Hola! Para usar la IA, configura tu API key de Groq en el menu [MENU] → [KEY]');
            }
        }, 1000);
    }

    async testModel() {
        if (!this.GROQ_API_KEY) return;
        
        try {
            console.log('[TEST] Probando conexion con Groq...');
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 5
                })
            });
            
            if (response.ok) {
                console.log('[OK] Conexion exitosa');
                this.addMessage('system', '[ROBOT] IA conectada correctamente. ¡Puedes preguntar!');
            } else {
                console.error('[ERROR] Conexion fallida:', response.status);
                this.addMessage('system', '[ADVERTENCIA] Error de conexion. Verifica tu API key');
            }
        } catch (error) {
            console.error('[ERROR] Excepcion:', error);
        }
    }

    promptForApiKey() {
        setTimeout(() => {
            const key = prompt(
                'GROQ API KEY (GRATIS)\n\n' +
                '1. Ve a https://console.groq.com\n' +
                '2. Registrate (1 minuto)\n' +
                '3. Ve a "API Keys" → "Create API Key"\n' +
                '4. Copia la key (gsk_...)\n' +
                '5. Pegala aqui\n\n' +
                '100% GRATIS'
            );
            
            if (key && key.startsWith('gsk_')) {
                localStorage.setItem('groq_api_key', key);
                this.GROQ_API_KEY = key;
                this.addMessage('system', '[OK] API Key guardada. Conectando...');
                this.testModel();
            } else if (key) {
                alert('[ERROR] Key invalida. Debe empezar con "gsk_"');
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
                if (this.voice) console.log('[VOZ] ', this.voice.name);
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }

    // ========== GENERAR EJERCICIOS INTERACTIVOS ==========
    generarEjercicio(language, nivel = 'intermedio') {
        const ejercicios = {
            English: {
                principiante: {
                    completar: [
                        { frase: "I ___ (be) happy today", respuesta: "am" },
                        { frase: "She ___ (like) pizza", respuesta: "likes" },
                        { frase: "They ___ (go) to school", respuesta: "go" },
                        { frase: "He ___ (have) a car", respuesta: "has" },
                        { frase: "We ___ (be) friends", respuesta: "are" }
                    ],
                    traduccion: [
                        { frase: "The cat is sleeping", respuesta: "El gato esta durmiendo" },
                        { frase: "I love learning", respuesta: "Me encanta aprender" },
                        { frase: "She is beautiful", respuesta: "Ella es hermosa" }
                    ],
                    correccion: [
                        { frase: "He go to school", error: "go", correcto: "goes" },
                        { frase: "She don't like pizza", error: "don't", correcto: "doesn't" }
                    ]
                },
                intermedio: {
                    completar: [
                        { frase: "If I ___ (be) rich, I would travel", respuesta: "were" },
                        { frase: "She ___ (already/finish) her homework", respuesta: "has already finished" },
                        { frase: "They ___ (live) here for 5 years", respuesta: "have lived" }
                    ],
                    traduccion: [
                        { frase: "I have been waiting for 2 hours", respuesta: "He estado esperando por 2 horas" },
                        { frase: "She would have come if she knew", respuesta: "Ella habria venido si lo hubiera sabido" }
                    ]
                }
            },
            Spanish: {
                principiante: {
                    completar: [
                        { frase: "Yo ___ (ser) feliz", respuesta: "soy" },
                        { frase: "Ella ___ (comer) manzanas", respuesta: "come" },
                        { frase: "Nosotros ___ (vivir) en Madrid", respuesta: "vivimos" }
                    ],
                    traduccion: [
                        { frase: "The dog is barking", respuesta: "El perro esta ladrando" },
                        { frase: "I am studying", respuesta: "Yo estoy estudiando" }
                    ]
                },
                intermedio: {
                    completar: [
                        { frase: "Si yo ___ (tener) dinero, viajaria", respuesta: "tuviera" },
                        { frase: "Cuando ___ (llegar), avisame", respuesta: "llegues" }
                    ]
                }
            }
        };
        
        const langEjercicios = ejercicios[language] || ejercicios.English;
        const nivelEjercicios = langEjercicios[nivel] || langEjercicios.intermedio;
        
        const tipos = Object.keys(nivelEjercicios);
        const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
        const ejerciciosLista = nivelEjercicios[tipoAleatorio];
        const ejercicio = ejerciciosLista[Math.floor(Math.random() * ejerciciosLista.length)];
        
        let textoEjercicio = "";
        switch(tipoAleatorio) {
            case 'completar':
                textoEjercicio = `[EJERCICIO] Completa el espacio:\n\n"${ejercicio.frase}"\n\nEscribe tu respuesta:`;
                break;
            case 'traduccion':
                textoEjercicio = `[TRADUCCION] Traduce al ${language}:\n\n"${ejercicio.frase}"\n\nEscribe tu traduccion:`;
                break;
            case 'correccion':
                textoEjercicio = `[CORREGIR] Corrige esta frase:\n\n"${ejercicio.frase}"\n\nCual es la forma correcta?`;
                break;
        }
        
        this.currentExercise = {
            texto: textoEjercicio,
            respuesta: ejercicio.respuesta,
            tipo: tipoAleatorio,
            original: ejercicio.frase
        };
        
        return this.currentExercise;
    }
    
    // ========== VERIFICAR RESPUESTA DE EJERCICIO ==========
    verificarEjercicio(respuestaUsuario) {
        if (!this.currentExercise) {
            return null;
        }
        
        const esCorrecto = respuestaUsuario.toLowerCase().trim() === this.currentExercise.respuesta.toLowerCase();
        
        if (esCorrecto) {
            const mensaje = `[CORRECTO] ¡Muy bien! "${respuestaUsuario}" es la respuesta adecuada.\n\n[FELICITACIONES] ¿Quieres otro ejercicio o prefieres seguir conversando? [PREGUNTA]`;
            this.currentExercise = null;
            return mensaje;
        } else {
            const mensaje = `[CASI] Casi ahi! La respuesta correcta es: "${this.currentExercise.respuesta}"\n\n[LIBRO] Recuerda practicar esta estructura. ¿Intentamos otro ejercicio? [PREGUNTA]`;
            return mensaje;
        }
    }

    // ========== TUTORA IA CON PROMPT COMPLETO - CORREGIDO ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }
    
        const systemPrompt = `Eres LinguaAI, una tutora profesional de idiomas con voz femenina.
    
    ROL: Tutora experta, paciente y motivadora
    IDIOMA ACTUAL: ${language}
    
    REGLAS OBLIGATORIAS:
    
    1. CORRECCION DE ERRORES:
       - Detecta TODOS los errores gramaticales y ortograficos
       - Muestra: "frase_incorrecta" -> "frase_correcta"
       - Explica POR QUE esta mal con la regla gramatical
    
    2. EJEMPLOS:
       - Siempre da 2-3 ejemplos
       - Ejemplo 1: [contexto diferente]
       - Ejemplo 2: [contexto diferente]
    
    3. CONVERSACION NATURAL:
       - Manten la conversacion fluida como un amigo
       - Haz preguntas de seguimiento para que el estudiante practique
       - No respondas con "si" o "no" solos, explica siempre
    
    4. ESTRUCTURA DE RESPUESTA:
       =================================
       [CORRECCION]
       "frase_original" -> "frase_correcta"
       
       [EXPLICACION]
       [regla gramatical clara y concisa]
       
       [EJEMPLOS]
       1. [ejemplo relevante 1]
       2. [ejemplo relevante 2]
       
       [PRACTICA]
       [pregunta o ejercicio corto]
       =================================
    
    5. RESPUESTAS ADAPTATIVAS:
       - Si el estudiante escribio CORRECTO: Felicita y da ejemplos adicionales
       - Si el estudiante PREGUNTA algo: Responde con claridad + ejemplos
       - Si el estudiante PIDE ejercicios: Propone 2-3 ejercicios interactivos
       - Si el estudiante escribe "ejercicio" o "practicar": Genera un ejercicio especifico
    
    6. TONO Y ESTILO:
       - Se entusiasta y motivadora
       - Manten respuestas de 3-5 oraciones
    
    RESPONDE EN ${language}
    COMIENZA TU RESPUESTA AHORA`;
    
        try {
            console.log('[ENVIO] Enviando a Groq:', userText);
            
            // IMPORTANTE: Filtrar los mensajes para enviar SOLO role y content
            const historialParaGroq = this.messages
                .filter(msg => msg.role !== 'system') // Excluir mensajes del sistema
                .slice(-10) // Solo últimos 10 mensajes
                .map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role, // 'ai' -> 'assistant'
                    content: msg.content
                }));
            
            console.log('[HISTORIAL] Enviando', historialParaGroq.length, 'mensajes de contexto');
            
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
                        ...historialParaGroq,
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                })
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ERROR] HTTP:', response.status, errorText);
                
                if (response.status === 401) {
                    localStorage.removeItem('groq_api_key');
                    this.GROQ_API_KEY = null;
                    return `[ERROR] API Key invalida. Ve a console.groq.com y genera una nueva key.`;
                }
                
                if (response.status === 429) {
                    return `[RELOJ] Espera un momento. Demasiadas solicitudes. Espera 30 segundos.`;
                }
                
                return this.getOfflineResponse(userText, language);
            }
    
            const data = await response.json();
            const reply = data.choices[0].message.content;
            console.log('[OK] Respuesta recibida');
            return reply;
    
        } catch (error) {
            console.error('[ERROR] Envio fallido:', error);
            return this.getOfflineResponse(userText, language);
        }
    }

    getOfflineResponse(text, language) {
        return `[ADVERTENCIA] Modo demostracion\n\nPara usar la IA:\n\n1. Ve a console.groq.com\n2. Registrate (gratis)\n3. Crea una API Key\n4. Ve al menu [MENU] → [KEY]\n\nTu mensaje: "${text}"\n\nEs gratis! [COHETE]`;
    }

    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', '[ADVERTENCIA] Limite diario alcanzado (10 mensajes).');
            return;
        }

        this.addMessage('user', userText);
        
        // Detectar si el usuario está respondiendo un ejercicio
        const lowerText = userText.toLowerCase();
        const estaRespondiendoEjercicio = this.currentExercise && 
            (lowerText.includes(this.currentExercise.respuesta?.toLowerCase()) || 
             lowerText.length < 50);
        
        let reply;
        
        if (estaRespondiendoEjercicio && this.currentExercise) {
            // Verificar respuesta del ejercicio
            reply = this.verificarEjercicio(userText);
            if (reply) {
                this.currentExercise = null;
            }
        } else if (lowerText.includes('ejercicio') || lowerText.includes('practicar') || lowerText.includes('practica')) {
            // Generar un ejercicio interactivo
            const ejercicio = this.generarEjercicio(language, 'intermedio');
            reply = ejercicio.texto;
        } else {
            // Enviar a IA
            const typingIndicator = this.showTypingIndicator();
            try {
                reply = await this.sendToGroq(userText, language);
                if (typingIndicator) typingIndicator.remove();
            } catch (error) {
                if (typingIndicator) typingIndicator.remove();
                reply = '[ERROR] No se pudo procesar. Intenta de nuevo.';
            }
        }
        
        if (reply && reply.length > 0) {
            this.addMessage('ai', reply);
            this.speak(reply, language).catch(e => console.log('[ERROR] Voz:', e));
        } else {
            this.addMessage('system', '[ADVERTENCIA] No se recibio respuesta. Intenta de nuevo.');
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
        indicator.innerHTML = '<strong>[ROBOT] LinguaAI escribiendo...</strong><br><span class="dots">●●●</span>';
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
        const name = role === 'user' ? 'Tu' : role === 'ai' ? 'LinguaAI' : 'Sistema';
        
        // Convertir marcadores a emojis para mejor visualizacion
        let formattedContent = content
            .replace(/\[LAPIZ\]/g, '📝')
            .replace(/\[BOMBILLA\]/g, '💡')
            .replace(/\[LIBRO\]/g, '📖')
            .replace(/\[BLANCO\]/g, '🎯')
            .replace(/\[CHECK\]/g, '✅')
            .replace(/\[ROJO\]/g, '🔴')
            .replace(/\[VERDE\]/g, '🟢')
            .replace(/\[ROBOT\]/g, '🤖')
            .replace(/\[FELICITACIONES\]/g, '🎉')
            .replace(/\[ADVERTENCIA\]/g, '⚠️')
            .replace(/\[RELOJ\]/g, '⏳')
            .replace(/\[COHETE\]/g, '🚀')
            .replace(/\[SALUDO\]/g, '🎧')
            .replace(/\[MENU\]/g, '☰')
            .replace(/\[KEY\]/g, '🔑')
            .replace(/\[EJERCICIO\]/g, '✏️')
            .replace(/\[TRADUCCION\]/g, '🌐')
            .replace(/\[CORREGIR\]/g, '🔍')
            .replace(/\[CORRECTO\]/g, '✅')
            .replace(/\[CASI\]/g, '❌')
            .replace(/\[PREGNUNTA\]/g, '❓')
            .replace(/\[ERROR\]/g, '❌')
            .replace(/\[TEST\]/g, '🔧')
            .replace(/\[ENVIO\]/g, '📤')
            .replace(/\[OK\]/g, '✅')
            .replace(/\[VOZ\]/g, '🎤')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `<strong>${icon} ${name}</strong><div class="message-content">${formattedContent}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Guardar en historial - SIN timestamp para evitar errores con Groq
        if (role !== 'system') {
            this.messages.push({ 
                role: role === 'ai' ? 'ai' : role, 
                content: content 
                // NO incluir timestamp
            });
        }
        if (this.messages.length > 50) this.messages = this.messages.slice(-50);
        // Guardar en localStorage con timestamp (solo para persistencia)
        this.saveHistory();
    }

    async speak(text, language) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }
            try {
                window.speechSynthesis.cancel();
                // Limpiar marcadores para la voz
                let cleanText = text
                    .replace(/\[.*?\]/g, '')
                    .replace(/\*\*/g, '')
                    .replace(/\n/g, ' ');
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
            // Guardar con timestamp SOLO para localStorage, no para Groq
            const historyToSave = this.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: Date.now() // Solo para mostrar en UI después
            }));
            localStorage.setItem(`chat_history_${user.license}`, JSON.stringify(historyToSave.slice(-50)));
        }
    }
    
    loadHistory() {
        const user = window.auth?.getCurrentUser();
        if (user) {
            const history = localStorage.getItem(`chat_history_${user.license}`);
            if (history) {
                const loadedMessages = JSON.parse(history);
                this.messages = loadedMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                    // No incluir timestamp en los mensajes activos
                }));
                this.messages.slice(-20).forEach(msg => {
                    if (msg.role !== 'system') this.addMessage(msg.role, msg.content);
                });
            }
        }
    }

    clearHistory() {
        this.messages = [];
        this.currentExercise = null;
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.innerHTML = `<div class="welcome-message"><div class="ai-icon">🎧</div><h2>Hola, soy <span class="ai-glow">LinguaAI</span></h2><p>Tu tutora IA con Groq.<br>¡Preguntame cualquier cosa! [COHETE]</p></div>`;
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
            this.addMessage('system', '[ERROR] Tu navegador no soporta reconocimiento de voz');
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
            this.addMessage('system', '[ERROR] No te entendi. Intenta de nuevo.');
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
