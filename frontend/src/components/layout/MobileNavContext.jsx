import { createContext, useContext, useState } from 'react';

const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [open, setOpen] = useState(false);
  const value = {
    open,
    openNav: () => setOpen(true),
    closeNav: () => setOpen(false),
  };
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
