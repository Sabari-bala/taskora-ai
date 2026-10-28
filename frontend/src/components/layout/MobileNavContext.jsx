import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openNav = useCallback(() => setOpen(true), []);
  const closeNav = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openNav, closeNav }),
    [open, openNav, closeNav]
  );

  return (
    <MobileNavContext.Provider value={value}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error('useMobileNav must be used inside <MobileNavProvider>');
  return ctx;
}
