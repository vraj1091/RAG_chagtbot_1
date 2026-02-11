import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Send,
    Plus,
    Trash2,
    MessageSquare,
    Loader2,
    FileText,
    Sparkles,
    Bot,
    User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from '../stores/chatStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const {
        chats,
        currentChat,
        messages,
        isLoading,
        isSending,
        fetchChats,
        fetchChat,
        sendMessage,
        deleteChat,
        clearCurrentChat,
    } = useChatStore();

    // Fetch chats on mount
    useEffect(() => {
        fetchChats();
    }, []);

    // Fetch specific chat if chatId in URL
    useEffect(() => {
        if (chatId) {
            fetchChat(parseInt(chatId)).then((result) => {
                // If chat not found, redirect to new chat
                if (result && result.notFound) {
                    navigate('/chat');
                    toast.error('Chat not found. Starting new chat.');
                }
            });
        } else {
            clearCurrentChat();
        }
    }, [chatId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!message.trim() || isSending) return;

        const messageText = message;
        setMessage('');

        const result = await sendMessage(messageText, currentChat?.id);

        if (result.success) {
            if (!currentChat && result.chatId) {
                navigate(`/chat/${result.chatId}`);
            }
        } else {
            toast.error('Failed to send message');
        }
    };

    const handleNewChat = () => {
        clearCurrentChat();
        navigate('/chat');
    };

    const handleDeleteChat = async (id, e) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to delete this chat?')) {
            const success = await deleteChat(id);
            if (success) {
                toast.success('Chat deleted');
                if (currentChat?.id === id) {
                    navigate('/chat');
                }
            } else {
                toast.error('Failed to delete chat');
            }
        }
    };

    const handleChatSelect = (chat) => {
        navigate(`/chat/${chat.id}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <div className="chat-page">
            {/* Chat Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <button className="btn btn-primary new-chat-btn" onClick={handleNewChat}>
                        <Plus size={20} />
                        <span>New Chat</span>
                    </button>
                </div>

                <div className="chat-list">
                    {isLoading && chats.length === 0 ? (
                        <div className="chat-list-loading">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="chat-list-empty">
                            <MessageSquare size={32} />
                            <p>No chats yet</p>
                            <span>Start a new conversation</span>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                                onClick={() => handleChatSelect(chat)}
                            >
                                <MessageSquare size={18} className="chat-icon" />
                                <div className="chat-info">
                                    <span className="chat-title">{chat.title}</span>
                                    <span className="chat-date">
                                        {format(new Date(chat.updated_at), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDeleteChat(chat.id, e)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Main Area */}
            <div className="chat-main">
                {/* Messages */}
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="welcome-screen">
                            <div className="welcome-icon">
                                <Sparkles size={48} />
                            </div>
                            <h2>Welcome to RAG Chatbot</h2>
                            <p>
                                Ask questions about your uploaded documents or have a general conversation.
                                I'll provide answers based on your documents when relevant.
                            </p>
                            <div className="quick-actions">
                                <button
                                    className="quick-action"
                                    onClick={() => setMessage('What documents do I have uploaded?')}
                                >
                                    <FileText size={18} />
                                    <span>Check my documents</span>
                                </button>
                                <button
                                    className="quick-action"
                                    onClick={() => setMessage('Summarize my documents')}
                                >
                                    <Bot size={18} />
                                    <span>Summarize documents</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((msg, index) => (
                                <div
                                    key={msg.id || index}
                                    className={`message ${msg.role}`}
                                >
                                    <div className="message-avatar">
                                        {msg.role === 'user' ? (
                                            <User size={20} />
                                        ) : (
                                            <Bot size={20} />
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-header">
                                            <span className="message-sender">
                                                {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                            </span>
                                            {msg.created_at && (
                                                <span className="message-time">
                                                    {format(new Date(msg.created_at), 'h:mm a')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="message-text">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                        {msg.sources && JSON.parse(msg.sources).length > 0 && (
                                            <div className="message-sources">
                                                <span className="sources-label">Sources:</span>
                                                {JSON.parse(msg.sources).map((source, i) => (
                                                    <span key={i} className="source-tag">
                                                        <FileText size={12} />
                                                        {source.filename}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isSending && (
                                <div className="message assistant typing">
                                    <div className="message-avatar">
                                        <Bot size={20} />
                                    </div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="chat-input-container">
                    <form onSubmit={handleSend} className="chat-input-form">
                        <div className="input-wrapper">
                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message..."
                                rows={1}
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={!message.trim() || isSending}
                            >
                                {isSending ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </div>
                        <p className="input-hint">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
