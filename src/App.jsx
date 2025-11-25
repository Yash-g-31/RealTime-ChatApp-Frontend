import { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access")
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [authView, setAuthView] = useState("login"); // 'login' | 'register' | 'contact'

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load current user when logged in
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!loggedIn) {
        setCurrentUser(null);
        setLoadingUser(false);
        return;
      }

      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("https://yashgarje31.pythonanywhere.com/api/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error loading current user", err);
        // token invalid -> logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, [loggedIn]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setLoggedIn(false);
    setCurrentUser(null);
    setSelectedUser(null);
    setAuthView("login");
  };

  // Handle window resize for mobile / desktop layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // AUTH SCREENS
  if (!loggedIn) {
    if (authView === "register") {
      return (
        <Register
          onRegistered={() => setAuthView("login")}
          onShowLogin={() => setAuthView("login")}
          onShowContact={() => setAuthView("contact")}
        />
      );
    }

    if (authView === "contact") {
      return (
        <Contact onBackToLogin={() => setAuthView("login")} />
      );
    }

    return (
      <Login
        onLogin={() => setLoggedIn(true)}
        onShowRegister={() => setAuthView("register")}
        onShowContact={() => setAuthView("contact")}
      />
    );
  }

  if (loadingUser || !currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <span>Loading...</span>
      </div>
    );
  }

  // MAIN LAYOUT
  return (
    <div className="app-container d-flex flex-column">
      {/* Top bar */}
      <nav className="navbar navbar-light bg-white border-bottom px-3">
        <span className="navbar-brand mb-0 h5">Realtime Chat</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">
            Logged in as <strong>{currentUser.username}</strong>
          </span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main area */}
      {isMobile ? (
        // ===== MOBILE: either sidebar OR chat, full width =====
        <div className="flex-grow-1">
          {showSidebar ? (
            <Sidebar
              currentUser={currentUser}
              selectedUser={selectedUser}
              onSelectUser={(user) => {
                setSelectedUser(user);
                setShowSidebar(false);
              }}
              isMobile={isMobile}
            />
          ) : (
            <ChatWindow
              currentUser={currentUser}
              otherUser={selectedUser}
              isMobile={isMobile}
              onBack={() => setShowSidebar(true)}
            />
          )}
        </div>
      ) : (
        // ===== DESKTOP: sidebar + chat side by side =====
        <div className="container-fluid flex-grow-1">
          <div className="row h-100">
            <div className="col-12 col-md-4 col-lg-3 p-0 border-end">
              <Sidebar
                currentUser={currentUser}
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
                isMobile={false}
              />
            </div>
            <div className="col-12 col-md-8 col-lg-9 p-0 bg-light">
              <ChatWindow
                currentUser={currentUser}
                otherUser={selectedUser}
                isMobile={false}
                onBack={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
