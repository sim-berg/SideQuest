import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative h-full w-full bg-white dark:bg-slate-900">
      {children}
    </div>
  );
}
