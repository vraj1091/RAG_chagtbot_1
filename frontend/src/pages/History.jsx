import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    FileText,
    Calendar,
    BarChart3,
    TrendingUp,
    Clock,
    ArrowRight,
    Search,
    Filter,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [overview, setOverview] = useState(null);
    const [chatHistory, setChatHistory] = useState({ chats: [], pagination: {} });
    const [docHistory, setDocHistory] = useState({ documents: [], pagination: {} });
    const [timeline, setTimeline] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [overviewRes, activityRes] = await Promise.all([
                api.get('/history/overview'),
                api.get('/history/activity', { params: { days: 7 } }),
            ]);

            setOverview(overviewRes.data);
            setTimeline(activityRes.data.timeline);
        } catch (error) {
            console.error('Failed to load history data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadChatHistory = async (page = 1) => {
        try {
            const response = await api.get('/history/chats', {
                params: { page, per_page: 10, search: searchQuery || undefined },
            });
            setChatHistory(response.data);
        } catch (error) {
            console.error('Failed to load chat history');
        }
    };

    const loadDocHistory = async (page = 1) => {
        try {
            const response = await api.get('/history/documents', {
                params: { page, per_page: 10, search: searchQuery || undefined },
            });
            setDocHistory(response.data);
        } catch (error) {
            console.error('Failed to load document history');
        }
    };

    useEffect(() => {
        if (activeTab === 'chats') {
            loadChatHistory();
        } else if (activeTab === 'documents') {
            loadDocHistory();
        }
    }, [activeTab, searchQuery]);

    const StatCard = ({ icon: Icon, label, value, trend, color }) => (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>
                <Icon size={24} />
            </div>
            <div className="stat-content">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
            </div>
            {trend && (
                <div className="stat-trend">
                    <TrendingUp size={16} />
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="history-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>History</h1>
                    <p>View your chat history, document uploads, and activity statistics.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <BarChart3 size={18} />
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chats')}
                >
                    <MessageSquare size={18} />
                    Chat History
                </button>
                <button
                    className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                >
                    <FileText size={18} />
                    Document History
                </button>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="animate-pulse">Loading...</div>
                </div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && overview && (
                        <div className="overview-content">
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <StatCard
                                    icon={MessageSquare}
                                    label="Total Chats"
                                    value={overview.statistics.total_chats}
                                    color="primary"
                                />
                                <StatCard
                                    icon={FileText}
                                    label="Total Documents"
                                    value={overview.statistics.total_documents}
                                    color="secondary"
                                />
                                <StatCard
                                    icon={Clock}
                                    label="Recent Chats"
                                    value={overview.statistics.recent_chats}
                                    trend="This week"
                                    color="accent"
                                />
                                <StatCard
                                    icon={Calendar}
                                    label="Recent Uploads"
                                    value={overview.statistics.recent_documents}
                                    trend="This week"
                                    color="success"
                                />
                            </div>

                            {/* Activity Chart */}
                            <div className="activity-chart-container">
                                <h3>Activity (Last 7 Days)</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={timeline}>
                                            <defs>
                                                <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="rgba(255,255,255,0.5)"
                                                tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                            />
                                            <YAxis stroke="rgba(255,255,255,0.5)" />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--bg-elevated)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-lg)',
                                                }}
                                                labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="chats"
                                                stroke="#6366f1"
                                                fillOpacity={1}
                                                fill="url(#colorChats)"
                                                name="Chats"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="documents"
                                                stroke="#8b5cf6"
                                                fillOpacity={1}
                                                fill="url(#colorDocs)"
                                                name="Documents"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="recent-activity-grid">
                                {/* Recent Chats */}
                                <div className="recent-section">
                                    <div className="section-header">
                                        <h3>Recent Chats</h3>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setActiveTab('chats')}
                                        >
                                            View All
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                    <div className="recent-list">
                                        {overview.recent_chats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className="recent-item"
                                                onClick={() => navigate(`/chat/${chat.id}`)}
                                            >
                                                <MessageSquare size={18} className="item-icon" />
                                                <div className="item-content">
                                                    <span className="item-title">{chat.title}</span>
                                                    <span className="item-meta">
                                                        {chat.message_count} messages •{' '}
                                                        {format(new Date(chat.updated_at), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                <ArrowRight size={16} className="arrow-icon" />
                                            </div>
                                        ))}
                                        {overview.recent_chats.length === 0 && (
                                            <div className="empty-recent">No recent chats</div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Documents */}
                                <div className="recent-section">
                                    <div className="section-header">
                                        <h3>Recent Documents</h3>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setActiveTab('documents')}
                                        >
                                            View All
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                    <div className="recent-list">
                                        {overview.recent_documents.map((doc) => (
                                            <div key={doc.id} className="recent-item">
                                                <FileText size={18} className="item-icon" />
                                                <div className="item-content">
                                                    <span className="item-title">{doc.filename}</span>
                                                    <span className="item-meta">
                                                        {doc.file_type.toUpperCase()} •{' '}
                                                        {format(new Date(doc.created_at), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                <span className={`status-dot ${doc.status}`} />
                                            </div>
                                        ))}
                                        {overview.recent_documents.length === 0 && (
                                            <div className="empty-recent">No recent documents</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat History Tab */}
                    {activeTab === 'chats' && (
                        <div className="history-list-content">
                            <div className="search-bar">
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="history-list">
                                {chatHistory.chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className="history-item"
                                        onClick={() => navigate(`/chat/${chat.id}`)}
                                    >
                                        <div className="item-icon-wrapper">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div className="item-details">
                                            <h4>{chat.title}</h4>
                                            {chat.preview && <p>{chat.preview}</p>}
                                            <div className="item-meta">
                                                <span>{chat.message_count} messages</span>
                                                <span>•</span>
                                                <span>{format(new Date(chat.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="arrow-icon" />
                                    </div>
                                ))}
                                {chatHistory.chats.length === 0 && (
                                    <div className="empty-state">
                                        <MessageSquare size={48} />
                                        <h3>No chats found</h3>
                                        <p>Start a new conversation to see it here</p>
                                    </div>
                                )}
                            </div>

                            {chatHistory.pagination.pages > 1 && (
                                <div className="pagination">
                                    {Array.from({ length: chatHistory.pagination.pages }, (_, i) => (
                                        <button
                                            key={i}
                                            className={`page-btn ${chatHistory.pagination.page === i + 1 ? 'active' : ''}`}
                                            onClick={() => loadChatHistory(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document History Tab */}
                    {activeTab === 'documents' && (
                        <div className="history-list-content">
                            <div className="search-bar">
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="history-list">
                                {docHistory.documents.map((doc) => (
                                    <div key={doc.id} className="history-item">
                                        <div className="item-icon-wrapper doc">
                                            <FileText size={20} />
                                        </div>
                                        <div className="item-details">
                                            <h4>{doc.filename}</h4>
                                            <div className="item-meta">
                                                <span>{doc.file_type.toUpperCase()}</span>
                                                <span>•</span>
                                                <span>{doc.chunk_count} chunks</span>
                                                <span>•</span>
                                                <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                        <span className={`badge badge-${doc.status === 'completed' ? 'success' : doc.status === 'failed' ? 'error' : 'warning'}`}>
                                            {doc.status}
                                        </span>
                                    </div>
                                ))}
                                {docHistory.documents.length === 0 && (
                                    <div className="empty-state">
                                        <FileText size={48} />
                                        <h3>No documents found</h3>
                                        <p>Upload documents to see them here</p>
                                    </div>
                                )}
                            </div>

                            {docHistory.pagination.pages > 1 && (
                                <div className="pagination">
                                    {Array.from({ length: docHistory.pagination.pages }, (_, i) => (
                                        <button
                                            key={i}
                                            className={`page-btn ${docHistory.pagination.page === i + 1 ? 'active' : ''}`}
                                            onClick={() => loadDocHistory(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default History;
