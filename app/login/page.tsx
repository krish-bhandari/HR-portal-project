"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Login failed: " + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background grid pattern */}
      <div className="login-bg-pattern" />

      {/* Glow orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <span>R</span>
          </div>
          <div>
            <h1 className="login-title">RISE Research</h1>
            <p className="login-tagline">HR Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <h2 className="login-card-heading">Welcome back</h2>
          <p className="login-card-sub">
            Sign in with your RISE Research Google account to continue.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-google"
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>

          <p className="login-footer-note">
            Access restricted to <strong>@riseresearch.in</strong> accounts
          </p>
        </div>

        {/* Footer */}
        <p className="login-copyright">
          © {new Date().getFullYear()} RISE Research. Internal use only.
        </p>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: var(--bg-base);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 1rem;
        }

        .login-bg-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .login-orb-1 {
          width: 400px;
          height: 400px;
          background: rgba(212,175,55,0.08);
          top: -100px;
          right: -100px;
        }

        .login-orb-2 {
          width: 300px;
          height: 300px;
          background: rgba(0,35,102,0.4);
          bottom: -80px;
          left: -80px;
        }

        .login-container {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          width: 100%;
          max-width: 420px;
        }

        .login-logo-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--rise-gold) 0%, var(--rise-gold-dark) 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #000;
          box-shadow: 0 8px 24px rgba(212,175,55,0.3);
        }

        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .login-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 2px;
        }

        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--bg-border-light);
          border-radius: 20px;
          padding: 2.5rem;
          width: 100%;
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.3s ease;
        }

        .login-card-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .login-card-sub {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: var(--bg-elevated);
          border: 1px solid var(--bg-border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          margin-bottom: 1.5rem;
        }

        .btn-google:hover:not(:disabled) {
          background: var(--bg-card-hover);
          border-color: var(--rise-gold);
          box-shadow: 0 0 20px rgba(212,175,55,0.15);
          transform: translateY(-1px);
        }

        .btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(212,175,55,0.3);
          border-top-color: var(--rise-gold);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .login-footer-note {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
        }

        .login-footer-note strong {
          color: var(--text-secondary);
        }

        .login-copyright {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
