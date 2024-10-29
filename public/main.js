const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');

const messageTone = new Audio('/message-tone.mp3');

let selectedFile = null;

// Handle file selection
fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    showFilePreview(selectedFile);
});

// Show file preview
function showFilePreview(file) {
    previewContainer.innerHTML = ''; // Clear previous preview
    const reader = new FileReader();
    reader.onload = function (e) {
        let fileHTML = '';
        if (file.type.startsWith('image/')) {
            fileHTML = `<img src="${e.target.result}" alt="Image Preview" style="max-width: 100%; height: auto; border-radius: 12px;">`;
        } else if (file.type.startsWith('video/')) {
            fileHTML = `<video controls style="max-width: 100%; height: auto; border-radius: 12px;">
                            <source src="${e.target.result}" type="${file.type}">
                            Your browser does not support the video tag.
                        </video>`;
        }
        previewContainer.innerHTML = fileHTML; // Display the preview
    };
    reader.readAsDataURL(file);
}

// Submit message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Update clients count
socket.on('clients-total', (data) => {
    clientsTotal.innerText = `Total Clients: ${data}`;
});

function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '' && !selectedFile) return;

    const messageData = {
        name: nameInput.value,
        message: messageText,
        dateTime: new Date(),
    };

    // Emit message to server
    socket.emit('message', messageData);

    // Add the message to UI (the sender sees "You")
    addMessageToUI(true, messageData);

    // Clear input field
    messageInput.value = '';
    
    // If a file was selected, send it
    if (selectedFile) {
        sendFile(selectedFile);
        fileInput.value = ''; // Clear the file input
        selectedFile = null;  // Reset selected file
        previewContainer.innerHTML = ''; // Clear preview
    }
}

// Receive chat message from others
socket.on('chat-message', (data) => {
    messageTone.play();
    addMessageToUI(false, data); // Display the sender's name for other users
});

function addMessageToUI(isOwnMessage, data) {
    clearFeedback();
    
    // If it's the user's own message, show "You" instead of their name
    const sender = isOwnMessage ? "You" : data.name;
    
    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
                ${data.message}
                <span>${sender} ● ${moment(data.dateTime).fromNow()}</span>
            </p>
        </li>
    `;
    messageContainer.innerHTML += element;
    scrollToBottom();
}

function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Typing feedback
messageInput.addEventListener('focus', () => {
    socket.emit('feedback', {
        feedback: `✍️ ${nameInput.value} is typing a message`,
    });
});

messageInput.addEventListener('keypress', () => {
    socket.emit('feedback', {
        feedback: `✍️ ${nameInput.value} is typing a message`,
    });
});

messageInput.addEventListener('blur', () => {
    socket.emit('feedback', {
        feedback: '',
    });
});

socket.on('feedback', (data) => {
    clearFeedback();
    const element = `
        <li class="message-feedback">
            <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
    `;
    messageContainer.innerHTML += element;
});

function clearFeedback() {
    document.querySelectorAll('li.message-feedback').forEach((element) => {
        element.parentNode.removeChild(element);
    });
}

// File upload handling
function sendFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const fileData = {
            name: nameInput.value,
            file: e.target.result, // Base64 encoded string
            fileName: file.name,
            fileType: file.type,
            dateTime: new Date(),
        };
        
        // Emit file message to the server
        socket.emit('file-message', fileData);

        // Add file to UI
        addFileToUI(true, fileData);
    };
    reader.readAsDataURL(file);
}

socket.on('file-message', (data) => {
    addFileToUI(false, data);
});

function addFileToUI(isOwnMessage, data) {
    let fileHTML = '';
    
    if (data.fileType.startsWith('image')) {
        fileHTML = `<img src="${data.file}" alt="Image" width="200">`;
    } else if (data.fileType.startsWith('video')) {
        fileHTML = `
            <video controls width="200">
                <source src="${data.file}" type="${data.fileType}">
                Your browser does not support the video tag.
            </video>`;
    }

    const sender = isOwnMessage ? "You" : data.name;
    
    const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
                ${fileHTML}
                <span>${sender} ● ${moment(data.dateTime).fromNow()}</span>
            </p>
        </li>
    `;
    messageContainer.innerHTML += element;
    scrollToBottom();
}

