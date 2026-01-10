// Chat Modal Functionality
class ChatModal {
    constructor() {
        this.currentChatId = null;
        this.currentReportId = null;
        this.currentReportTitle = null;
        this.messages = [];
        this.messagesListener = null;
        this.typingListener = null;
        this.typingTimeout = null;
        this.currentUser = null;
        
        this.initModal();
    }
    
    initModal() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('chatModal')) {
            this.createModalHTML();
        }
        
        this.setupEventListeners();
    }
    
    createModalHTML() {
        const modalHTML = `
            <div id="chatModal" class="chat-modal">
                <div class="chat-modal-content">
                    <div class="chat-header">
                        <div>
                            <h3 id="chatTitle">Chat</h3>
                            <div class="chat-header-info" id="chatHeaderInfo"></div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="chat-actions">
                                <button class="chat-action-btn chat-info-btn" id="chatInfoBtn" title="Chat Info">
                                    <i class="bi bi-info-circle"></i>
                                </button>
                                <button class="chat-action-btn clear-chat-btn" id="clearChatBtn" title="Clear Chat">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <span class="close-chat" id="closeChatBtn">&times;</span>
                        </div>
                    </div>
                    
                    <div class="chat-messages-container" id="chatMessagesContainer">
                        <div class="empty-chat" id="emptyChatMessage">
                            <i class="bi bi-chat-dots"></i>
                            <p>No messages yet.<br>Start the conversation!</p>
                        </div>
                    </div>
                    
                    <div class="typing-indicator" id="typingIndicator">
                        <span id="typingText">Someone is typing</span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                    
                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <button class="chat-attach-btn" id="chatAttachBtn" title="Attach Image">
                                <i class="bi bi-paperclip"></i>
                            </button>
                            <textarea class="chat-input" id="chatInput" placeholder="Type a message..." rows="1"></textarea>
                            <button class="chat-send-btn" id="chatSendBtn" title="Send Message">
                                <i class="bi bi-send-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="image-preview-modal" id="imagePreviewModal">
                <span class="image-preview-close" id="imagePreviewClose">&times;</span>
                <img class="image-preview-content" id="imagePreviewContent" src="">
            </div>
            
            <input type="file" id="chatImageInput" accept="image/*" style="display: none;">
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    setupEventListeners() {
        const closeChatBtn = document.getElementById('closeChatBtn');
        const chatSendBtn = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');
        const chatAttachBtn = document.getElementById('chatAttachBtn');
        const chatImageInput = document.getElementById('chatImageInput');
        const clearChatBtn = document.getElementById('clearChatBtn');
        const chatInfoBtn = document.getElementById('chatInfoBtn');
        const imagePreviewClose = document.getElementById('imagePreviewClose');
        
        if (closeChatBtn) {
            closeChatBtn.onclick = () => this.close();
        }
        
        if (chatSendBtn) {
            chatSendBtn.onclick = () => this.sendMessage();
        }
        
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            chatInput.addEventListener('input', () => {
                this.handleTyping();
                this.autoResizeTextarea();
            });
        }
        
        if (chatAttachBtn) {
            chatAttachBtn.onclick = () => {
                chatImageInput.click();
            };
        }
        
        if (chatImageInput) {
            chatImageInput.onchange = (e) => this.handleImageSelect(e);
        }
        
        if (clearChatBtn) {
            clearChatBtn.onclick = () => this.showClearChatConfirm();
        }
        
        if (chatInfoBtn) {
            chatInfoBtn.onclick = () => this.showChatInfo();
        }
        
        if (imagePreviewClose) {
            imagePreviewClose.onclick = () => this.closeImagePreview();
        }
    }
    
    async open(reportId, reportTitle) {
        this.currentReportId = reportId;
        this.currentReportTitle = reportTitle;
        this.currentChatId = `report_${reportId}`;
        
        // Get current user
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please login to use chat');
            return;
        }
        
        // Get user data
        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val();
        
        this.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: userData?.displayName || user.email,
            role: userData?.role || 'USER'
        };
        
        // Update chat header
        document.getElementById('chatTitle').textContent = `Chat: ${reportTitle}`;
        document.getElementById('chatHeaderInfo').textContent = `Report #${reportId.substring(reportId.length - 6)}`;
        
        // Show modal
        document.getElementById('chatModal').style.display = 'block';
        
        // Check if chat exists, if not create it
        await this.ensureChatExists();
        
        // Load messages
        this.loadMessages();
        
        // Setup typing listener
        this.setupTypingListener();
        
        // Focus input
        document.getElementById('chatInput').focus();
    }
    
    async ensureChatExists() {
        const chatRef = firebase.database().ref(`chats/${this.currentChatId}`);
        const snapshot = await chatRef.once('value');
        
        if (!snapshot.exists()) {
            // Create chat
            await chatRef.set({
                metadata: {
                    reportId: this.currentReportId,
                    reportTitle: this.currentReportTitle,
                    createdAt: Date.now(),
                    participants: {
                        [this.currentUser.uid]: true
                    }
                }
            });
        }
    }
    
    loadMessages() {
        const messagesRef = firebase.database().ref(`chats/${this.currentChatId}/messages`);
        
        // Remove existing listener
        if (this.messagesListener) {
            messagesRef.off('child_added', this.messagesListener);
        }
        
        // Clear messages
        this.messages = [];
        this.renderMessages();
        
        // Listen for new messages
        this.messagesListener = messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            message.messageId = snapshot.key;
            this.messages.push(message);
            this.renderMessages();
            this.scrollToBottom();
            
            // Mark as read if not from current user
            if (message.senderId !== this.currentUser.uid) {
                this.markMessageAsRead(message.messageId);
            }
        });
    }
    
    renderMessages() {
        const container = document.getElementById('chatMessagesContainer');
        const emptyMessage = document.getElementById('emptyChatMessage');
        
        if (this.messages.length === 0) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        
        // Group messages by date
        const messagesByDate = {};
        this.messages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            if (!messagesByDate[date]) {
                messagesByDate[date] = [];
            }
            messagesByDate[date].push(msg);
        });
        
        let html = '';
        Object.keys(messagesByDate).forEach(date => {
            // Add date divider
            html += `<div class="date-divider"><span>${this.formatDate(new Date(date))}</span></div>`;
            
            // Add messages for this date
            messagesByDate[date].forEach(msg => {
                html += this.renderMessage(msg);
            });
        });
        
        container.innerHTML = html + container.querySelector('.empty-chat').outerHTML;
        
        // Add click listeners to images
        container.querySelectorAll('.message-image').forEach(img => {
            img.onclick = () => this.showImagePreview(img.src);
        });
    }
    
    renderMessage(message) {
        const isSent = message.senderId === this.currentUser.uid;
        const isSystem = message.messageType === 'system';
        
        if (isSystem) {
            return `
                <div class="chat-message">
                    <div class="message-bubble system-message">
                        <div class="message-text">${this.escapeHtml(message.message)}</div>
                        <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    </div>
                </div>
            `;
        }
        
        const messageClass = isSent ? 'sent' : 'received';
        const senderName = message.senderName || message.senderId;
        const role = message.senderRole ? `(${message.senderRole})` : '';
        
        let content = '';
        if (message.messageType === 'image') {
            content = `<img src="data:image/jpeg;base64,${message.message}" class="message-image" alt="Image">`;
        } else {
            content = `<div class="message-text">${this.escapeHtml(message.message)}</div>`;
        }
        
        const readStatus = this.getReadStatus(message);
        
        return `
            <div class="chat-message ${messageClass}">
                <div class="message-bubble">
                    ${!isSent ? `<div class="message-sender">${senderName} ${role}</div>` : ''}
                    ${content}
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                    ${isSent ? `<div class="message-status">${readStatus}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        input.style.height = 'auto';
        this.updateTypingStatus(false);
        
        const messageData = {
            senderId: this.currentUser.uid,
            senderName: this.currentUser.displayName,
            senderRole: this.currentUser.role,
            message: message,
            timestamp: Date.now(),
            messageType: 'text',
            reportId: this.currentReportId,
            readBy: {}
        };
        
        try {
            await firebase.database().ref(`chats/${this.currentChatId}/messages`).push(messageData);
            
            // Update chat metadata
            await this.updateChatMetadata(messageData);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
            input.value = message; // Restore message
        }
    }
    
    async handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            alert('Image too large. Please select an image under 1MB');
            return;
        }
        
        // Show loading
        const sendBtn = document.getElementById('chatSendBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        
        try {
            // Read and compress image
            const base64 = await this.compressImage(file);
            
            // Send image message
            const messageData = {
                senderId: this.currentUser.uid,
                senderName: this.currentUser.displayName,
                senderRole: this.currentUser.role,
                message: base64,
                timestamp: Date.now(),
                messageType: 'image',
                reportId: this.currentReportId,
                readBy: {}
            };
            
            await firebase.database().ref(`chats/${this.currentChatId}/messages`).push(messageData);
            
            // Update metadata with indicator
            const metadataMessage = { ...messageData, message: '📷 Image' };
            await this.updateChatMetadata(metadataMessage);
            
        } catch (error) {
            console.error('Error sending image:', error);
            alert('Failed to send image: ' + error.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
            e.target.value = ''; // Reset input
        }
    }
    
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    async updateChatMetadata(lastMessage) {
        const metadata = {
            lastMessage: lastMessage.message.substring(0, 100),
            lastMessageTime: lastMessage.timestamp,
            lastMessageSender: lastMessage.senderName,
            participants: {
                [this.currentUser.uid]: true
            },
            reportId: this.currentReportId
        };
        
        await firebase.database().ref(`chats/${this.currentChatId}/metadata`).update(metadata);
    }
    
    handleTyping() {
        this.updateTypingStatus(true);
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.updateTypingStatus(false);
        }, 3000);
    }
    
    updateTypingStatus(isTyping) {
        firebase.database().ref(`chats/${this.currentChatId}/typing/${this.currentUser.uid}`)
            .set(isTyping);
    }
    
    setupTypingListener() {
        if (this.typingListener) {
            firebase.database().ref(`chats/${this.currentChatId}/typing`).off('value', this.typingListener);
        }
        
        this.typingListener = firebase.database().ref(`chats/${this.currentChatId}/typing`)
            .on('value', (snapshot) => {
                let someoneTyping = false;
                let typingUserName = '';
                
                if (snapshot.exists()) {
                    snapshot.forEach((child) => {
                        if (child.key !== this.currentUser.uid && child.val() === true) {
                            someoneTyping = true;
                            typingUserName = child.key;
                        }
                    });
                }
                
                const indicator = document.getElementById('typingIndicator');
                const typingText = document.getElementById('typingText');
                
                if (someoneTyping) {
                    typingText.textContent = 'Someone is typing';
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
    }
    
    async markMessageAsRead(messageId) {
        await firebase.database().ref(`chats/${this.currentChatId}/messages/${messageId}/readBy/${this.currentUser.uid}`)
            .set(Date.now());
    }
    
    getReadStatus(message) {
        if (!message.readBy || Object.keys(message.readBy).length === 0) {
            return 'Sent';
        }
        return 'Seen';
    }
    
    showClearChatConfirm() {
        if (confirm('Are you sure you want to clear this chat?\n\nAll messages will be permanently deleted.')) {
            this.clearChat();
        }
    }
    
    async clearChat() {
        try {
            await firebase.database().ref(`chats/${this.currentChatId}/messages`).remove();
            
            // Update metadata
            await firebase.database().ref(`chats/${this.currentChatId}/metadata`).update({
                lastMessage: 'Chat cleared',
                lastMessageTime: Date.now(),
                lastMessageSender: 'System'
            });
            
            this.messages = [];
            this.renderMessages();
            alert('Chat cleared successfully');
        } catch (error) {
            console.error('Error clearing chat:', error);
            alert('Failed to clear chat: ' + error.message);
        }
    }
    
    showChatInfo() {
        const info = `
Chat ID: ${this.currentChatId}
Report: ${this.currentReportTitle}
Report ID: #${this.currentReportId.substring(this.currentReportId.length - 6)}
Total Messages: ${this.messages.length}
        `.trim();
        
        alert(info);
    }
    
    showImagePreview(src) {
        const modal = document.getElementById('imagePreviewModal');
        const img = document.getElementById('imagePreviewContent');
        img.src = src;
        modal.classList.add('active');
    }
    
    closeImagePreview() {
        const modal = document.getElementById('imagePreviewModal');
        modal.classList.remove('active');
    }
    
    autoResizeTextarea() {
        const textarea = document.getElementById('chatInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
    
    scrollToBottom() {
        const container = document.getElementById('chatMessagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
    
    close() {
        // Remove listeners
        if (this.messagesListener) {
            firebase.database().ref(`chats/${this.currentChatId}/messages`).off('child_added', this.messagesListener);
            this.messagesListener = null;
        }
        
        if (this.typingListener) {
            firebase.database().ref(`chats/${this.currentChatId}/typing`).off('value', this.typingListener);
            this.typingListener = null;
        }
        
        // Clear typing status
        this.updateTypingStatus(false);
        
        // Hide modal
        document.getElementById('chatModal').style.display = 'none';
        
        // Clear data
        this.currentChatId = null;
        this.currentReportId = null;
        this.currentReportTitle = null;
        this.messages = [];
    }
    
    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
}

// Initialize chat modal globally
window.chatModal = new ChatModal();

// Helper function to open chat
function openReportChat(reportId, reportTitle) {
    window.chatModal.open(reportId, reportTitle);
}