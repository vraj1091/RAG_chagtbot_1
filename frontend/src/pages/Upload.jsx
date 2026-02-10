import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Upload as UploadIcon,
    File,
    FileText,
    Image,
    Table,
    Presentation,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { useDocumentStore } from '../stores/documentStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Upload.css';

const Upload = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);

    const {
        documents,
        isLoading,
        isUploading,
        uploadProgress,
        fetchDocuments,
        uploadDocuments,
        deleteDocument,
        reprocessDocument,
    } = useDocumentStore();

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Refresh document statuses periodically
    useEffect(() => {
        const pendingDocs = documents.filter(
            (d) => d.status === 'pending' || d.status === 'processing'
        );

        if (pendingDocs.length > 0) {
            const interval = setInterval(() => {
                fetchDocuments();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [documents]);

    const onDrop = useCallback((acceptedFiles) => {
        setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/*': ['.txt', '.md', '.csv'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const removeFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        const result = await uploadDocuments(selectedFiles);

        if (result.success) {
            toast.success(`Uploaded ${result.successCount} file(s) successfully!`);
            if (result.failedCount > 0) {
                toast.error(`${result.failedCount} file(s) failed to upload`);
            }
            setSelectedFiles([]);
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            const success = await deleteDocument(id);
            if (success) {
                toast.success('Document deleted');
            } else {
                toast.error('Failed to delete document');
            }
        }
    };

    const handleReprocess = async (id) => {
        const success = await reprocessDocument(id);
        if (success) {
            toast.success('Document queued for reprocessing');
        } else {
            toast.error('Failed to reprocess document');
        }
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <FileText className="file-icon pdf" />;
            case 'docx':
            case 'doc':
                return <FileText className="file-icon doc" />;
            case 'xlsx':
            case 'xls':
            case 'csv':
                return <Table className="file-icon excel" />;
            case 'pptx':
                return <Presentation className="file-icon ppt" />;
            case 'image':
                return <Image className="file-icon image" />;
            default:
                return <File className="file-icon" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="badge badge-success">
                        <CheckCircle size={12} />
                        Completed
                    </span>
                );
            case 'processing':
                return (
                    <span className="badge badge-info">
                        <Loader2 size={12} className="animate-spin" />
                        Processing
                    </span>
                );
            case 'pending':
                return (
                    <span className="badge badge-warning">
                        <Loader2 size={12} className="animate-spin" />
                        Pending
                    </span>
                );
            case 'failed':
                return (
                    <span className="badge badge-error">
                        <AlertCircle size={12} />
                        Failed
                    </span>
                );
            default:
                return null;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return (
        <div className="upload-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Upload Documents</h1>
                    <p>
                        Upload your documents to make them searchable in your conversations.
                        Supports PDF, Word, Excel, PowerPoint, images with OCR, and text files.
                    </p>
                </div>
            </div>

            <div className="upload-content">
                {/* Upload Zone */}
                <div className="upload-zone-container">
                    <div
                        {...getRootProps()}
                        className={`upload-zone ${isDragActive ? 'active' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="upload-zone-content">
                            <div className="upload-icon">
                                <UploadCloud size={48} />
                            </div>
                            <h3>
                                {isDragActive
                                    ? 'Drop files here...'
                                    : 'Drag & drop files here'}
                            </h3>
                            <p>or click to browse</p>
                            <div className="supported-formats">
                                <span>PDF</span>
                                <span>DOCX</span>
                                <span>XLSX</span>
                                <span>PPTX</span>
                                <span>TXT</span>
                                <span>Images</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            <div className="selected-header">
                                <h4>Selected Files ({selectedFiles.length})</h4>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setSelectedFiles([])}
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="files-list">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="selected-file">
                                        <File size={20} className="file-icon" />
                                        <div className="file-info">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{formatFileSize(file.size)}</span>
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="btn btn-primary upload-btn"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Uploading... {uploadProgress.overall || 0}%
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon size={20} />
                                        Upload {selectedFiles.length} File(s)
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Documents List */}
                <div className="documents-section">
                    <div className="section-header">
                        <h2>Your Documents</h2>
                        <span className="doc-count">{documents.length} documents</span>
                    </div>

                    {isLoading && documents.length === 0 ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Loading documents...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} />
                            <h3>No documents yet</h3>
                            <p>Upload your first document to get started</p>
                        </div>
                    ) : (
                        <div className="documents-grid">
                            {documents.map((doc) => (
                                <div key={doc.id} className="document-card">
                                    <div className="doc-header">
                                        {getFileIcon(doc.file_type)}
                                        {getStatusBadge(doc.status)}
                                    </div>
                                    <div className="doc-body">
                                        <h4 className="doc-name" title={doc.original_filename}>
                                            {doc.original_filename}
                                        </h4>
                                        <div className="doc-meta">
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span>•</span>
                                            <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                        {doc.status === 'completed' && (
                                            <div className="doc-chunks">
                                                {doc.chunk_count} chunks indexed
                                            </div>
                                        )}
                                        {doc.status === 'failed' && doc.error_message && (
                                            <div className="doc-error">
                                                {doc.error_message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="doc-actions">
                                        {doc.status === 'failed' && (
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleReprocess(doc.id)}
                                                title="Reprocess"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-ghost btn-icon delete"
                                            onClick={() => handleDelete(doc.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
