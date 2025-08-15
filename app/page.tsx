"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Sparkles,
    Code,
    Upload,
    File,
    X,
    FileText,
    FileCode,
    FileSpreadsheet,
    Zap,
    ChevronDown,
    Wallet,
    LogOut,
    Play,
    Paperclip,
    Lightbulb,
    Sun,
    Moon,
    Monitor,
    Palette,
    Copy,
    Download,
    Share,
    RefreshCw,
    Wand2,
} from "lucide-react";
import { useWallet } from "./walletcontext/WalletContext";
import { useTheme } from "./themecontext/ThemeContext";

// Define interfaces
interface UploadedFile {
    id: number;
    name: string;
    type: string;
    size: number;
    content: string | ArrayBuffer;
    lastModified: number;
}

interface Conversation {
    _id: string;
    prompt: string;
    uploadedFiles: UploadedFile[] | null;
    generatedFiles: { [key: string]: string } | null;
    timestamp: string;
}

interface WalletContext {
    walletAddress: string | null;
    connectWallet: () => void;
    disconnectWallet: () => void;
    connecting: boolean;
}

const HomePage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isCodeSnippetsOpen, setIsCodeSnippetsOpen] = useState<boolean>(false);

    const { walletAddress, connectWallet, disconnectWallet, connecting } = useWallet() as WalletContext;
    const { theme, toggleTheme, setTheme, isDark } = useTheme();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize or retrieve userId based on wallet address
    useEffect(() => {
        let userId = localStorage.getItem("userId");
        if (!userId && walletAddress) {
            userId = walletAddress;
            localStorage.setItem("userId", userId);
        }
        if (userId) {
            fetchConversations(userId);
        } else {
            setConversations([]);
        }
    }, [walletAddress]);

    const fetchConversations = async (userId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/anthropic?userId=${encodeURIComponent(userId)}`);
            const data: { conversations?: Conversation[]; error?: string } = await response.json();
            if (data.conversations) {
                setConversations(data.conversations);
            } else {
                setError(data.error || "Failed to load conversation history");
            }
        } catch (err) {
            setError("Failed to load conversation history");
        }
    };

    const getFileIcon = (fileType: string): React.ReactElement => {
        if (fileType.startsWith("image/")) return <File className="w-4 h-4" />;
        if (fileType.includes("text/") || fileType.includes("json"))
            return <FileText className="w-4 h-4" />;
        if (
            fileType.includes("javascript") ||
            fileType.includes("typescript") ||
            fileType.includes("python") ||
            fileType.includes("java")
        )
            return <FileCode className="w-4 h-4" />;
        if (
            fileType.includes("spreadsheet") ||
            fileType.includes("excel") ||
            fileType.includes("csv")
        )
            return <FileSpreadsheet className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const handleFileUpload = async (files: File[]): Promise<void> => {
        const newFiles: UploadedFile[] = [];

        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) {
                setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
                continue;
            }

            try {
                let content: string | ArrayBuffer;

                if (file.type.startsWith("image/")) {
                    content = await new Promise<string | ArrayBuffer>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (e.target && e.target.result) {
                                resolve(e.target.result);
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                } else if (file.type === "application/pdf") {
                    content = "[PDF file - will be processed by AI]";
                } else if (
                    file.type.includes("excel") ||
                    file.type.includes("spreadsheet")
                ) {
                    content = "[Excel file - will be processed by AI]";
                } else {
                    content = await new Promise<string | ArrayBuffer>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (e.target && e.target.result) {
                                resolve(e.target.result);
                            }
                        };
                        reader.readAsText(file);
                    });
                }

                newFiles.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content,
                    lastModified: file.lastModified,
                });
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                setError(`Failed to read file "${file.name}"`);
            }
        }

        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        sessionStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.relatedTarget as Node;
        if (!e.currentTarget.contains(target)) {
            setIsDragging(false);
        }
    };

    const removeFile = (fileId: number): void => {
        const updatedFiles = uploadedFiles.filter((file) => file.id !== fileId);
        setUploadedFiles(updatedFiles);
        sessionStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleStreamingGenerate = (): void => {
        if (!prompt.trim() && uploadedFiles.length === 0) {
            setError("Please describe what you want to build or upload files to generate code from");
            return;
        }

        // Store prompt and files in sessionStorage for the streaming page
        sessionStorage.setItem("currentPrompt", prompt);
        sessionStorage.setItem("currentUploadedFiles", JSON.stringify(uploadedFiles));

        // Navigate to streaming page
        const searchParams = new URLSearchParams();
        searchParams.set('prompt', encodeURIComponent(prompt));
        if (uploadedFiles.length > 0) {
            searchParams.set('uploadedFiles', encodeURIComponent(JSON.stringify(uploadedFiles)));
        }
        
        router.push(`/streaming?${searchParams.toString()}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleStreamingGenerate();
        }
    };

    // Button functionality functions
    const handleCodeSnippets = (): void => {
        const codeSnippets = [
            "Create a responsive navbar with React",
            "Add dark mode toggle functionality",
            "Build a contact form with validation",
            "Create animated loading spinner",
            "Add user authentication with JWT",
            "Build a shopping cart component",
            "Create file upload with drag & drop",
            "Add search functionality with filters"
        ];
        const randomSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        setPrompt(prev => prev + (prev ? "\n\n" : "") + randomSnippet);
    };

    const handleAIEnhancement = (): void => {
        if (!prompt.trim()) {
            setPrompt("Enhance this with modern design patterns, accessibility features, and best practices");
        } else {
            setPrompt(prev => prev + "\n\nPlease enhance this with:\n- Modern UI/UX design\n- Accessibility features\n- Performance optimizations\n- Best practices");
        }
    };

    const handleIdeas = (): void => {
        const ideas = [
            "Add animations and micro-interactions",
            "Implement responsive design for mobile",
            "Add TypeScript for better type safety",
            "Include error boundaries and loading states",
            "Add unit tests with Jest and React Testing Library",
            "Implement state management with Zustand or Redux",
            "Add PWA features for offline functionality",
            "Include SEO optimizations"
        ];
        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        setPrompt(prev => prev + (prev ? "\n\n" : "") + "💡 " + randomIdea);
    };

    const handleCopyPrompt = (): void => {
        if (prompt.trim()) {
            navigator.clipboard.writeText(prompt);
            // You could add a toast notification here
        }
    };

    const handleShare = (): void => {
        if (prompt.trim()) {
            const shareData = {
                title: 'Spin AI Project Prompt',
                text: prompt,
                url: window.location.href,
            };
            
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(`${prompt}\n\n${window.location.href}`);
            }
        }
    };

    const handleRefreshPrompt = (): void => {
        setPrompt("");
        setError("");
    };

    const examples: string[] = [
        "Build a meme coin landing page",
        "Create a leaderboard for token holders",
        "Make a dashboard for community points",
        "Create a to-do app with dark mode",
        "Build a feedback form with emoji reactions",
        "Start a blank app with React + Tailwind",
    ];

    const getThemeClasses = () => {
        return theme === 'light' 
            ? 'min-h-screen bg-white text-gray-900 relative overflow-hidden'
            : 'min-h-screen bg-black text-white relative overflow-hidden';
    };

    const getAccentColor = () => {
        return theme === 'light' ? 'blue' : 'lime';
    };

    return (
        <div className={getThemeClasses()} suppressHydrationWarning>
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {theme === 'light' ? (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-lime-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                    </>
                )}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 relative z-10" suppressHydrationWarning>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        title="Refresh page"
                    >
                        <img
                            src="/logo.png"
                            alt="Spin Logo"
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-xl font-semibold">Spin</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                    >
                        {theme === 'light' ? (
                            <Moon className="w-4 h-4" />
                        ) : (
                            <Sun className="w-4 h-4" />
                        )}
                    </button>

                    {walletAddress ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                            <span className="text-sm text-gray-300">
                                {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
                            </span>
                            <button
                                onClick={() => {
                                    disconnectWallet();
                                    localStorage.removeItem("userId");
                                    setConversations([]);
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Disconnect wallet"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            disabled={connecting}
                            className="flex items-center gap-2 px-4 py-1.5 bg-lime-500 text-black rounded-lg hover:bg-lime-400 disabled:opacity-50 transition-all duration-300 text-sm font-medium transform hover:scale-105 shadow-lg"
                        >
                            {connecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wallet className="w-4 h-4" />
                            )}
                            {connecting ? "Connecting..." : "Connect Wallet"}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
                {/* Input section - always show */}
                <>
                    {/* Title Section */}
                    <div className="text-center mb-12 relative z-10">
                        <h1 className="text-7xl font-bold mb-8 leading-tight">
                            Build from a <span className="bg-gradient-to-r from-lime-400 to-green-300 bg-clip-text text-transparent">single prompt</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Go from idea to live app in minutes using natural language. Powered by <span className="text-lime-400 font-semibold">$SPIN</span>.
                        </p>
                    </div>

                        {/* Input Area - Modern Design */}
                        <div className="relative max-w-4xl mx-auto">
                            <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800/50 overflow-hidden shadow-2xl">
                                {/* Prompt Input */}
                                <div className="p-8">
                                    <div className="relative">
                                        <div
                                            className={`relative transition-all duration-300 ${
                                                isDragging
                                                    ? "ring-2 ring-lime-400/50 ring-opacity-50 scale-[1.02]"
                                                    : ""
                                            }`}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                        >
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="What would you like to build?"
                                                className={`w-full h-20 p-6 bg-transparent border-0 rounded-2xl text-white placeholder-gray-400 focus:outline-none resize-none text-lg transition-all duration-300 ${
                                                    isDragging ? "bg-lime-400/5" : ""
                                                }`}
                                                style={{ 
                                                    background: isDragging 
                                                        ? 'rgba(132, 204, 22, 0.05)' 
                                                        : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                                    backdropFilter: 'blur(10px)'
                                                }}
                                                disabled={false}
                                            />
                                            
                                            {isDragging && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-lime-400/5 rounded-2xl">
                                                    <div className="text-lime-400 text-center">
                                                        <Upload className="w-8 h-8 mx-auto mb-2" />
                                                        <p className="text-sm font-medium">Drop files here</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Bottom toolbar */}
                                        <div className="flex items-center justify-between mt-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-lime-500 text-black rounded-full hover:bg-lime-400 transition-all duration-200 text-sm font-medium flex items-center gap-2 transform hover:scale-105 shadow-lg"
                                                    disabled={false}
                                                >
                                                    <Paperclip className="w-4 h-4" />
                                                    Attach
                                                </button>
                                                <button 
                                                    onClick={handleCodeSnippets}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="Add code snippets"
                                                    disabled={false}
                                                >
                                                    <Code className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleAIEnhancement}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="AI enhancement suggestions"
                                                    disabled={false}
                                                >
                                                    <Wand2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleIdeas}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="Get creative ideas"
                                                    disabled={false}
                                                >
                                                    <Lightbulb className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleCopyPrompt}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="Copy prompt"
                                                    disabled={!prompt.trim()}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleShare}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="Share prompt"
                                                    disabled={!prompt.trim()}
                                                >
                                                    <Share className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleRefreshPrompt}
                                                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-lg hover:bg-gray-800/50"
                                                    title="Clear prompt"
                                                    disabled={false}
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleStreamingGenerate}
                                                disabled={(!prompt.trim() && uploadedFiles.length === 0)}
                                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                                    (!prompt.trim() && uploadedFiles.length === 0)
                                                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-lime-500 to-green-400 text-black hover:from-lime-400 hover:to-green-300 shadow-lg hover:shadow-lime-500/25 transform hover:scale-105"
                                                }`}
                                            >
                                                <>
                                                    <Zap className="w-5 h-5" />
                                                    <span>Generate App</span>
                                                </>
                                            </button>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm">
                                                <p className="text-sm text-red-300">{error}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Uploaded Files Display */}
                                {uploadedFiles.length > 0 && (
                                    <div className="border-t border-gray-800/50 p-6 bg-gray-900/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                                <File className="w-4 h-4 text-lime-400" />
                                                Attached Files ({uploadedFiles.length})
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                                            {uploadedFiles.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="text-gray-400">
                                                            {getFileIcon(file.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-300 truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-900/20 ml-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Example Prompts */}
                                <div className="border-t border-gray-800/50 p-6 bg-gray-900/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {examples.map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPrompt(example)}
                                                className="text-left text-sm p-4 bg-gray-800/40 rounded-xl hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white border border-gray-700/30 hover:border-gray-600/50 hover:shadow-lg transform hover:scale-[1.02]"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files) {
                                        handleFileUpload(Array.from(e.target.files));
                                    }
                                }}
                                multiple
                                className="hidden"
                                accept=".txt,.js,.ts,.jsx,.tsx,.json,.py,.java,.csv,.xlsx,.pdf,.jpg,.jpeg,.png,.gif"
                            />
                        </div>

                        {/* Conversation History */}
                        {conversations.length > 0 && (
                            <div className="mt-16">
                                <h2 className="text-2xl font-semibold text-white mb-6 text-center">Recent Projects</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                    {conversations.slice(0, 6).map((conversation) => (
                                        <div
                                            key={conversation._id}
                                            className="p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 cursor-pointer hover:bg-gray-800/50 transition-all duration-300 hover:border-gray-700/50 hover:shadow-lg transform hover:scale-[1.02]"
                                            onClick={() => {
                                                setPrompt(conversation.prompt);
                                                setUploadedFiles(conversation.uploadedFiles || []);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {conversation.prompt || "File-based generation"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(conversation.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                                    <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                                                        {conversation.generatedFiles
                                                            ? `${Object.keys(conversation.generatedFiles).length} files`
                                                            : "No files"}
                                                    </span>
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
            </div>
        </div>
    );
};

export default HomePage;
