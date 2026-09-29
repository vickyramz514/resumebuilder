import { useId } from 'react';

export function BrandLogo({ size = 30 }: { size?: number }) {
  const id = `rf-${useId().replace(/:/g, '')}`;
  return (
    <svg className="brand-logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="0.48" stopColor="#0d9488" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path fill="#fff" d="M9.2 8.2h8.4l4.2 4.1v11.6a1.6 1.6 0 0 1-1.6 1.6H9.2a1.6 1.6 0 0 1-1.6-1.6V9.8a1.6 1.6 0 0 1 1.6-1.6z" />
      <path fill="#ddd6fe" d="M17.6 8.2v3.5c0 .5.4.9.9.9h3.3z" />
      <path stroke="#0f766e" strokeWidth="1.35" strokeLinecap="round" d="M11 16.4h7.6M11 19.3h5.8M11 22.2h4" />
      <path fill="#fde68a" d="M23.6 5.4 24.2 7l1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
    </svg>
  );
}
