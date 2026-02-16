import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative h-full w-full bg-cyber-light-bg dark:bg-cyber-bg">
      {children}
    </div>
  );
}
