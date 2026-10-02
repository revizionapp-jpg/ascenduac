import React from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNavCTA } from '@/components/BottomNavCTA';

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-ink-primary">
      <Navbar />
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNavCTA />
    </div>
  );
}
