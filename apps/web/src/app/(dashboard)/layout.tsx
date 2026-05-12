import Link from 'next/link';
import { NavLink } from '@/components/nav/NavLink';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/catalog', icon: 'inventory', label: 'Product Catalog' },
  { href: '/margin', icon: 'payments', label: 'Margin Manager' },
  { href: '/inventory', icon: 'history_edu', label: 'Inventory Logs' },
  { href: '/staff', icon: 'terminal', label: 'Staff Terminal' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — Desktop */}
      <nav className="hidden md:flex flex-col h-screen w-72 fixed left-0 top-0 bg-surface-container border-r border-outline-variant py-gutter-desktop z-20">
        <div className="px-6 mb-8">
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">
            Management Console
          </span>
        </div>
        <ul className="flex-1 pr-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </ul>
        <ul className="pr-4 pb-4">
          <NavLink href="/settings" icon="settings" label="Settings" />
        </ul>
      </nav>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72 h-screen overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-gutter-mobile md:px-margin-desktop w-full h-16 bg-surface border-b border-outline-variant z-10 shrink-0">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-on-surface-variant cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link href="/dashboard">
              <h2 className="font-headline-lg text-headline-lg font-bold text-primary">Omega POS</h2>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="flex items-center hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer active:opacity-80 gap-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant hidden sm:block">User Profile</span>
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      {/* Bottom Nav — Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-outline-variant rounded-t-xl">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer">
          <span className="material-symbols-outlined mb-1 text-[24px]">analytics</span>
          <span className="font-label-mono text-label-mono">Stats</span>
        </Link>
        <Link href="/catalog" className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer">
          <span className="material-symbols-outlined mb-1 text-[24px]">inventory_2</span>
          <span className="font-label-mono text-label-mono">Catalog</span>
        </Link>
        <Link href="/margin" className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer">
          <span className="material-symbols-outlined mb-1 text-[24px]">payments</span>
          <span className="font-label-mono text-label-mono">Margins</span>
        </Link>
        <Link href="/inventory" className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 cursor-pointer">
          <span className="material-symbols-outlined mb-1 text-[24px]">history_edu</span>
          <span className="font-label-mono text-label-mono">Logs</span>
        </Link>
      </nav>
    </div>
  );
}
