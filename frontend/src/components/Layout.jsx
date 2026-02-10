import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Upload,
    History,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
    Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './Layout.css';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/chat', icon: MessageSquare, label: 'Chat' },
        { path: '/upload', icon: Upload, label: 'Upload Documents' },
        { path: '/history', icon: History, label: 'History' },
    ];

    return (
        <div className="layout">
            {/* Mobile Header */}
            <header className="mobile-header hide-desktop">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="logo">
                    <Sparkles className="logo-icon" />
                    <span>RAG Chatbot</span>
                </div>
                <div className="user-avatar-small">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon-wrapper">
                            <Sparkles className="logo-icon" />
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">RAG Chatbot</span>
                            <span className="logo-subtitle">Powered by Gemini</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => window.innerWidth < 769 && setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div
                        className="user-menu-trigger"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                        <div className="user-avatar">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.full_name || user?.username}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`chevron ${userMenuOpen ? 'rotated' : ''}`}
                        />
                    </div>

                    {userMenuOpen && (
                        <div className="user-menu">
                            <button className="user-menu-item" onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay hide-desktop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
