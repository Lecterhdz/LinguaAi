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

    // ========== TUTORA IA EVOLUCIONADA ==========
    async sendToGroq(userText, language) {
        if (!this.GROQ_API_KEY) {
            return this.getOfflineResponse(userText, language);
        }
    
        // Sistema de personalización según el nivel del usuario
        const userLevel = this.getUserLevel();
        const userInterests = this.getUserInterests();
        
        // Forzar idioma estrictamente
        const idiomaInstruccion = language === 'Spanish' 
            ? 'IMPORTANTE: Debes responder ESTRICTAMENTE en ESPAÑOL. NO uses inglés en tu respuesta. Tu respuesta completa debe estar en español.' 
            : 'IMPORTANT: You MUST respond STRICTLY in ENGLISH. DO NOT use Spanish in your response. Your entire response must be English.';
    
        const systemPrompt = `Eres LinguaAI, una tutora profesional de idiomas con voz femenina.
    
    [MODO]: Experta, paciente, motivadora y conversacional
    [IDIOMA]: ${language} (OBLIGATORIO - NO CAMBIAR)
    [NIVEL_USUARIO]: ${userLevel}
    [INTERESES]: ${userInterests}
    
    ========================================
    INSTRUCCIONES ESTRICTAS (NO LAS ROMPAS):
    ========================================
    
    1. CORRECCION DE ERRORES:
       - Analiza la gramática, ortografía y pronunciación
       - Muestra: ❌ "frase_incorrecta" → ✅ "frase_correcta"
       - Explica la regla gramatical de forma clara y concisa
       - Si el error es grave, da una explicación más detallada
    
    2. EJEMPLOS (OBLIGATORIO):
       - Siempre proporciona 2-3 ejemplos variados
       - Los ejemplos deben ser relevantes al contexto
       - Incluye ejemplos de la vida real
       - Marca los ejemplos con 📖
    
    3. CONVERSACION FLUIDA:
       - Mantén un tono natural como si hablaras con un amigo
       - Haz preguntas de seguimiento para fomentar la práctica
       - No respondas con monosílabos (sí/no) sin explicación
       - Muestra entusiasmo por el progreso del estudiante
       - Recupera información de mensajes anteriores para contexto
    
    4. ESTRUCTURA DE RESPUESTA (FORMATO OBLIGATORIO):
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📝 CORRECCION:
       "${texto_original}" → "${texto_correcto}"
       
       💡 EXPLICACION:
       [Regla gramatical explicada claramente]
       
       📖 EJEMPLOS:
       1. [Ejemplo contextual 1]
       2. [Ejemplo contextual 2]
       3. [Ejemplo contextual 3 - opcional]
       
       🎯 AHORA PRACTICA TU:
       [Pregunta interactiva o mini-ejercicio]
       
       💪 ¡Tú puedes! [Motivación breve]
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    5. RESPUESTAS ADAPTATIVAS POR CONTEXTO:
       📝 MENSAJE CORRECTO: ✅ Felicita efusivamente + da 3 ejemplos avanzados
       ❓ PREGUNTA: Responde con claridad + 2 ejemplos + pregunta inversa
       📚 PIDE EJERCICIOS: Genera 2-3 ejercicios progresivos (fácil → difícil)
       🎯 ERROR REPETIDO: Sé paciente, explica de otra forma + ejercicio específico
       💬 CONVERSACION GENERAL: Profundiza el tema + preguntas abiertas
    
    6. EJERCICIOS INTERACTIVOS (respuesta a "ejercicio"/"practice"):
       - Completar espacios: "She ___ (go) to school every day"
       - Traducción: "Translate to ${language}: 'The beautiful sunset'"
       - Corregir error: "What's wrong with: 'He don't like pizza'?"
       - Crear oración: "Make a sentence using 'already' and 'just'"
       - Conversación: "Answer: What would you do if you won the lottery?"
    
    7. DETECCION DE ERRORES COMUNES:
       - Past tense errors: "goed" → "went"
       - Subject-verb agreement: "She go" → "She goes"
       - Prepositions: "depend of" → "depend on"
       - Word order: "I like very much pizza" → "I like pizza very much"
    
    8. PERSONALIDAD Y TONO:
       - Usa emojis moderadamente (📝💡📖🎯✅❌🎉💪🔥)
       - Sé cálida, entusiasta y motivadora
       - Responde en 3-5 oraciones (no demasiado largo)
       - Termina siempre con una pregunta o ejercicio corto
       - Celebra los logros del estudiante
    
    ${idiomaInstruccion}
    
    ¡COMIENZA TU RESPUESTA AHORA!`;
    
        try {
            console.log(`[ENVIO] Enviando a Groq en ${language}:`, userText);
            
            // Filtrar historial correctamente
            const historialParaGroq = this.messages
                .filter(msg => msg.role !== 'system')
                .slice(-12)
                .map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role,
                    content: msg.content
                }));
            
            // Detectar si es una conversación larga para ajustar temperatura
            const temperatura = this.messages.length > 20 ? 0.6 : 0.7;
            
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
                    temperature: temperatura,
                    max_tokens: 650,
                    top_p: 0.9
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
                        ? '⏳ **Demo de espera**\n\nHas alcanzado el límite de solicitudes. Espera 30 segundos antes de enviar otro mensaje.'
                        : '⏳ **Rate limit reached**\n\nYou have reached the request limit. Wait 30 seconds before sending another message.';
                }
                
                return this.getOfflineResponse(userText, language);
            }
    
            const data = await response.json();
            let reply = data.choices[0].message.content;
            
            // Post-procesamiento para asegurar idioma correcto
            reply = this.ensureCorrectLanguage(reply, language);
            
            console.log('[OK] Respuesta recibida y procesada');
            return reply;
    
        } catch (error) {
            console.error('[ERROR] Envio fallido:', error);
            return this.getOfflineResponse(userText, language);
        }
    }
    
    // ========== FUNCIONES ADICIONALES MEJORADAS ==========
    
    // Asegurar que la respuesta esté en el idioma correcto
    ensureCorrectLanguage(text, targetLanguage) {
        const hasSpanish = /[áéíóúñ¿¡]/i.test(text);
        const hasEnglish = /[a-zA-Z]{3,}/.test(text);
        const hasManySpanish = (text.match(/[áéíóúñ]/gi) || []).length > 2;
        
        if (targetLanguage === 'English' && (hasSpanish || hasManySpanish)) {
            console.log('[IDIOMA] Corrigiendo respuesta a inglés...');
            return `[English Response Required]\n\nNote: I must respond in English.\n\nOriginal: ${text.substring(0, 200)}...\n\nPlease try asking again.`;
        }
        
        if (targetLanguage === 'Spanish' && hasEnglish && !hasSpanish) {
            console.log('[IDIOMA] Corrigiendo respuesta a español...');
            return `[Respuesta en Español Requerida]\n\nNota: Debo responder en español.\n\nOriginal: ${text.substring(0, 200)}...\n\nPor favor intenta preguntar de nuevo.`;
        }
        
        return text;
    }
    
    // Obtener nivel del usuario basado en historial
    getUserLevel() {
        // Analizar errores comunes en el historial
        const userMessages = this.messages.filter(m => m.role === 'user').slice(-20);
        let errorCount = 0;
        
        userMessages.forEach(msg => {
            const content = msg.content.toLowerCase();
            if (content.includes('goed') || content.includes('go to school') && !content.includes('went')) errorCount++;
            if (content.includes('don\'t') && content.match(/(he|she|it)\s+don\'t/)) errorCount++;
            if (content.includes('very much') && content.match(/\w+\s+very much/)) errorCount++;
        });
        
        if (errorCount === 0 && userMessages.length > 5) return 'AVANZADO';
        if (errorCount > 5) return 'PRINCIPIANTE';
        return 'INTERMEDIO';
    }
    
    // Obtener intereses del usuario
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
    
    // Generar ejercicios adaptativos
    generarEjercicioAdaptativo(language, userLevel) {
        const ejercicios = {
            English: {
                PRINCIPIANTE: {
                    completar: [
                        { frase: "I ___ (be) a student", respuesta: "am", pista: "Yo soy estudiante" },
                        { frase: "She ___ (like) coffee", respuesta: "likes", pista: "A ella le gusta" },
                        { frase: "They ___ (play) soccer", respuesta: "play", pista: "Ellos juegan" }
                    ],
                    seleccion: [
                        { frase: "___ you hungry?", opciones: ["Is", "Am", "Are"], respuesta: "Are" }
                    ]
                },
                INTERMEDIO: {
                    completar: [
                        { frase: "If I ___ (be) rich, I would travel", respuesta: "were", pista: "Situación hipotética" },
                        { frase: "She ___ (already/finish) her work", respuesta: "has already finished", pista: "Acción completada" }
                    ],
                    traduccion: [
                        { frase: "I have been learning English for 3 years", respuesta: "He estado aprendiendo inglés por 3 años" }
                    ]
                },
                AVANZADO: {
                    completar: [
                        { frase: "Had I known, I ___ (act) differently", respuesta: "would have acted", pista: "Condicional perfecto" },
                        { frase: "She insisted that he ___ (go)", respuesta: "go", pista: "Subjuntivo" }
                    ]
                }
            },
            Spanish: {
                PRINCIPIANTE: {
                    completar: [
                        { frase: "Yo ___ (ser) de México", respuesta: "soy", pista: "Origen" },
                        { frase: "Ella ___ (hablar) español", respuesta: "habla", pista: "Acción habitual" }
                    ]
                },
                INTERMEDIO: {
                    completar: [
                        { frase: "Si ___ (tener) dinero, viajaría", respuesta: "tuviera", pista: "Condicional" }
                    ]
                }
            }
        };
        
        const langEjercicios = ejercicios[language] || ejercicios.English;
        const nivel = userLevel;
        const nivelEjercicios = langEjercicios[nivel] || langEjercicios.INTERMEDIO;
        
        const tipos = Object.keys(nivelEjercicios);
        const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
        const ejerciciosLista = nivelEjercicios[tipoAleatorio];
        const ejercicio = ejerciciosLista[Math.floor(Math.random() * ejerciciosLista.length)];
        
        let textoEjercicio = "";
        let tipo = "";
        
        switch(tipoAleatorio) {
            case 'completar':
                textoEjercicio = language === 'Spanish' 
                    ? `✏️ **Ejercicio de completar (Nivel ${nivel}):**\n\n"${ejercicio.frase}"\n\n💡 Pista: ${ejercicio.pista || 'Piensa en la conjugación correcta'}\n\nEscribe tu respuesta:`
                    : `✏️ **Fill in the blank (${nivel} level):**\n\n"${ejercicio.frase}"\n\n💡 Hint: ${ejercicio.pista || 'Think about the correct conjugation'}\n\nWrite your answer:`;
                tipo = 'completar';
                break;
            case 'traduccion':
                textoEjercicio = language === 'Spanish'
                    ? `🌐 **Traduce al español (Nivel ${nivel}):**\n\n"${ejercicio.frase}"\n\nEscribe tu traducción:`
                    : `🌐 **Translate to English (${nivel} level):**\n\n"${ejercicio.frase}"\n\nWrite your translation:`;
                tipo = 'traduccion';
                break;
            case 'seleccion':
                textoEjercicio = language === 'Spanish'
                    ? `🔘 **Selecciona la opción correcta (Nivel ${nivel}):**\n\n"${ejercicio.frase}"\n\nOpciones: ${ejercicio.opciones.join(', ')}\n\nEscribe la letra o palabra correcta:`
                    : `🔘 **Choose the correct option (${nivel} level):**\n\n"${ejercicio.frase}"\n\nOptions: ${ejercicio.opciones.join(', ')}\n\nWrite the correct letter or word:`;
                tipo = 'seleccion';
                break;
        }
        
        this.currentExercise = {
            texto: textoEjercicio,
            respuesta: ejercicio.respuesta,
            tipo: tipo,
            nivel: nivel,
            original: ejercicio.frase
        };
        
        return this.currentExercise;
    }
    
    // Verificar ejercicio con feedback mejorado
    verificarEjercicio(respuestaUsuario, language) {
        if (!this.currentExercise) {
            return null;
        }
        
        const esCorrecto = respuestaUsuario.toLowerCase().trim() === this.currentExercise.respuesta.toLowerCase();
        const nivel = this.currentExercise.nivel || 'intermedio';
        
        if (esCorrecto) {
            const mensajesExito = language === 'Spanish'
                ? [
                    `✅ **¡Excelente!** "${respuestaUsuario}" es correcto.\n\n🎉 ¡Muy bien para tu nivel ${nivel}!\n\n💪 ¿Quieres otro ejercicio o prefieres seguir conversando?`,
                    `🎯 **¡Perfecto!** Has dominado este tema.\n\n🔥 Sigue así, vas mejorando día a día.\n\n📚 ¿Practicamos otro ejercicio?`,
                    `🌟 **¡Magnífico!** Respuesta correcta.\n\n📖 Recuerda practicar este tipo de ejercicios regularmente.\n\n✨ ¿Continuamos?`
                ]
                : [
                    `✅ **Excellent!** "${respuestaUsuario}" is correct.\n\n🎉 Great job for your ${nivel} level!\n\n💪 Would you like another exercise or continue the conversation?`,
                    `🎯 **Perfect!** You've mastered this topic.\n\n🔥 Keep it up, you're improving every day.\n\n📚 Shall we practice another exercise?`
                ];
            
            const mensaje = mensajesExito[Math.floor(Math.random() * mensajesExito.length)];
            this.currentExercise = null;
            return mensaje;
        } else {
            const mensajesError = language === 'Spanish'
                ? [
                    `❌ **Casi ahi!** "${respuestaUsuario}" no es correcto.\n\n💡 La respuesta correcta es: "${this.currentExercise.respuesta}"\n\n📖 Para este nivel ${nivel}, recuerda: ${this.getHintForExercise(this.currentExercise, language)}\n\n🔄 ¿Intentamos otro ejercicio?`,
                    `📝 **Revisemos:** "${respuestaUsuario}" no es la respuesta esperada.\n\n✅ Respuesta correcta: "${this.currentExercise.respuesta}"\n\n💪 ¡No te rindas! Cada error te acerca al dominio del idioma.\n\n🎯 ¿Quieres otro ejercicio?`
                ]
                : [
                    `❌ **Almost there!** "${respuestaUsuario}" is not correct.\n\n💡 The correct answer is: "${this.currentExercise.respuesta}"\n\n📖 For ${nivel} level, remember: ${this.getHintForExercise(this.currentExercise, language)}\n\n🔄 Shall we try another exercise?`,
                    `📝 **Let's review:** "${respuestaUsuario}" is not the expected answer.\n\n✅ Correct answer: "${this.currentExercise.respuesta}"\n\n💪 Don't give up! Every mistake brings you closer to mastery.\n\n🎯 Want another exercise?`
                ];
            
            return mensajesError[Math.floor(Math.random() * mensajesError.length)];
        }
    }
    
    // Obtener pista según el tipo de ejercicio
    getHintForExercise(exercise, language) {
        const hints = {
            completar: language === 'Spanish' 
                ? 'debes conjugar el verbo según el sujeto y el tiempo verbal'
                : 'you must conjugate the verb according to the subject and tense',
            traduccion: language === 'Spanish'
                ? 'presta atención a la estructura de la oración en español'
                : 'pay attention to the sentence structure in English',
            seleccion: language === 'Spanish'
                ? 'elige la opción que complete correctamente la oración'
                : 'choose the option that correctly completes the sentence'
        };
        return hints[exercise.tipo] || 'practica la estructura de esta oración';
    }
    
    // Mejorar getOfflineResponse con ambos idiomas
    getOfflineResponse(text, language) {
        if (language === 'Spanish') {
            return `⚠️ **Modo demostración**\n\nPara usar la IA completa:\n\n1️⃣ Ve a console.groq.com\n2️⃣ Regístrate (gratis, 1 minuto)\n3️⃣ Crea una API Key\n4️⃣ Ve al menú ☰ → 🔑 Configurar API Key\n\n📝 Tu mensaje: "${text}"\n\n🚀 ¡Es 100% gratis! Una vez configurada, tendrás acceso a la mejor IA tutora.`;
        } else {
            return `⚠️ **Demo Mode**\n\nTo use the full AI tutor:\n\n1️⃣ Go to console.groq.com\n2️⃣ Sign up (free, 1 minute)\n3️⃣ Create an API Key\n4️⃣ Go to menu ☰ → 🔑 Configure API Key\n\n📝 Your message: "${text}"\n\n🚀 It's 100% free! Once configured, you'll have access to the best AI tutor.`;
        }
    }
    async sendMessage(userText, language) {
        if (window.auth && !window.auth.canSendMessage()) {
            this.addMessage('system', language === 'Spanish' ? '⚠️ Límite diario alcanzado (10 mensajes).' : '⚠️ Daily limit reached (10 messages).');
            return;
        }
    
        this.addMessage('user', userText);
        
        const lowerText = userText.toLowerCase();
        
        // Detectar ejercicios en ambos idiomas
        const pideEjercicio = (language === 'Spanish' && (lowerText.includes('ejercicio') || lowerText.includes('practicar') || lowerText.includes('actividad'))) ||
                              (language === 'English' && (lowerText.includes('exercise') || lowerText.includes('practice') || lowerText.includes('activity')));
        
        const estaRespondiendoEjercicio = this.currentExercise && lowerText.length < 60;
        
        let reply;
        
        if (estaRespondiendoEjercicio && this.currentExercise) {
            reply = this.verificarEjercicio(userText, language);
            if (reply && !reply.includes('Casi') && !reply.includes('Almost')) {
                this.currentExercise = null;
            }
        } else if (pideEjercicio) {
            const nivel = this.getUserLevel().toLowerCase();
            const ejercicio = this.generarEjercicioAdaptativo(language, nivel);
            reply = ejercicio.texto;
        } else {
            const typingIndicator = this.showTypingIndicator();
            try {
                reply = await this.sendToGroq(userText, language);
                if (typingIndicator) typingIndicator.remove();
            } catch (error) {
                if (typingIndicator) typingIndicator.remove();
                reply = language === 'Spanish' ? '❌ Error al procesar. Intenta de nuevo.' : '❌ Error processing. Try again.';
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
