import { create } from 'zustand';
import api from '../services/api';

export const useDocumentStore = create((set, get) => ({
    documents: [],
    totalDocuments: 0,
    isLoading: false,
    isUploading: false,
    uploadProgress: {},
    error: null,

    // Fetch documents
    fetchDocuments: async (page = 1, perPage = 20, statusFilter = null) => {
        set({ isLoading: true, error: null });
        try {
            const params = { page, per_page: perPage };
            if (statusFilter) params.status_filter = statusFilter;

            const response = await api.get('/documents/', { params });
            set({
                documents: response.data.documents,
                totalDocuments: response.data.total,
                isLoading: false,
            });
        } catch (error) {
            set({ error: 'Failed to load documents', isLoading: false });
        }
    },

    // Upload documents
    uploadDocuments: async (files) => {
        set({ isUploading: true, error: null, uploadProgress: {} });

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    set({ uploadProgress: { overall: progress } });
                },
            });

            const { documents: newDocs, success_count, failed_count } = response.data;

            // Add new documents to the list
            set((state) => ({
                documents: [...newDocs, ...state.documents],
                totalDocuments: state.totalDocuments + success_count,
                isUploading: false,
                uploadProgress: {},
            }));

            return { success: true, successCount: success_count, failedCount: failed_count };
        } catch (error) {
            set({ error: 'Failed to upload documents', isUploading: false });
            return { success: false, error: error.response?.data?.detail || 'Upload failed' };
        }
    },

    // Delete document
    deleteDocument: async (documentId) => {
        try {
            await api.delete(`/documents/${documentId}`);
            set((state) => ({
                documents: state.documents.filter((d) => d.id !== documentId),
                totalDocuments: state.totalDocuments - 1,
            }));
            return true;
        } catch (error) {
            set({ error: 'Failed to delete document' });
            return false;
        }
    },

    // Reprocess document
    reprocessDocument: async (documentId) => {
        try {
            await api.post(`/documents/${documentId}/reprocess`);
            set((state) => ({
                documents: state.documents.map((d) =>
                    d.id === documentId ? { ...d, status: 'pending' } : d
                ),
            }));
            return true;
        } catch (error) {
            set({ error: 'Failed to reprocess document' });
            return false;
        }
    },

    // Refresh document status
    refreshDocumentStatus: async (documentId) => {
        try {
            const response = await api.get(`/documents/${documentId}`);
            set((state) => ({
                documents: state.documents.map((d) =>
                    d.id === documentId ? response.data : d
                ),
            }));
        } catch (error) {
            // Silently fail for status refresh
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));
