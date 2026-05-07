class LinguaAIChat {
    constructor() {
        this.apiKey = localStorage.getItem('openai_key');
        if (!this.apiKey && !window.auth.getCurrentUser()?.isPro) {
            this.apiKey = prompt('🔑 API Key de OpenAI (opcional para demo)');
            if (this.apiKey) localStorage.setItem('openai_key', this.apiKey);
        }
        this.messages = [];
        this.loadHistory();
        this.initEventListeners();
        this.setupVoice();
    }

    setupVoice() {
        // Voz femenina preferida
        this.voice = null;
        window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices();
            this.voice = voices.find(v => v.lang.includes('es') && v.name.includes('Google') && v.gender === 'female') ||
                        voices.find(v => v.name.includes('Samantha') || v.name.includes('Mónica'));
        };
    }

    async sendMessage(userText, language) {
        if (!window.auth.canSendMessage()) {
            this.addMessage('system', '⚠️ Límite diario de demo alcanzado (10 mensajes). Actualiza a Pro para mensajes ilimitados.');
            document.getElementById('menuUpgrade')?.click();
            return;
        }

        this.addMessage('user', userText);
        
        // Simular respuesta si no hay API key
        if (!this.apiKey) {
            const demoResponses = {
                Spanish: "¡Excelente práctica! Hoy aprenderemos vocabulario básico. ¿Qué tema te interesa?",
                English: "Great job! Let's practice with some common phrases. How are you today?",
                French: "Très bien! Continuons avec la prononciation. Répétez après moi."
            };
            setTimeout(() => {
                this.addMessage('ai', demoResponses[language] || demoResponses.Spanish);
                this.speak(demoResponses[language] || demoResponses.Spanish, language);
                window.auth.incrementMessageCount();
                this.saveHistory();
            }, 500);
            return;
        }

        // IA real con OpenAI
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: `Eres una tutora de idiomas con voz de mujer, amable y paciente. Hablas ${language}. Corrige errores suavemente. Da ejemplos.` },
                        ...this.messages.slice(-10),
                        { role: 'user', content: userText }
                    ],
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            const reply = data.choices[0].message.content;
            this.addMessage('ai', reply);
            this.speak(reply, language);
            window.auth.incrementMessageCount();
            this.saveHistory();
        } catch (error) {
            this.addMessage('system', 'Error de conexión. Modo offline activado.');
        }
    }

    speak(text, language) {
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = { Spanish: 'es-ES', English: 'en-US', French: 'fr-FR', German: 'de-DE', Italian: 'it-IT', Japanese: 'ja-JP' };
        utterance.lang = langMap[language] || 'es-ES';
        
        if (this.voice) utterance.voice = this.voice;
        
        // Forzar voz femenina en Chrome/Edge
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    addMessage(role, content) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `<strong>${role === 'user' ? 'Tú' : role === 'ai' ? '🤖 LinguaAI' : 'ℹ️'}</strong><br>${content}`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        this.messages.push({ role, content });
    }

    saveHistory() {
        const user = window.auth.getCurrentUser();
        if (user) {
            localStorage.setItem(`chat_history_${user.license}`, JSON.stringify(this.messages));
        }
    }

    loadHistory() {
        const user = window.auth.getCurrentUser();
        if (user) {
            const history = localStorage.getItem(`chat_history_${user.license}`);
            if (history) {
                this.messages = JSON.parse(history);
                this.messages.forEach(msg => {
                    if (msg.role !== 'system') this.addMessage(msg.role, msg.content);
                });
            }
        }
    }

    initEventListeners() {
        document.getElementById('sendBtn').onclick = () => this.handleSend();
        document.getElementById('userInput').onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        };
        
        document.getElementById('voiceBtn').onclick = () => {
            const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            recognition.lang = 'es-ES';
            recognition.onresult = (e) => {
                document.getElementById('userInput').value = e.results[0][0].transcript;
                this.handleSend();
            };
            recognition.start();
            document.getElementById('voiceStatus').innerText = '🎙️ Escuchando...';
            setTimeout(() => document.getElementById('voiceStatus').innerText = '', 3000);
        };
        
        document.getElementById('speakerBtn').onclick = () => {
            const lastMsg = this.messages.filter(m => m.role === 'ai').pop();
            if (lastMsg) this.speak(lastMsg.content, document.getElementById('languageSelect').value);
        };
    }

    handleSend() {
        const input = document.getElementById('userInput');
        const text = input.value.trim();
        if (!text) return;
        const language = document.getElementById('languageSelect').value;
        this.sendMessage(text, language);
        input.value = '';
    }
}

window.chat = new LinguaAIChat();
