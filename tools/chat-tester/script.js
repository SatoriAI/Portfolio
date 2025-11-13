class VexChatTester {
    constructor() {
        this.baseUrl = 'http://localhost:8000/';
        this.csrfToken = null;
        this.sessionId = null;
        this.currentEventSource = null;
        this.isListening = false;
        this.loadedMessageIds = new Set();

        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.testConnection();
    }

    initializeElements() {
        // Main elements
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatForm = document.getElementById('chat-form');

        // Header elements
        this.connectionStatus = document.getElementById('connection-status');
        this.baseUrlDisplay = document.getElementById('base-url');
        this.clearChatBtn = document.getElementById('clear-chat');

        // Settings elements
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsToggle = document.getElementById('settings-toggle');
        this.apiBaseUrlInput = document.getElementById('api-base-url');
        this.csrfTokenInput = document.getElementById('csrf-token');
        this.sessionIdInput = document.getElementById('session-id');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.closeSettingsBtn = document.getElementById('close-settings');

        // Error toast
        this.errorToast = document.getElementById('error-toast');
        this.errorMessage = document.getElementById('error-message');
        this.closeErrorBtn = document.getElementById('close-error');
    }

    bindEvents() {
        // Chat form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));

        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearChat());

        // Settings
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        if (this.closeSettingsBtn) {
            this.closeSettingsBtn.addEventListener('click', () => this.hideSettings());
        }

        // Error toast
        this.closeErrorBtn.addEventListener('click', () => this.hideError());

        // Auto-hide error after 5 seconds
        setTimeout(() => this.hideError(), 5000);

        // Enter to send (with Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit(e);
            }
        });

        // Auto-resize input
        this.messageInput.addEventListener('input', () => this.autoResize());
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
    }

    loadSettings() {
        const savedBaseUrl = localStorage.getItem('vex_chat_base_url');
        if (savedBaseUrl) {
            this.baseUrl = savedBaseUrl;
            this.apiBaseUrlInput.value = savedBaseUrl;
        }

        const savedCsrfToken = localStorage.getItem('vex_chat_csrf_token');
        if (savedCsrfToken) {
            this.csrfToken = savedCsrfToken;
            this.csrfTokenInput.value = savedCsrfToken;
        }

        const savedSessionId = localStorage.getItem('vex_chat_session_key');
        if (savedSessionId) {
            this.sessionId = savedSessionId;
            this.sessionIdInput.value = savedSessionId;
        }

        this.updateDisplay();
        // If we already have a session, fetch its history once
        this.loadHistoryIfAvailable();
    }

    saveSettings() {
        this.baseUrl = this.apiBaseUrlInput.value.trim();
        this.csrfToken = this.csrfTokenInput.value.trim();
        const manualSession = (this.sessionIdInput.value || '').trim();
        if (manualSession) {
            this.sessionId = manualSession;
        }

        localStorage.setItem('vex_chat_base_url', this.baseUrl);
        if (this.csrfToken) {
            localStorage.setItem('vex_chat_csrf_token', this.csrfToken);
        }
        if (this.sessionId) {
            localStorage.setItem('vex_chat_session_key', this.sessionId);
        }

        this.updateDisplay();
        this.testConnection();
        this.hideSettings();
        this.showSuccess('Settings saved successfully!');
        this.loadHistoryIfAvailable();
    }

    updateDisplay() {
        if (this.baseUrlDisplay) {
            this.baseUrlDisplay.textContent = this.baseUrl;
        }
        this.sessionIdInput.value = this.sessionId || '';
    }

    async testConnection() {
        try {
            this.updateConnectionStatus('connecting');

            const response = await fetch(`${this.baseUrl}healthcheck/`, {
                method: 'HEAD',
                mode: 'no-cors'
            });

            // Since we're using no-cors, we can't check the actual response
            // But if it doesn't throw, the server is likely reachable
            this.updateConnectionStatus('connected');

        } catch (error) {
            console.error('Connection test failed:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    updateConnectionStatus(status) {
        this.connectionStatus.className = `status-indicator ${status}`;

        const statusText = {
            'connected': 'Connected',
            'disconnected': 'Disconnected',
            'connecting': 'Connecting...'
        };

        const icon = {
            'connected': 'fas fa-circle',
            'disconnected': 'fas fa-circle',
            'connecting': 'fas fa-spinner fa-spin'
        };

        this.connectionStatus.innerHTML = `
            <i class="${icon[status]}"></i> ${statusText[status]}
        `;
    }


    toggleSettings() {
        this.settingsPanel.classList.toggle('open');
    }

    hideSettings() {
        this.settingsPanel.classList.remove('open');
    }

    clearChat() {
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        this.chatMessages.innerHTML = '';
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }

        // Clear session
        this.sessionId = null;
        this.sessionIdInput.value = '';
        localStorage.removeItem('vex_chat_session_key');
        this.loadedMessageIds.clear();

        // Clear current streaming state
        if (this.currentEventSource) {
            this.currentEventSource.close();
            this.currentEventSource = null;
            this.isListening = false;
        }

        this.showSuccess('Chat cleared and session reset');
    }

    async handleSubmit(e) {
        e.preventDefault();

        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResize();

        this.setLoading(true);

        try {
            // Send POST to /vex/chat/ to submit message
            await this.sendPostMessage(message);

            // Then listen for streaming response on /vex/chat/stream/
            await this.listenForSSEResponse(message);
        } catch (error) {
            this.showError(`Failed to send message: ${error.message}`);
            console.error('Send message error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    async sendPostMessage(message) {
        const formData = new FormData();
        formData.append('question', message);
        if (this.sessionId) {
            formData.append('session_key', this.sessionId);
        }

        const headers = {};
        if (this.csrfToken) {
            headers['X-CSRFToken'] = this.csrfToken;
        }

        const response = await fetch(`${this.baseUrl}api/vex/chat/`, {
            method: 'POST',
            headers: headers,
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Update session info
        if (data.session_key) {
            this.sessionId = data.session_key;
            this.sessionIdInput.value = data.session_key;
            localStorage.setItem('vex_chat_session_key', data.session_key);
            // If a brand new session was created on server, try loading any existing history
            this.loadHistoryIfAvailable();
        }

        if (data.csrftoken) {
            this.csrfToken = data.csrftoken;
            this.csrfTokenInput.value = data.csrftoken;
            localStorage.setItem('vex_chat_csrf_token', data.csrftoken);
        }

        console.log('POST message sent successfully, session:', data.session_key);
        return data;
    }

    async loadHistoryIfAvailable() {
        if (!this.sessionId || this.loadedMessageIds.size > 0) {
            return;
        }
        try {
            const url = new URL(`${this.baseUrl}api/vex/messages/`);
            url.searchParams.append('session', this.sessionId);
            // Ensure ascending order
            url.searchParams.append('ordering', 'created_at');

            const resp = await fetch(url.toString(), { credentials: 'include' });
            if (!resp.ok) {
                return; // Silently ignore
            }
            const data = await resp.json();
            if (!Array.isArray(data)) return;

            for (const m of data) {
                if (!m || this.loadedMessageIds.has(m.id)) continue;
                const role = m.role === 'assistant' ? 'assistant' : 'user';
                this.addMessage(role, m.content || '');
                this.loadedMessageIds.add(m.id);
            }
        } catch (e) {
            // Ignore history load errors in the tester UI
        }
    }

    async listenForSSEResponse(message) {
        // Close existing connection if any
        if (this.currentEventSource) {
            this.currentEventSource.close();
            this.currentEventSource = null;
            this.isListening = false;
        }

        // Create URL with question parameter
        const url = new URL(`${this.baseUrl}api/vex/chat/stream/`);
        url.searchParams.append('question', message);
        if (this.sessionId) {
            url.searchParams.append('session_key', this.sessionId);
        }

        // Prepare for streaming response
        const messageElement = this.addMessage('assistant', '', true);
        const contentElement = messageElement.querySelector('.streaming-content');
        this.addTypingIndicator(contentElement);

        return new Promise((resolve, reject) => {
            this.currentEventSource = new EventSource(url.toString());
            let streamedContent = '';
            let hasStarted = false;

            this.currentEventSource.onopen = () => {
                console.log('SSE connection opened for message');
                this.updateConnectionStatus('connected');
                this.isListening = true;
            };

            this.currentEventSource.onmessage = (event) => {
                if (!hasStarted) {
                    this.removeTypingIndicator(contentElement);
                    hasStarted = true;
                }

                const chunk = event.data;
                if (chunk && chunk.trim()) {
                    streamedContent += chunk;
                    contentElement.innerHTML = this.formatMessage(streamedContent) + '<span class="streaming-cursor"></span>';
                    this.scrollToBottom();
                }
            };

            this.currentEventSource.addEventListener('received', () => {
                console.log('Message received by server');
            });

            this.currentEventSource.addEventListener('finished', () => {
                this.currentEventSource.close();
                this.currentEventSource = null;
                this.isListening = false;

                // Remove cursor and finalize content
                contentElement.innerHTML = this.formatMessage(streamedContent);

                // Add timestamp
                const timestamp = document.createElement('div');
                timestamp.className = 'message-time';
                timestamp.textContent = new Date().toLocaleTimeString();
                contentElement.appendChild(timestamp);

                resolve();
            });

            this.currentEventSource.addEventListener('error', (event) => {
                this.currentEventSource.close();
                this.currentEventSource = null;
                this.isListening = false;

                if (event.data) {
                    reject(new Error(event.data));
                } else {
                    reject(new Error('Stream connection failed'));
                }
            });

            this.currentEventSource.onerror = (error) => {
                this.currentEventSource.close();
                this.currentEventSource = null;
                this.isListening = false;

                if (!hasStarted) {
                    this.removeTypingIndicator(contentElement);
                    contentElement.innerHTML = '<em>Failed to connect to stream</em>';
                }

                reject(new Error('EventSource connection failed'));
            };
        });
    }


    addMessage(role, content, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        avatar.innerHTML = role === 'user' ? 'U' : 'A';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isStreaming) {
            messageContent.innerHTML = '<div class="streaming-content"></div>';
        } else {
            messageContent.innerHTML = this.formatMessage(content);
        }

        const timestamp = document.createElement('div');
        timestamp.className = 'message-time';
        timestamp.textContent = new Date().toLocaleTimeString();

        messageContent.appendChild(timestamp);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    addTypingIndicator(container) {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(indicator);
    }

    removeTypingIndicator(container) {
        const indicator = container.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    formatMessage(content) {
        if (!content) return '';

        // Convert markdown-style formatting
        content = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>')
            .replace(/\n/g, '<br>');

        return content;
    }

    setLoading(loading) {
        this.sendButton.disabled = loading;
        this.messageInput.disabled = loading;

        if (loading) {
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorToast.classList.remove('show');
    }

    showSuccess(message) {
        // Create temporary success toast
        const successToast = document.createElement('div');
        successToast.className = 'error-toast show';
        successToast.style.background = '#2ecc71';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

        document.body.appendChild(successToast);

        const closeBtn = successToast.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            successToast.remove();
        });

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successToast.parentNode) {
                successToast.remove();
            }
        }, 3000);
    }
}

// Initialize the chat tester when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VexChatTester();
});

// Handle page visibility changes to manage EventSource connections
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.chatTester && window.chatTester.currentEventSource) {
        window.chatTester.currentEventSource.close();
        window.chatTester.currentEventSource = null;
    }
});

// Make chat tester globally available for debugging
window.VexChatTester = VexChatTester;
