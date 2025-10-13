// src/pages/auth/RestoreEmail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRestoreEmailMutation } from '../../features/auth/authApiSlice';
import '../../styles/auth-forms.css';

export default function RestoreEmail(){
  const qp = useMemo(()=>new URLSearchParams(window.location.search),[]);
  const id    = qp.get('id')   || '';
  const role  = (qp.get('role') || '').toLowerCase();
  const token = qp.get('token')|| '';

  const [restoreEmail, { isLoading }] = useRestoreEmailMutation();
  const [status, setStatus] = useState({ kind: 'idle', msg: '' }); // idle|ok|err
  const [autoTried, setAutoTried] = useState(false);

  const canSubmit = Boolean(id && role && token);

  const onRestore = async ()=>{
    if (!canSubmit) {
      setStatus({ kind: 'err', msg: 'Missing or invalid link parameters.' });
      return;
    }
    setStatus({ kind: 'idle', msg: '' });
    try{
      const res = await restoreEmail({ id, role, token }).unwrap();
      setStatus({ kind: 'ok', msg: res?.message || 'Previous email restored.' });
    }catch(err){
      setStatus({ kind: 'err', msg: err?.data?.message || 'Restore failed.' });
    }
  };

  // Optional: auto-trigger once if all params are present (keeps button for retry)
  useEffect(() => {
    if (!autoTried && canSubmit) {
      setAutoTried(true);
      onRestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit]);

  return (
    <div className="container auth-wrap">
      <div className="auth-card" style={{padding:'2.25rem'}}>
        <div className="d-flex align-items-center mb-2" style={{gap:12}}>
          <div style={{
            width:40,height:40,borderRadius:10,
            display:'grid',placeItems:'center',
            background:'rgba(108,92,231,.12)',border:'1px solid rgba(108,92,231,.35)'
          }}>
            <span className="text-light" style={{fontWeight:700}}>↩</span>
          </div>
          <div>
            <h1 className="auth-title text-white m-0">Restore previous email</h1>
            <p className="auth-sub text-secondary m-0">Use this link if the email change wasn’t you.</p>
          </div>
        </div>

        {/* Params summary */}
        <div className="small auth-muted mb-3">
          <span className="me-3"><b>Role:</b> {role || '—'}</span>
          <span className="me-3"><b>ID:</b> {id ? (id.slice(0,4)+'…'+id.slice(-4)) : '—'}</span>
          <span><b>Token:</b> {token ? token.slice(0,6)+'…' : '—'}</span>
        </div>

        {/* Alert */}
        {status.kind === 'ok' && (
          <div className="alert alert-success py-2 small" role="alert">
            {status.msg}
          </div>
        )}
        {status.kind === 'err' && (
          <div className="alert alert-danger py-2 small" role="alert">
            {status.msg}
          </div>
        )}

        {/* Action */}
        <div className="d-flex align-items-center gap-2 mt-2">
          <button
            className="btn btn-primary btn-wide"
            onClick={onRestore}
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? 'Restoring…' : 'Restore now'}
          </button>

          <a href="/" className="btn btn-outline-light">Go home</a>
        </div>

        {/* Hints */}
        <div className="auth-muted small mt-3">
          If this link expired, request a new one from the security email you received or contact support.
        </div>
      </div>
    </div>
  );
}
