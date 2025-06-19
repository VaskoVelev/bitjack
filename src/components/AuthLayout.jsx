import "../styles/Auth.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-container">
      <div className="auth-overlay auth-card">{children}</div>
    </div>
  );
}
