import { useEffect, useRef, useState } from "react";
import axios from "axios";

// Format "last seen" text
function formatLastSeen(isoString) {
  if (!isoString) return "";
  const last = new Date(isoString);
  const now = new Date();
  const diffMs = now - last;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "a few seconds ago";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

// Format per-message time like "10:45 AM"
function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export default function ChatWindow({ currentUser, otherUser, isMobile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const lastMessageIdRef = useRef(null);

  const [blockInfo, setBlockInfo] = useState({
    blockedByMe: false,
    blockedMe: false,
  });

  const [presence, setPresence] = useState(null);

  // Load messages + block status + presence when otherUser changes
  useEffect(() => {
    if (!otherUser) {
      setMessages([]);
      lastMessageIdRef.current = null;
      setBlockInfo({ blockedByMe: false, blockedMe: false });
      setPresence(null);
      return;
    }

    const token = localStorage.getItem("access");

    const fetchBlockStatus = async () => {
      try {
        const res = await axios.get(
          `https://yashgarje31.pythonanywhere.com/api/chat/block/status/?user_id=${otherUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBlockInfo({
          blockedByMe: res.data.blocked_by_me,
          blockedMe: res.data.blocked_me,
        });
      } catch (err) {
        console.error("Error loading block status", err);
      }
    };

    const fetchMessages = async () => {
      try {
        const url = `https://yashgarje31.pythonanywhere.com/api/chat/messages/?user_id=${otherUser.id}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allMessages = res.data;
        setMessages(allMessages);

        if (allMessages.length > 0) {
          lastMessageIdRef.current =
            allMessages[allMessages.length - 1].id;
        }
      } catch (err) {
        console.error("Error loading messages", err);
      }
    };

    const fetchPresence = async () => {
      try {
        const res = await axios.get(
          "https://yashgarje31.pythonanywhere.com/api/presence/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userPresence = res.data.find(
          (u) => u.id === otherUser.id
        );
        if (userPresence) {
          setPresence(userPresence);
        }
      } catch (err) {
        console.error("Error loading presence", err);
      }
    };

    const initialLoad = async () => {
      setMessages([]);
      lastMessageIdRef.current = null;
      await fetchMessages();
      await fetchBlockStatus();
      await fetchPresence();
    };

    initialLoad();

    const messagesInterval = setInterval(fetchMessages, 1000); // 1s polling
    const presenceInterval = setInterval(fetchPresence, 5000); // 5s presence

    return () => {
      clearInterval(messagesInterval);
      clearInterval(presenceInterval);
    };
  }, [otherUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !otherUser) return;

    if (blockInfo.blockedByMe || blockInfo.blockedMe) {
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const res = await axios.post(
        "https://yashgarje31.pythonanywhere.com/api/chat/messages/",
        {
          receiver: otherUser.id,
          content: text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newMsg = res.data;
      setMessages((prev) => [...prev, newMsg]);
      lastMessageIdRef.current = newMsg.id;
      setText("");
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleBlockToggle = async () => {
    if (!otherUser) return;

    const token = localStorage.getItem("access");

    try {
      if (!blockInfo.blockedByMe) {
        await axios.post(
          "https://yashgarje31.pythonanywhere.com/api/chat/block/",
          { user_id: otherUser.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBlockInfo((prev) => ({ ...prev, blockedByMe: true }));
      } else {
        await axios.delete(
          `https://yashgarje31.pythonanywhere.com/api/chat/block/?user_id=${otherUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBlockInfo((prev) => ({ ...prev, blockedByMe: false }));
      }
    } catch (err) {
      console.error("Error toggling block", err);
    }
  };

  if (!otherUser) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 wa-chat-empty">
        <div className="text-muted">
          Select a chat on the left to start messaging.
        </div>
      </div>
    );
  }

  // Status text in header
  let statusText = "";
  const inputDisabled = blockInfo.blockedByMe || blockInfo.blockedMe;

  if (blockInfo.blockedByMe) {
    statusText = "You blocked this user";
  } else if (blockInfo.blockedMe) {
    statusText = "This user has blocked you";
  } else if (presence?.online) {
    statusText = "Online";
  } else if (presence?.last_seen) {
    statusText = `Last seen ${formatLastSeen(presence.last_seen)}`;
  } else {
    statusText = "Offline";
  }

  return (
    <div className="d-flex flex-column h-100 chat-window-whatsapp">
      {/* Header */}
      <div className="wa-header d-flex align-items-center px-3 py-2">
        {isMobile && (
          <button
            type="button"
            className="btn btn-sm btn-link text-white me-2"
            onClick={onBack}
          >
            ←
          </button>
        )}

        <div className="wa-avatar me-2">
          <span>{otherUser.username[0].toUpperCase()}</span>
        </div>
        <div className="flex-grow-1">
          <div className="wa-header-name">{otherUser.username}</div>
          <div className="wa-header-status">{statusText}</div>
        </div>

        {!blockInfo.blockedMe && (
          <button
            className="btn btn-sm btn-outline-light wa-block-btn"
            onClick={handleBlockToggle}
          >
            {blockInfo.blockedByMe ? "Unblock" : "Block"}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-grow-1 wa-messages-wrapper">
        <div className="chat-messages">
          {messages.map((msg) => {
            const isMine = msg.sender === currentUser.id;
            const timeStr = formatTime(msg.timestamp);
            const isRead = msg.is_read;

            // ✓✓ grey = delivered, ✓✓ blue = seen
            const tickText = "✓✓";
            const tickClass = isRead
              ? "wa-tick wa-tick-seen"
              : "wa-tick wa-tick-delivered";

            return (
              <div
                key={msg.id}
                className={`wa-message-row ${
                  isMine ? "wa-message-row-out" : "wa-message-row-in"
                }`}
              >
                <div
                  className={`wa-message-bubble ${
                    isMine ? "wa-bubble-out" : "wa-bubble-in"
                  }`}
                >
                  <div className="wa-message-text">{msg.content}</div>
                  <div className="wa-message-meta">
                    <span className="wa-message-time">{timeStr}</span>
                    {isMine && (
                      <span className={tickClass}>{tickText}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form className="wa-input-row" onSubmit={handleSend}>
        <input
          type="text"
          className="form-control wa-input"
          placeholder={
            inputDisabled
              ? "You can't send messages in this chat"
              : "Type a message"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={inputDisabled}
        />
        <button
          className="btn wa-send-btn"
          disabled={inputDisabled}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
