import React, { useState } from "react";

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    let isValid = true;

    const formattedEmail = email.trim().toLowerCase();
    const isGmail = formattedEmail.endsWith("@gmail.com");
    const isMailRu = formattedEmail.endsWith("@mail.ru");

    // Валидация Email
    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!isGmail && !isMailRu) {
      setEmailError("Email must end with @gmail.com or @mail.ru");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Валидация Пароля
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    } else {
      setPasswordError("");
    }

   
    if (isValid) {
      setEmail("");
      setPassword("");
      setEmailError("");
      setPasswordError("");
      onClose();
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Sign In</h2>

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`modal-input ${emailError ? "input-error" : ""}`}
            />
            {emailError && <span className="error-text">{emailError}</span>}
          </div>

          <div className="form-group password-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`modal-input ${passwordError ? "input-error" : ""}`}
            />
            {passwordError && (
              <span className="error-text">{passwordError}</span>
            )}
          </div>

          <button type="submit" className="btn-black modal-submit-btn">
            Login
          </button>
        </form>

        <button onClick={handleClose} className="modal-close-btn">
          ✕
        </button>
      </div>
    </div>
  );
}
