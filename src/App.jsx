import { useEffect, useRef, useState } from "react";

const App = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    // Save previous conversation BEFORE adding current message

    const previousHistory = [...messages];

    // Add user message + empty assistant message together
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/ai/support/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            history: previousHistory,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      if (!response.body) {
        throw new Error("Streaming is not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        assistantText += chunk;

        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };

          return updated;
        });
      }
    } catch (error) {
      console.error("Frontend error:", error);

      setMessages((prev) => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong.",
        };

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          AI Customer Support
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Ask us anything about your order or service.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex min-h-125 flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-3 text-4xl">💬</div>

                <h2 className="text-lg font-semibold text-gray-700">
                  How can we help?
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Ask a question to get started.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content ? (
                  msg.content
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">AI</span>

                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
       <div className="mt-5 flex items-end gap-3 border-t border-gray-100 pt-5">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask customer support..."
            disabled={loading}
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          />

          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="min-w-20 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:active:scale-100"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
