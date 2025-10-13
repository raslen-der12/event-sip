// src/pages/auth/ResetPassword.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useResetPasswordMutation } from '../../features/auth/authApiSlice';
import '../../styles/auth-forms.css';

export default function ResetPassword(){
  const qp = useMemo(()=>new URLSearchParams(window.location.search),[]);
  const id    = (qp.get('id')    || '').trim();
  const role  = (qp.get('role')  || '').trim().toLowerCase();
  const token = (qp.get('token') || '').trim();

  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [status, setStatus] = useState({ kind:'idle', msg:'' }); // idle|ok|err
  const [autoTried, setAutoTried] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const canSubmit = Boolean(id && role && token && pwd && pwd2 && pwd.length >= 8 && pwd === pwd2);

  const doReset = async () => {
    setStatus({ kind:'idle', msg:'' });
    try {
      const res = await resetPassword({ id, role, token, pwd }).unwrap();
      setStatus({ kind:'ok', msg: res?.message || 'Password updated.' });
      setPwd(''); setPwd2('');
    } catch (err) {
      setStatus({ kind:'err', msg: err?.data?.message || 'Error updating password.' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!id || !role || !token) {
      setStatus({ kind:'err', msg: 'Invalid or incomplete reset link.' });
      return;
    }
    if (pwd.length < 8 || pwd !== pwd2) {
      setStatus({ kind:'err', msg: 'Passwords must match (min 8 chars).' });
      return;
    }
    await doReset();
  };

  // If everything is present but there’s no password yet, don’t auto-fire.
  // If you want auto-fire (not recommended here), you could call doReset() when pwd is set.

  return (
    <div className="container auth-wrap">
      <div className="auth-card" style={{padding:'2.25rem'}}>
        <div className="d-flex align-items-center mb-2" style={{gap:12}}>
          <div style={{
            width:40,height:40,borderRadius:10,
            display:'grid',placeItems:'center',
            background:'rgba(108,92,231,.12)',border:'1px solid rgba(108,92,231,.35)'
          }}>
            <span className="text-light" style={{fontWeight:700}}>🔑</span>
          </div>
          <div>
            <h1 className="auth-title text-white m-0">Set a new password</h1>
            <p className="auth-sub text-secondary m-0">Use a strong password (min 8 characters).</p>
          </div>
        </div>

        <div className="small auth-muted mb-3">
          <span className="me-3"><b>Role:</b> {role || '—'}</span>
          <span className="me-3"><b>ID:</b> {id ? (id.slice(0,4)+'…'+id.slice(-4)) : '—'}</span>
          <span><b>Token:</b> {token ? token.slice(0,6)+'…' : '—'}</span>
        </div>

        {status.kind === 'ok' && (
          <div className="alert alert-success py-2 small" role="alert">
            {status.msg} You can now <a href="/login" className="alert-link">log in</a>.
          </div>
        )}
        {status.kind === 'err' && (
          <div className="alert alert-danger py-2 small" role="alert">
            {status.msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="vstack gap-3 mt-2">
          <input
            type="password"
            className="form-control"
            placeholder="New password"
            value={pwd}
            onChange={(e)=>setPwd(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            className="form-control"
            placeholder="Confirm password"
            value={pwd2}
            onChange={(e)=>setPwd2(e.target.value)}
            autoComplete="new-password"
          />
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-wide" disabled={isLoading || !id || !role || !token}>
              {isLoading ? 'Saving…' : 'Save'}
            </button>
            <a href="/" className="btn btn-outline-light">Go home</a>
          </div>
        </form>
      </div>
    </div>
  );
}
