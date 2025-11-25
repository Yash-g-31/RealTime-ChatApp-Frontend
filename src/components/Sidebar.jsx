import { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({
  currentUser,
  selectedUser,
  onSelectUser,
}) {
  const [users, setUsers] = useState([]);
  const [presence, setPresence] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Load user list once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("https://yashgarje31.pythonanywhere.com/api/users/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error loading users", err);
      }
    };

    fetchUsers();
  }, []);

  // Presence polling
  useEffect(() => {
    const token = localStorage.getItem("access");

    const loadPresence = async () => {
      try {
        const res = await axios.get(
          "https://yashgarje31.pythonanywhere.com/api/presence/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const map = {};
        res.data.forEach((u) => {
          map[u.id] = u;
        });
        setPresence(map);
      } catch (err) {
        console.error("Presence error", err);
      }
    };

    loadPresence();
    const interval = setInterval(loadPresence, 3000);

    return () => clearInterval(interval);
  }, []);

  // Unread count polling
  useEffect(() => {
    const token = localStorage.getItem("access");

    const loadUnread = async () => {
      try {
        const res = await axios.get(
          "https://yashgarje31.pythonanywhere.com/api/chat/unread_counts/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let map = {};
        res.data.forEach((u) => {
          map[u.user_id] = u.count;
        });

        setUnreadCounts(map);
      } catch (err) {
        console.error("Unread error", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-100 d-flex flex-column wa-sidebar">
      {/* Sidebar header */}
      <div className="wa-sidebar-header px-3 py-2">
        <div className="fw-semibold">Chats</div>
        <div className="small text-muted">
          Logged in as {currentUser.username}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          className="form-control form-control-sm wa-search-input"
          placeholder="Search or start a new chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Chat list */}
      <div className="flex-grow-1 wa-chat-list">
        {filteredUsers.length === 0 && (
          <div className="text-muted small px-3 mt-2">
            No users found.
          </div>
        )}

        {filteredUsers.length > 0 &&
          filteredUsers.map((user) => {
            const p = presence[user.id];
            const isOnline = p?.online;
            const unread = unreadCounts[user.id] || 0;

            const isActive =
              selectedUser && selectedUser.id === user.id;

            return (
              <div
                key={user.id}
                className={`wa-chat-item ${
                  isActive ? "wa-chat-item-active" : ""
                }`}
                onClick={() => {
                  onSelectUser(user);
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [user.id]: 0,
                  }));
                }}
              >
                <div className="wa-chat-avatar">
                  <span>{user.username[0].toUpperCase()}</span>
                </div>

                <div className="wa-chat-body">

                  <div className="wa-chat-row-top">
                    <span className="wa-chat-name">{user.username}</span>

                    {/* last message time, if available */}
                    {user.last_message_time && (
                      <span className="wa-chat-time">
                        {new Date(user.last_message_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="wa-chat-row-bottom">
                    <span className="wa-chat-last-msg text-muted">
                      {user.last_message && user.last_message.trim().length > 0
                        ? user.last_message
                        : "No messages yet"}
                    </span>
                  </div>


                </div>

                <div className="wa-chat-meta">
                  <div className="wa-chat-status-dot-wrapper">
                    <span
                      className={`wa-status-dot ${
                        isOnline ? "wa-status-dot-online" : ""
                      }`}
                    ></span>
                  </div>

                  {unread > 0 && (
                    <span className="wa-unread-badge">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
