import { useState, useEffect } from 'react';
import '../ComponentStyles/Ask.css';
import { useNavigate } from 'react-router-dom';
import { authFetch, clearAuthTokens, getAccessToken } from '../utils/auth';

export const Ask = () => {

    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

    const MODELS = [
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "qwen/qwen3.6-27b",
    ];


    // =========================
    // FETCH HISTORY
    // =========================

    useEffect(() => {
        fetchHistory();
    }, []);


    // =========================
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // =========================

    useEffect(() => {

        const handleClickOutside = () => {
            setOpenMenuIndex(null);
            setModelDropdownOpen(false);
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };

    }, []);


    // =========================
    // GET HISTORY
    // =========================

    const fetchHistory = async () => {

        try {

            const res = await authFetch("http://localhost:8080/aiplat/history");

            if (!res.ok) {
                throw new Error("Failed to fetch history");
            }

            const data = await res.json();

            setHistory(data);

        } catch (error) {

            console.error("History Error:", error);

        }

    };


    // =========================
    // LOGOUT
    // =========================

    const logout = async () => {

        try {

            const token = getAccessToken();

            if (token) {
                await fetch(
                    "http://localhost:8080/aiplat/logout",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );
            }

        } catch (error) {

            console.error("Logout Error:", error);

        } finally {

            clearAuthTokens();

            navigate("/login");

        }

    };


    // =========================
    // DELETE HISTORY
    // =========================

    const deleteHistory = async (index, e) => {

        // Prevent history item click
        e.stopPropagation();


        // Get the actual history object
        const chatToDelete = history[index];


        // Safety check
        if (!chatToDelete || !chatToDelete.id) {
            console.error("History ID not found");
            return;
        }


        try {

            const res = await authFetch(
                `http://localhost:8080/aiplat/history/${chatToDelete.id}`,
                {
                    method: "DELETE"
                }
            );

            // Don't update frontend if backend deletion failed
            if (!res.ok) {
                throw new Error("Failed to delete history");
            }


            // Remove deleted item from frontend
            const updated = history.filter(
                (_, i) => i !== index
            );

            setHistory(updated);


            // If deleted chat was selected
            if (selectedChat?.id === chatToDelete.id) {
                setSelectedChat(null);
            }


        } catch (error) {

            console.error("Delete Error:", error);

        }

    };


    // =========================
    // SELECT MODEL
    // =========================

    const selectModel = async (model) => {
        setSelectedModel(model);
        setModelDropdownOpen(false);

        try {

            const res = await authFetch(
                "http://localhost:8080/aiplat/model",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "text/plain"
                    },
                    body: model
                }
            );

            if (!res.ok) {
                throw new Error("Failed to set model");
            }

        } catch (error) {
            console.error("Model Select Error:", error);
        }
    };


    // =========================
    // SEND PROMPT TO API
    // =========================

    const sendToApi = async () => {

        if (!message.trim()) {
            return;
        }


        try {

            setLoading(true);

            const currentPrompt = message;

            const res = await authFetch(
                "http://localhost:8080/aiplat/ask",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain"
                    },
                    body: currentPrompt
                }
            );

            if (!res.ok) {
                throw new Error("Failed to get response");
            }


            const data = await res.text();


            setResponse(data);


            /*
             * IMPORTANT
             *
             * Previously you were doing:
             *
             * const newChat = {
             *     prompt: currentPrompt,
             *     response: data
             * };
             *
             * But that object does NOT contain the database ID.
             *
             * So instead, fetch the history again.
             *
             * The backend has already saved the History object
             * and generated its database ID.
             */

            await fetchHistory();


            setMessage("");


        } catch (error) {

            console.error("Error:", error);

            setResponse(
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };




    // =========================
    // UI
    // =========================

    return (

        <div className="ask-container">


            {/* =========================
                SIDEBAR
            ========================= */}

            <aside
                style={{
                    width: "300px",
                    borderRight: "1px solid #ccc",
                    padding: "15px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden"
                }}
            >

                <h3>History</h3>


                <div
                    style={{
                        flex: 1,
                        overflowY: "auto"
                    }}
                >

                    {history.length === 0 ? (

                        <p>No history found.</p>

                    ) : (

                        history.map((chat, index) => (

                            <div
                                key={chat.id}
                                className="history-entry"
                                onClick={() =>
                                    setSelectedChat(chat)
                                }
                            >

                                <span className="history-entry-text">
                                    {chat.prompt}
                                </span>


                                {/* =========================
                                    MENU
                                ========================= */}

                                <div className="history-menu-wrapper">

                                    <button
                                        className="history-dots-btn"
                                        title="Options"

                                        onClick={(e) => {

                                            e.stopPropagation();

                                            setOpenMenuIndex(
                                                openMenuIndex === index
                                                    ? null
                                                    : index
                                            );

                                        }}
                                    >

                                        &#8942;

                                    </button>


                                    {/* =========================
                                        DELETE DROPDOWN
                                    ========================= */}

                                    {openMenuIndex === index && (

                                        <div
                                            className="history-dropdown"

                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
                                        >

                                            <button
                                                className="history-dropdown-delete"

                                                onClick={(e) => {

                                                    setOpenMenuIndex(null);

                                                    deleteHistory(
                                                        index,
                                                        e
                                                    );

                                                }}
                                            >

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >

                                                    <polyline
                                                        points="3 6 5 6 21 6"
                                                    />

                                                    <path
                                                        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                                                    />

                                                    <path
                                                        d="M10 11v6"
                                                    />

                                                    <path
                                                        d="M14 11v6"
                                                    />

                                                    <path
                                                        d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                                    />

                                                </svg>

                                                Delete

                                            </button>

                                        </div>

                                    )}

                                </div>

                            </div>

                        ))

                    )}

                </div>


                {/* =========================
                    DASHBOARD
                ========================= */}

                <button
                    onClick={() => navigate("/dashboard")}
                    className="sidebar-dashboard-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Dashboard
                </button>


                {/* =========================
                    LOGOUT
                ========================= */}

                <button
                    onClick={logout}
                    className="sidebar-logout-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                </button>

            </aside>


            {/* =========================
                MAIN CONTENT
            ========================= */}

            <main className="ask-main">

                <div className="center">

                    <h2>AI Chat</h2>


                    {/* =========================
                        SELECTED CHAT
                    ========================= */}

                    <div className="chat-history-container">

                        {selectedChat ? (

                            <div>

                                <h4>Prompt</h4>

                                <p
                                    style={{
                                        whiteSpace: "pre-wrap"
                                    }}
                                >
                                    {selectedChat.prompt}
                                </p>


                                <h4>Response</h4>

                                <p
                                    style={{
                                        whiteSpace: "pre-wrap"
                                    }}
                                >
                                    {selectedChat.response}
                                </p>

                            </div>

                        ) : (

                            <p>
                                Select a chat from history.
                            </p>

                        )}

                    </div>


                    {/* =========================
                        LOADING
                    ========================= */}

                    {loading && (
                        <p>
                            Generating response...
                        </p>
                    )}


                    {/* =========================
                        INPUT
                    ========================= */}

                    <div className="input-question-container">

                        {/* Model selector */}
                        <div
                            className="model-selector"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="model-selector-btn"
                                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                                <span>{selectedModel}</span>
                                <svg
                                    className={`model-selector-chevron ${modelDropdownOpen ? "open" : ""}`}
                                    xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {modelDropdownOpen && (
                                <div className="model-dropdown">
                                    {MODELS.map((model) => (
                                        <button
                                            key={model}
                                            className={`model-dropdown-item ${selectedModel === model ? "active" : ""}`}
                                            onClick={() => selectModel(model)}
                                        >
                                            {selectedModel === model && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                            {selectedModel !== model && <span className="model-dropdown-spacer" />}
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="innerDiv">

                            <textarea
                                id="input-question"

                                value={message}

                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }

                                placeholder="Type your question here..."

                                rows="3"
                            />


                            <button
                                onClick={sendToApi}
                                disabled={loading}
                                className="submit-arrow"
                            >

                                Send

                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>

    );

};