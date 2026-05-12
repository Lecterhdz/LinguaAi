class LinguaAIChat {
    constructor() {
        this.isProcessing = false;
        this.messages = [];
        this.currentExercise = null;
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
        
        this.GROQ_API_KEY = localStorage.getItem('groq_api_key') || sessionStorage.getItem('groq_api_key');
        
        if (!this.GROQ_API_KEY) {
            this.promptForApiKey();
        } else {
            console.log('[OK] API key cargada:', this.GROQ_API_KEY.substring(0, 10) + '...');
            this.testModel();
        }
        
        setTimeout(() => {
            if (this.messages.length === 0 && this.GROQ_API_KEY) {
                this.addMessage('ai', '🎉 ¡Hola! Soy LinguaAI, tu tutora de idiomas. ¿Qué quieres practicar hoy? 📚');
            } else if (this.messages.length === 0) {
                this.addMessage('ai', '🎧 Hola! Para usar la IA, configura tu API key de Groq en el menú ☰ → 🔑');
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
                this.addMessage('system', '🤖 IA conectada correctamente. ¡Puedes preguntar!');
            } else {
                console.error('[ERROR] Conexion fallida:', response.status);
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
                this.addMessage('system', '✅ API Key guardada. Conectando...');
                this.testModel();
            } else if (key) {
                alert('❌ Key invalida. Debe empezar con "gsk_"');
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
                if (this.voice) console.log('[VOZ]', this.voice.name);
            };
            setVoices();
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    }

    // ========== FUNCIONES DE NIVEL E INTERESES ==========
    getUserLevel() {
        const userMessages = this.messages.filter(m => m.role === 'user').slice(-20);
        let errorCount = 0;
        
        userMessages.forEach(msg => {
            const content = msg.content.toLowerCase();
            if (content.includes('goed')) errorCount++;
            if (content.match(/(he|she|it)\s+don\'t/)) errorCount++;
            if (content.includes('very much') && content.match(/\w+\s+very much/)) errorCount++;
        });
        
        if (errorCount === 0 && userMessages.length > 5) return 'AVANZADO';
        if (errorCount > 5) return 'PRINCIPIANTE';
        return 'INTERMEDIO';
    }

    getUserInterests() {
        const userMessages = this.messages.filter(m => m.role === 'user').slice(-30);
        const topics = [];
        
        const topicKeywords = {
            'viajes': ['travel', 'viaje', 'flight', 'hotel', 'vacation'],
            'negocios': ['business', 'work', 'job', 'office', 'negocio'],
            'tecnologia': ['tech', 'computer', 'phone', 'software', 'app'],
            'educacion': ['study', 'learn', 'school', 'university', 'exam'],
            'comida': ['food', 'restaurant', 'cook', 'eat', 'delicious']
        };
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (userMessages.some(msg => keywords.some(kw => msg.content.toLowerCase().includes(kw)))) {
                topics.push(topic);
            }
        }
        
        return topics.length > 0 ? topics.join(', ') : 'general';
    }

    // ========== FUNCIONES DE EJERCICIOS ==========
    generarEjercicio(language, nivel = 'intermedio') {
        const ejercicios = {
            English: {
                principiante: [
                    { frase: "I ___ (be) happy today", respuesta: "am", tipo: "completar" },
                    { frase: "She ___ (like) pizza", respuesta: "likes", tipo: "completar" },
                    { frase: "They ___ (go) to school", respuesta: "go", tipo: "completar" },
                    { frase: "The cat is sleeping", respuesta: "El gato está durmiendo", tipo: "traduccion" },
                    { frase: "I love learning", respuesta: "Me encanta aprender", tipo: "traduccion" },
                    { frase: "He go to school", respuesta: "goes", tipo: "correccion", original: "He go to school" },
                    { frase: "She don't like pizza", respuesta: "doesn't", tipo: "correccion", original: "She don't like pizza" }
                ],
                intermedio: [
                    { frase: "If I ___ (be) rich, I would travel", respuesta: "were", tipo: "completar" },
                    { frase: "She ___ (already/finish) her homework", respuesta: "has already finished", tipo: "completar" },
                    { frase: "I have been waiting for 2 hours", respuesta: "He estado esperando por 2 horas", tipo: "traduccion" },
                    { frase: "He go to school yesterday", respuesta: "went", tipo: "correccion", original: "He go to school yesterday" }
                ],
                avanzado: [
                    { frase: "Had I known, I ___ (act) differently", respuesta: "would have acted", tipo: "completar" },
                    { frase: "She insisted that he ___ (go)", respuesta: "go", tipo: "completar" }
                ]
            },
            Spanish: {
                principiante: [
                    { frase: "Yo ___ (ser) feliz", respuesta: "soy", tipo: "completar" },
                    { frase: "Ella ___ (comer) manzanas", respuesta: "come", tipo: "completar" },
                    { frase: "The dog is barking", respuesta: "El perro está ladrando", tipo: "traduccion" },
                    { frase: "I am studying", respuesta: "Yo estoy estudiando", tipo: "traduccion" }
                ],
                intermedio: [
                    { frase: "Si yo ___ (tener) dinero, viajaría", respuesta: "tuviera", tipo: "completar" },
                    { frase: "Cuando ___ (llegar), avísame", respuesta: "llegues", tipo: "completar" }
                ]
            }
        };
        
        const langEjercicios = ejercicios[language] || ejercicios.English;
        let nivelEjercicios = langEjercicios[nivel];
        
        if (!nivelEjercicios || nivelEjercicios.length === 0) {
            nivelEjercicios = langEjercicios.intermedio || langEjercicios.principiante;
        }
        
        const ejercicio = nivelEjercicios[Math.floor(Math.random() * nivelEjercicios.length)];
        
        let textoEjercicio = "";
        if (ejercicio.tipo === 'completar') {
            textoEjercicio = language === 'Spanish' 
                ? `✏️ **Ejercicio de completar (Nivel ${nivel}):**\n\n"${ejercicio.frase}"\n\n💡 Escribe la palabra/frase correcta:`
                : `✏️ **Fill in the blank (${nivel} level):**\n\n"${ejercicio.frase}"\n\n💡 Write the correct word/phrase:`;
        } else if (ejercicio.tipo === 'traduccion') {
            textoEjercicio = language === 'Spanish'
                ? `🌐 **Traducción (Nivel ${nivel}):**\n\n"${ejercicio.frase}"\n\n💡 Escribe tu traducción:`
                : `🌐 **Translation (${nivel} level):**\n\n"${ejercicio.frase}"\n\n💡 Write your translation:`;
        } else {
            textoEjercicio = language === 'Spanish'
                ? `🔍 **Corrección (Nivel ${nivel}):**\n\n"${ejercicio.original || ejercicio.frase}"\n\n💡 ¿Cuál es la forma correcta?`
                : `🔍 **Correction (${nivel} level):**\n\n"${ejercicio.original || ejercicio.frase}"\n\n💡 What is the correct form?`;
        }
        
        this.currentExercise = {
            texto: textoEjercicio,
            respuesta: ejercicio.respuesta,
            tipo: ejercicio.tipo,
            nivel: nivel
        };
        
        return this.currentExercise;
    }
    
    verificarEjercicio(respuestaUsuario, language) {
        if (!this.currentExercise) {
            return null;
        }
        
        const esCorrecto = respuestaUsuario.toLowerCase().trim() === this.currentExercise.respuesta.toLowerCase();
        const nivel = this.currentExercise.nivel || 'intermedio';
        
        if (esCorrecto) {
            const mensajesExito = language === 'Spanish'
                ? [
                    `✅ **¡Excelente!** "${respuestaUsuario}" es correcto.\n\n🎉 ¡Muy bien para tu nivel ${nivel}!\n\n💪 ¿Quieres otro ejercicio o seguir conversando?`,
                    `🎯 **¡Perfecto!** Has dominado este tema.\n\n🔥 Sigue así, vas mejorando día a día.\n\n📚 ¿Practicamos otro ejercicio?`,
                    `🌟 **¡Magnífico!** Respuesta correcta.\n\n📖 Recuerda practicar este tipo de ejercicios.\n\n✨ ¿Continuamos?`
                ]
                : [
                    `✅ **Excellent!** "${respuestaUsuario}" is correct.\n\n🎉 Great job for your ${nivel} level!\n\n💪 Would you like another exercise or continue the conversation?`,
                    `🎯 **Perfect!** You've mastered this topic.\n\n🔥 Keep it up, you're improving every day.\n\n📚 Shall we practice another exercise?`,
                    `🌟 **Magnificent!** Correct answer.\n\n📖 Remember to practice this type of exercise.\n\n✨ Shall we continue?`
                ];
            
            const mensaje = mensajesExito[Math.floor(Math.random() * mensajesExito.length)];
            this.currentExercise = null;
            return mensaje;
        } else {
            const pista = this.getHintForExercise(this.currentExercise, language);
            const mensajesError = language === 'Spanish'
                ? [
                    `❌ **Casi ahí!** "${respuestaUsuario}" no es correcto.\n\n💡 La respuesta correcta es: "${this.currentExercise.respuesta}"\n\n📖 ${pista}\n\n🔄 ¿Intentamos otro ejercicio?`,
                    `📝 **Revisemos:** "${respuestaUsuario}" no es la respuesta esperada.\n\n✅ Correcto: "${this.currentExercise.respuesta}"\n\n💪 ¡No te rindas! Cada error te acerca al dominio.\n\n🎯 ¿Quieres otro ejercicio?`
                ]
                : [
                    `❌ **Almost there!** "${respuestaUsuario}" is not correct.\n\n💡 The correct answer is: "${this.currentExercise.respuesta}"\n\n📖 ${pista}\n\n🔄 Shall we try another exercise?`,
                    `📝 **Let's review:** "${respuestaUsuario}" is not the expected answer.\n\n✅ Correct: "${this.currentExercise.respuesta}"\n\n💪 Don't give up! Every mistake brings you closer.\n\n🎯 Want another exercise?`
                ];
            
            return mensajesError[Math.floor(Math.random() * mensajesError.length)];
        }
    }
    
    getHintForExercise(exercise, language) {
        const hints = {
            completar: language === 'Spanish' 
                ? 'Recuerda conjugar el verbo según el sujeto y el tiempo verbal.'
                : 'Remember to conjugate the verb according to the subject and tense.',
            traduccion: language === 'Spanish'
                ? 'Presta atención a la estructura de la oración en español.'
                : 'Pay attention to the sentence structure in English.',
            correccion: language === 'Spanish'
                ? 'Revisa la concordancia entre sujeto y verbo.'
                : 'Check the subject-verb agreement.'
        };
        return hints[exercise.tipo] || 'Practica la estructura de esta oración.';
    }

    // ========== TUTORA IA ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }

        const userLevel = this.getUserLevel();
        const userInterests = this.getUserInterests();
        
        const idiomaInstruccion = language === 'Spanish' 
            ? 'IMPORTANTE: Debes responder ESTRICTAMENTE en ESPAÑOL. NO uses inglés.' 
            : 'IMPORTANT: You MUST respond STRICTLY in ENGLISH. DO NOT use Spanish.';

        const systemPrompt = `Eres LinguaAI, una tutora profesional de idiomas con voz femenina.

IDIOMA ACTUAL: ${language} (OBLIGATORIO)
NIVEL USUARIO: ${userLevel}
INTERESES: ${userInterests}

REGLAS OBLIGATORIAS:

1. CORRECCION DE ERRORES:
   - Muestra: "frase_incorrecta" → "frase_correcta"
   - Explica la regla gramatical

2. EJEMPLOS:
   - Siempre da 2-3 ejemplos con 📖

3. ESTRUCTURA DE RESPUESTA:
   📝 CORRECCION: "original" → "correcta"
   💡 EXPLICACION: [regla gramatical]
   📖 EJEMPLOS: 1. ... 2. ...
   🎯 PRACTICA: [pregunta o ejercicio]

4. RESPUESTAS ADAPTATIVAS:
   - Si escribio CORRECTO: ✅ Felicita + ejemplos
   - Si PREGUNTA: Responde claramente
   - Si PIDE ejercicios: Genera ejercicios

${idiomaInstruccion}

¡RESPONDE AHORA!`;

        try {
            console.log(`[ENVIO] Enviando a Groq en ${language}:`, userText);
            
            const historialParaGroq = this.messages
                .filter(msg => msg.role !== 'system')
                .slice(-10)
                .map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role,
                    content: msg.content
                }));
            
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
                    return this.getOfflineResponse(userText, language);
                }
                
                if (response.status === 429) {
                    return language === 'Spanish' 
                        ? '⏳ Límite de solicitudes. Espera 30 segundos.'
                        : '⏳ Rate limit reached. Wait 30 seconds.';
                }
                
                return this.getOfflineResponse(userText, language);
            }

            const data = await response.json();
            let reply = data.choices[0].message.content;
            
            const hasSpanish = /[áéíóúñ¿¡]/i.test(reply);
            if (language === 'English' && hasSpanish) {
                reply = '⚠️ [English Response Required]\n\nI must respond in English. Please try again.';
            }
            
            console.log('[OK] Respuesta recibida');
            return reply;

        } catch (error) {
            console.error('[ERROR] Envio fallido:', error);
            return this.getOfflineResponse(userText, language);
        }
    }

    getOfflineResponse(text, language) {
        if (language === 'Spanish') {
            return `⚠️ **Modo demostración**\n\nPara usar la IA completa:\n\n1️⃣ Ve a console.groq.com\n2️⃣ Regístrate (gratis)\n3️⃣ Crea una API Key\n4️⃣ Ve al menú ☰ → 🔑\n\n📝 Tu mensaje: "${text}"\n\n🚀 ¡Es gratis!`;
        } else {
            return `⚠️ **Demo Mode**\n\nTo use the full AI tutor:\n\n1️⃣ Go to console.groq.com\n2️⃣ Sign up (free)\n3️⃣ Create an API Key\n4️⃣ Go to menu ☰ → 🔑\n\n📝 Your message: "${text}"\n\n🚀 It's free!`;
        }
    }

    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', language === 'Spanish' ? '⚠️ Límite diario alcanzado (10 mensajes).' : '⚠️ Daily limit reached (10 messages).');
            return;
        }

        this.addMessage('user', userText);
        
        const lowerText = userText.toLowerCase();
        
        const pideEjercicio = (language === 'Spanish' && (lowerText.includes('ejercicio') || lowerText.includes('practicar') || lowerText.includes('actividad'))) ||
                              (language === 'English' && (lowerText.includes('exercise') || lowerText.includes('practice') || lowerText.includes('activity')));
        
        const estaRespondiendoEjercicio = this.currentExercise && lowerText.length < 80;
        
        let reply;
        
        if (estaRespondiendoEjercicio && this.currentExercise) {
            reply = this.verificarEjercicio(userText, language);
            if (reply && (reply.includes('Excelente') || reply.includes('Perfecto') || reply.includes('Excellent') || reply.includes('Perfect'))) {
                this.currentExercise = null;
            }
        } else if (pideEjercicio) {
            const nivel = this.getUserLevel().toLowerCase();
            const ejercicio = this.generarEjercicio(language, nivel);
            reply = ejercicio.texto;
        } else {
            const typingIndicator = this.showTypingIndicator();
            try {
                reply = await this.sendToGroq(userText, language);
                if (typingIndicator) typingIndicator.remove();
            } catch (error) {
                if (typingIndicator) typingIndicator.remove();
                reply = language === 'Spanish' ? '❌ Error. Intenta de nuevo.' : '❌ Error. Try again.';
            }
        }
        
        if (reply && reply.length > 0) {
            this.addMessage('ai', reply);
            this.speak(reply, language).catch(e => console.log('[ERROR] Voz:', e));
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
            this.messages.push({ role: role === 'ai' ? 'ai' : role, content: content });
        }
        if (this.messages.length > 50) this.messages = this.messages.slice(-50);
        this.saveHistory();
    }

    async speak(text, language) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }
            try {
                window.speechSynthesis.cancel();
                let cleanText = text.replace(/\*\*/g, '').replace(/\n/g, ' ');
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
            const historyToSave = this.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: Date.now()
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
            this.addMessage('system', '❌ No te entendí. Intenta de nuevo.');
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
