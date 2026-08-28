import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.26 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.31 14.32A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.4-2.32V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.3 5.41z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.59l4.01 3.09C6.25 6.87 8.89 4.77 12 4.77z" />
    </svg>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, htmlFor, required, children, hint }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-cyber text-xs text-white/40 tracking-widest mb-2 uppercase">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-white/35 font-inter">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-red-400/80 text-xs font-inter border border-red-500/20 bg-red-950/10 px-4 py-3 rounded">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-emerald-400/80 text-xs font-inter border border-emerald-500/20 bg-emerald-950/10 px-4 py-3 rounded">
      {message}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordField({ id, value, onChange, placeholder, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input-cyber pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
