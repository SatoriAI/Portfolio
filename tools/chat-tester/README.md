# Vex Chat Tester

A comprehensive testing interface for the Vex chat API endpoints. This tool allows you to test both regular and streaming chat modes with a beautiful, modern UI.

## Features

### 🚀 Dual Mode Support
- **Regular Mode**: Standard POST requests to `/vex/chat/`
- **Streaming Mode**: Real-time Server-Sent Events via `/vex/chat/stream/`

### 🎨 Modern UI
- Responsive design that works on desktop and mobile
- Real-time typing indicators for streaming mode
- Message formatting with markdown-style support
- Dark mode support (follows system preference)

### ⚙️ Configuration
- Configurable API base URL
- CSRF token management
- Session tracking
- Local storage for persistent settings

### 🔧 Developer Features
- Connection status indicator
- Error handling with toast notifications
- Auto-save settings
- Debug information in console
- Session management

## API Endpoints Tested

### 1. Regular Chat Endpoint
```
POST /vex/chat/
Content-Type: multipart/form-data

Body:
- question: string (required)

Response:
{
  "answer": "AI response",
  "session_id": "session_identifier", 
  "csrftoken": "csrf_token"
}
```

### 2. Streaming Chat Endpoint
```
GET /vex/chat/stream/?question=your+question
Accept: text/event-stream

Response: Server-Sent Events stream
- event: received (acknowledgment)
- data: response_chunk (multiple chunks)
- event: finished (completion)
- event: error (on error)
```

## Usage

### Getting Started

1. **Start your Django server**:
   ```bash
   cd portfolio
   python manage.py runserver
   ```

2. **Open the chat tester**:
   - Open `index.html` in your browser
   - Or use a local server: `python -m http.server 8080`

3. **Configure settings** (if needed):
   - Click the settings gear icon
   - Set your API base URL (default: `http://localhost:8000`)
   - Save settings

### Testing Regular Mode

1. Ensure "Regular" mode is selected (default)
2. Type a question in the input field
3. Press Enter or click the send button
4. View the complete response

### Testing Streaming Mode

1. Click "Switch to Streaming" button
2. Type a question in the input field
3. Press Enter or click the send button
4. Watch the real-time streaming response

### Key Features to Test

- **Session Persistence**: Multiple messages in the same session
- **CSRF Protection**: Automatic token handling
- **Error Handling**: Invalid requests, network errors
- **Stream Interruption**: Refresh page during streaming
- **Mobile Responsiveness**: Test on different screen sizes

## File Structure

```
chat-tester/
├── index.html          # Main HTML structure
├── styles.css          # Modern CSS styling
├── script.js           # JavaScript functionality
└── README.md          # This documentation
```

## Technical Details

### JavaScript Classes

- **VexChatTester**: Main class handling all functionality
  - Connection management
  - Message handling
  - Settings persistence
  - Error handling

### Key Methods

- `sendRegularMessage()`: Handles standard POST requests
- `sendStreamingMessage()`: Manages SSE connections
- `addMessage()`: Creates message UI elements
- `formatMessage()`: Processes markdown-style formatting

### Local Storage

Settings are automatically saved to browser local storage:
- `vex_chat_base_url`: API base URL
- `vex_chat_csrf_token`: CSRF token
- `vex_chat_session_id`: Current session ID

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure Django server is running
   - Check the base URL in settings
   - Verify CORS settings if testing from different origin

2. **CSRF Token Errors**
   - The token is auto-generated on first successful request
   - Clear browser storage to reset tokens
   - Ensure cookies are enabled

3. **Streaming Not Working**
   - Check browser console for EventSource errors
   - Verify the streaming endpoint is accessible
   - Some networks may block EventSource connections

### Debug Information

- Open browser Developer Tools
- Check Console for detailed error messages
- Network tab shows all API requests
- Application tab shows local storage values

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (EventSource not supported)

## Security Notes

- CSRF tokens are handled automatically
- Session cookies are used for authentication
- No sensitive data is stored in local storage
- HTTPS recommended for production testing

## Customization

### Styling
Modify `styles.css` to customize the appearance:
- Color scheme variables at the top
- Responsive breakpoints
- Dark mode overrides

### Functionality
Extend `script.js` to add new features:
- Additional API endpoints
- Custom message formatting
- Analytics integration

## Contributing

To improve the chat tester:

1. Test with different API responses
2. Add new features for edge cases
3. Improve error handling
4. Enhance mobile experience
5. Add accessibility features

## API Integration Notes

The Vex API uses:
- **LangChain** for RAG implementation
- **OpenAI GPT-4o-mini** as the LLM
- **Django sessions** for conversation history
- **Server-Sent Events** for real-time streaming

This tester validates all these components work correctly together.
