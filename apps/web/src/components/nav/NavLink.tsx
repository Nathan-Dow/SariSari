'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  iconFilled?: boolean;
}

export function NavLink({ href, icon, label, iconFilled }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex items-center px-6 py-3 rounded-r-full transition-colors duration-200 cursor-pointer',
          isActive
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-highest font-medium'
        )}
      >
        <span
          className="material-symbols-outlined mr-4"
          style={isActive || iconFilled
            ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
            : undefined}
        >
          {icon}
        </span>
        <span className="font-body-md text-body-md">{label}</span>
      </Link>
    </li>
  );
}
