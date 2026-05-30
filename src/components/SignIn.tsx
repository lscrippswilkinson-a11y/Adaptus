import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/state/AuthContext'

/** Full-screen gate shown when Supabase is configured but no one is signed in. */
export function SignIn() {
  const { signInWithGoogle } = useAuth()
  return (
    <div className="cq-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div
        style={{
          width: '420px',
          maxWidth: '100%',
          background: 'radial-gradient(620px 340px at 85% -20%, rgba(255,255,255,0.14), transparent 60%), linear-gradient(120deg, #3e6079 0%, #2c4a60 100%)',
          borderRadius: '18px',
          padding: '44px 40px',
          boxShadow: '0 12px 32px rgba(20,40,55,0.28)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={30} color="#fff" />
          </div>
        </div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>Adaptus</h1>
        <p style={{ margin: '8px 0 28px', fontSize: '14px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
          Sign in to access your change projects and collaborate with your team.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', background: '#fff', color: '#2c4a60', border: 'none', borderRadius: '10px', padding: '13px 20px', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
        >
          <GoogleMark /> Continue with Google
        </button>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}
