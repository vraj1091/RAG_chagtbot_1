import { create } from 'zustand';
import api from '../services/api';

export const useChatStore = create((set, get) => ({
    chats: [],
    currentChat: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,

    // Fetch all chats
    fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/chat/');
            set({ chats: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load chats', isLoading: false });
        }
    },

    // Fetch a specific chat with messages
    fetchChat: async (chatId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/chat/${chatId}`);
            set({
                currentChat: response.data,
                messages: response.data.messages || [],
                isLoading: false,
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to load chat:', error);
            set({ 
                error: 'Chat not found',
                isLoading: false,
                currentChat: null,
                messages: []
            });
            return { success: false, notFound: error.response?.status === 404 };
        }
    },

    // Create a new chat
    createChat: async (title = 'New Chat') => {
        try {
            const response = await api.post('/chat/', { title });
            const newChat = response.data;
            set((state) => ({
                chats: [newChat, ...state.chats],
                currentChat: newChat,
                messages: [],
            }));
            return newChat;
        } catch (error) {
            set({ error: 'Failed to create chat' });
            return null;
        }
    },

    // Send a message
    sendMessage: async (message, chatId = null) => {
        set({ isSending: true, error: null });

        // Optimistically add user message
        const tempUserMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
        };

        set((state) => ({
            messages: [...state.messages, tempUserMessage],
        }));

        try {
            const response = await api.post('/chat/send', {
                message,
                chat_id: chatId,
            });

            const { user_message, assistant_message, chat_id: newChatId, sources } = response.data;

            // Update messages with actual response
            set((state) => ({
                messages: [
                    ...state.messages.filter((m) => m.id !== tempUserMessage.id),
                    user_message,
                    assistant_message,
                ],
                isSending: false,
            }));

            // If new chat was created, update chats list
            if (!chatId && newChatId) {
                await get().fetchChats();
                set((state) => {
                    const chat = state.chats.find((c) => c.id === newChatId);
                    return { currentChat: chat || state.currentChat };
                });
            }

            return { success: true, chatId: newChatId, sources };
        } catch (error) {
            // Remove optimistic message on error
            set((state) => ({
                messages: state.messages.filter((m) => m.id !== tempUserMessage.id),
                isSending: false,
                error: 'Failed to send message',
            }));
            return { success: false };
        }
    },

    // Delete a chat
    deleteChat: async (chatId) => {
        try {
            await api.delete(`/chat/${chatId}`);
            set((state) => ({
                chats: state.chats.filter((c) => c.id !== chatId),
                currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
                messages: state.currentChat?.id === chatId ? [] : state.messages,
            }));
            return true;
        } catch (error) {
            set({ error: 'Failed to delete chat' });
            return false;
        }
    },

    // Update chat title
    updateChatTitle: async (chatId, title) => {
        try {
            await api.put(`/chat/${chatId}/title`, null, { params: { title } });
            set((state) => ({
                chats: state.chats.map((c) =>
                    c.id === chatId ? { ...c, title } : c
                ),
                currentChat:
                    state.currentChat?.id === chatId
                        ? { ...state.currentChat, title }
                        : state.currentChat,
            }));
            return true;
        } catch (error) {
            return false;
        }
    },

    // Set current chat
    setCurrentChat: (chat) => {
        set({ currentChat: chat, messages: chat?.messages || [] });
    },

    // Clear current chat
    clearCurrentChat: () => {
        set({ currentChat: null, messages: [] });
    },

    // Clear error
    clearError: () => set({ error: null }),
}));
