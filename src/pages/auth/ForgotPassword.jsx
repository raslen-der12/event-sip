// src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useForgotPasswordMutation } from '../../features/auth/authApiSlice';
import '../../styles/auth-forms.css';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [forgotPassword, { isLoading, isSuccess, isError, error }] = useForgotPasswordMutation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try{
      const res = await forgotPassword({ email }).unwrap();
      setMsg(res?.message || 'If the email exists, a reset link has been sent.');
    }catch(err){
      setMsg(err?.data?.message || 'If the email exists, a reset link has been sent.');
    }
  };

  return (
    <div className="container auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title text-white">Forgot password</h1>
        <p className="auth-sub text-secondary">Enter your email to receive a reset link.</p>
        <form onSubmit={onSubmit} className="vstack gap-3">
          <input
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <button className="btn btn-primary btn-wide" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
          {(isSuccess || isError || msg) && (
            <div className="auth-muted small">{msg}</div>
          )}
        </form>
      </div>
    </div>
  );
}
