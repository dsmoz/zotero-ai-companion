import React from 'react';

interface Props { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; }

export function Toggle({ checked, onChange, disabled = false }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        background: disabled ? '#313244' : checked ? '#a6e3a1' : '#45475a',
        border: 'none', borderRadius: 10, width: 34, height: 18,
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        width: 14, height: 14, background: 'white', borderRadius: '50%',
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        transition: 'left 0.15s',
      }} />
    </button>
  );
}
