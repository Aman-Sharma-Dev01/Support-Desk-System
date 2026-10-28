import React from 'react';

export function StatusBadge({ status }) {
  const configs = {
    Open: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
    Assigned: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
    'In Progress': { bg: '#fef3c7', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
    'Waiting on Customer': { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff', dot: '#a855f7' },
    Resolved: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  };

  const style = configs[status] || { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', dot: '#9ca3af' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.dot,
        }}
      />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const configs = {
    Urgent: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Urgent' },
    High: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'High' },
    Medium: { bg: '#fefce8', text: '#a16207', border: '#fef08a', label: 'Medium' },
    Low: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Low' },
  };

  const style = configs[priority] || { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: priority };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const configs = {
    Admin: { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
    Agent: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    User: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  };
  const style = configs[role] || { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {role}
    </span>
  );
}
