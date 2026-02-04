import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="animate-fade-in">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}