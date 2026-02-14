import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative h-full w-full bg-parchment-light dark:bg-medieval-bg">
      {children}
    </div>
  );
}
