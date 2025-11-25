import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin, onShowRegister, onShowContact }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("https://yashgarje31.pythonanywhere.com/api/login/", {
        username,
        password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      onLogin();
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h3 className="text-center mb-3">Login</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary w-100">Login</button>
        </form>

        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-link p-0"
            onClick={onShowRegister}
          >
            New user? Register
          </button>

          
        </div>
      </div>
    </div>
  );
}
