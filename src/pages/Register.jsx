import { useState } from "react";
import axios from "axios";

export default function Register({ onRegistered, onShowLogin, onShowContact }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    secret: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "https://yashgarje31.pythonanywhere.com/api/register-x92jf03/", 
        form
      );

      setSuccess("Account created successfully. You can now log in.");
      setForm({ username: "", email: "", password: "", secret: "" });

      // Optional: auto-switch to login after a delay
      setTimeout(() => {
        onRegistered && onRegistered();
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.detail ||
            JSON.stringify(err.response.data)
        );
      } else {
        setError("Registration failed. Check fields and secret code.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "380px" }}>
        <h3 className="text-center mb-3">Register</h3>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              name="username"
              type="text"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email (optional)</label>
            <input
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Secret Code <span className="text-danger">*</span>
            </label>
            <input
              name="secret"
              type="text"
              className="form-control"
              value={form.secret}
              onChange={handleChange}
              required
            />
            <div className="form-text">
              Ask the admin to get this code.
            </div>
          </div>

          <button className="btn btn-primary w-100 mb-2">Register</button>
        </form>

        <div className="d-flex justify-content-between mt-2">
          <button
            className="btn btn-link p-0"
            onClick={onShowLogin}
          >
            Already have an account? Login
          </button>
          <button
            className="btn btn-link p-0"
            onClick={onShowContact}
          >
            Don&apos;t know secret code? Contact
          </button>
        </div>
      </div>
    </div>
  );
}
