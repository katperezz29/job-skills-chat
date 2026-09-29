import { useState, useRef, useEffect } from "react";
import "./App.css";
// replaced file logo with CSS gradient GC logo
import avatar from "./assets/avatar.svg";
import assistantAvatar from "./assets/assistant.svg";
import userAvatar from "./assets/user-avatar.svg";
import resumeThumb from "./assets/resume-thumb.svg";

export default function App() {
  const [page, setPage] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome, Alex! Ready to polish your profile. How can I help today?",
    },
    {
      role: "user",
      content:
        "Can you review my resume? I'm applying for Junior Marketing roles.",
    },
    {
      role: "assistant",
      content: "Great! Please upload it. I'll provide feedback.",
    },
    {
      role: "assistant",
      card: true,
      cardData: {
        title: "Marketing Resume - Alex Chen.pdf",
        checks: [
          { label: "Summary", state: "ok" },
          {
            label: "Experience",
            state: "warn",
            note: "Add quantified metrics to 'Increased engagement'",
          },
          { label: "Education", state: "ok" },
        ],
        insight:
          "Resume Insights (4): Quantify achievements, enhance action verbs, refine skills.",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([
        ...updated,
        { role: "assistant", content: data.reply, sources: data.sources },
      ]);
    } catch (err) {
      setMessages([
        ...updated,
        { role: "assistant", content: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat app-root">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="logo-gc">GC</div>
            <div className="title">GradCoach AI</div>
          </div>
          <div className="header-right">
            <nav className="nav">
              <button
                className={page === "dashboard" ? "active" : ""}
                onClick={() => setPage("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={page === "resume" ? "active" : ""}
                onClick={() => setPage("resume")}
              >
                My Resume
              </button>
              <button
                className={page === "interview" ? "active" : ""}
                onClick={() => setPage("interview")}
              >
                Interview Prep
              </button>
              <button
                className={page === "chat" ? "active" : ""}
                onClick={() => setPage("chat")}
              >
                Chat
              </button>
            </nav>
          </div>
          <div className="tools">
            <img src={avatar} alt="profile" className="avatar" />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="grid">
          <main className="chat-column">
            <div className="panel chat-panel">
              {page === "chat" && (
                <>
                  <div className="chat-header">
                    <div className="assistant-info">
                      <img
                        src={avatar}
                        alt="assistant"
                        className="assistant-avatar"
                      />
                      <div>
                        <div className="assistant-name">GradCoach AI</div>
                        <div className="assistant-sub">
                          Welcome, Alex! Ready to polish your profile.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="resume-preview">
                    <img
                      src={resumeThumb}
                      alt="resume"
                      className="resume-thumb"
                    />
                    <div className="resume-meta">
                      <div className="resume-title">
                        Marketing Resume - Alex Chen.pdf
                      </div>
                      <ul className="resume-checks">
                        <li>
                          <span className="check green">✔</span> Summary
                        </li>
                        <li>
                          <span className="check orange">●</span> Experience —
                          Add quantified metrics to "Increased engagement"
                        </li>
                        <li>
                          <span className="check green">✔</span> Education
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="messages">
                    {messages.map((m, i) => (
                      <div key={i} className={`message-row ${m.role}`}>
                        {m.role === "assistant" && (
                          <img
                            src={assistantAvatar}
                            alt="assistant"
                            className="msg-avatar left"
                          />
                        )}

                        <div
                          className={`bubble ${m.role} ${m.card ? "card" : ""}`}
                        >
                          {!m.card ? (
                            <>{m.content}</>
                          ) : (
                            <div className="resume-card">
                              <div className="resume-card-left">
                                <img src={resumeThumb} alt="resume" />
                              </div>
                              <div className="resume-card-right">
                                <div className="rc-title">
                                  {m.cardData.title}
                                </div>
                                <ul className="rc-checks">
                                  {m.cardData.checks.map((c, idx) => (
                                    <li key={idx} className={c.state}>
                                      <span className="rc-symbol">
                                        {c.state === "ok" ? "✔" : "⚠"}
                                      </span>
                                      <span className="rc-label">
                                        {c.label}
                                      </span>
                                      {c.note && (
                                        <span className="rc-note">
                                          {" "}
                                          — {c.note}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <div className="rc-insight">
                                  {m.cardData.insight}
                                </div>
                              </div>
                            </div>
                          )}

                          {m.sources?.length > 0 && (
                            <div className="sources">
                              Sources: {m.sources.join(", ")}
                            </div>
                          )}
                        </div>

                        {m.role === "user" && (
                          <div className="user-meta">
                            <div className="user-name">Alex</div>
                            <img
                              src={userAvatar}
                              alt="you"
                              className="msg-avatar right"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="bubble assistant">Thinking...</div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="input-row">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message..."
                    />
                    <button onClick={sendMessage} disabled={loading}>
                      ➤
                    </button>
                  </div>
                </>
              )}

              {page === "dashboard" && (
                <div className="page-content">
                  <h3>Dashboard</h3>
                  <p>
                    Welcome to GradCoach — quick actions, recent chats, and
                    recommended articles will appear here.
                  </p>
                </div>
              )}

              {page === "resume" && (
                <div className="page-content">
                  <h3>My Resume</h3>
                  <p>Upload or edit your resume here. (Placeholder content)</p>
                </div>
              )}

              {page === "interview" && (
                <div className="page-content">
                  <h3>Interview Prep</h3>
                  <p>Practice STAR stories, common questions, and tips.</p>
                </div>
              )}
            </div>
          </main>

          <aside className="sidebar">
            <div className="panel tips">
              <h4>First-Job Interview Tips</h4>
              {[
                {
                  title: "Research Company",
                  items: ["Research Company", "Practice Interview"],
                },
                {
                  title: "Practice STAR Method",
                  items: ["Practice STAR Method", "Increased Engagement"],
                },
                {
                  title: "Prepare Questions",
                  items: ["Prepare Questions", "Practice Questions"],
                },
                {
                  title: "Professional Attire",
                  items: ["Professional Requirements"],
                },
              ].map((card, i) => (
                <div className="tip-card" key={i}>
                  <div className="tip-card-title">{card.title}</div>
                  <ul>
                    {card.items.map((it, idx) => (
                      <li key={idx}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
