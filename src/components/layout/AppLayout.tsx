import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KeyboardShortcutsModal } from '../modals/KeyboardShortcutsModal';
import { HeldCartsModal } from '../modals/HeldCartsModal';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [heldCartsOpen, setHeldCartsOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Global Keyboard Navigation Handlers
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // F1: Product search
      if (e.key === 'F1') {
        e.preventDefault();
        if (location.pathname !== '/billing') {
          navigate('/billing');
        }
        const searchInput = document.querySelector<HTMLInputElement>('input[data-search-input="true"]');
        searchInput?.focus();
      }

      // F8: Held carts
      if (e.key === 'F8') {
        e.preventDefault();
        setHeldCartsOpen((prev) => !prev);
      }

      // F10 or ?
      if (e.key === 'F10' || (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }

      // Esc: Close any active modal
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setHeldCartsOpen(false);
      }
    },
    [location.pathname, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenHeldCarts={() => setHeldCartsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <HeldCartsModal
        isOpen={heldCartsOpen}
        onClose={() => setHeldCartsOpen(false)}
      />
    </div>
  );
};
