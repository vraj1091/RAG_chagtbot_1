import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { email, username, fullName, password, confirmPassword } = formData;

        if (!email || !username || !password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        const result = await register(email, username, password, fullName);

        if (result.success) {
            toast.success('Account created successfully!');
            navigate('/chat');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="bg-glow bg-glow-1" />
                <div className="bg-glow bg-glow-2" />
                <div className="bg-glow bg-glow-3" />
            </div>

            <div className="auth-container">
                {/* Left Panel - Branding */}
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="brand-logo">
                            <div className="logo-icon-wrapper large">
                                <Sparkles size={40} />
                            </div>
                        </div>
                        <h1 className="brand-title">
                            <span className="text-gradient">RAG Chatbot</span>
                        </h1>
                        <p className="brand-description">
                            Join thousands of users leveraging AI to extract insights
                            from their documents instantly.
                        </p>
                        <div className="brand-features">
                            <div className="feature">
                                <div className="feature-icon">🚀</div>
                                <span>Get Started Free</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">🔒</div>
                                <span>Secure & Private</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">⚡</div>
                                <span>Instant Answers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-header">
                            <h2>Create Account</h2>
                            <p>Start your journey with RAG Chatbot</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="username">Username *</label>
                                    <div className="input-wrapper">
                                        <User size={20} className="input-icon" />
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Choose a username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <div className="input-wrapper">
                                        <User size={20} className="input-icon" />
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            placeholder="Your full name"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <div className="input-wrapper">
                                    <Mail size={20} className="input-icon" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password *</label>
                                    <div className="input-wrapper">
                                        <Lock size={20} className="input-icon" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min 6 characters"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password *</label>
                                    <div className="input-wrapper">
                                        <Lock size={20} className="input-icon" />
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg submit-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Already have an account?{' '}
                                <Link to="/login">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
