'use client';

import { useState } from 'react';
import { LayoutDashboard, Package, Search, Plus, Users, LogOut, ShieldCheck, User, Menu, X, UserPlus, BarChart2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/theme-switcher';

type NavSection = 'dashboard' | 'orders' | 'search' | 'assignments' | 'reports' | 'users';

interface SidebarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  onNewOrder: () => void;
  onOpenAssign?: () => void;
  unassignedCount?: number;
  isAdmin?: boolean;
  userName?: string;
  userRole?: string;
  onSignOut?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, onNewOrder, onOpenAssign, unassignedCount = 0, isAdmin = false, userName, userRole, onSignOut }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'orders' as NavSection, label: 'Todas las Órdenes', icon: Package, adminOnly: false },
    { id: 'search' as NavSection, label: 'Buscar', icon: Search, adminOnly: false },
    { id: 'assignments' as NavSection, label: 'Asignaciones', icon: Users, adminOnly: false },
    { id: 'reports' as NavSection, label: 'Reportes', icon: BarChart2, adminOnly: true },
    { id: 'users' as NavSection, label: 'Usuarios', icon: KeyRound, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  const handleNavClick = (section: NavSection) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ===== MOBILE TOP BAR ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#070D18] border-b border-[#1a2436] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center">
            <span className="text-white font-bold text-xs font-['Bricolage_Grotesque']">H</span>
          </div>
          <h1 className="text-lg font-bold font-['Bricolage_Grotesque'] text-white">
            Hida<span className="text-[#F97316]">sol</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || userRole === 'ventas') && (
            <>
              {onOpenAssign && (
                <button
                  onClick={onOpenAssign}
                  className="relative p-2 rounded-[8px] bg-[#111827] border border-[#1a2436] text-[#94A3B8] hover:text-white hover:border-[#F97316]/40 transition-all"
                  aria-label="Asignar órdenes"
                >
                  <UserPlus className="w-5 h-5" />
                  {unassignedCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unassignedCount > 9 ? '9+' : unassignedCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={onNewOrder}
                className="p-2 rounded-[8px] bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white"
                aria-label="Nueva Orden"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-[8px] text-[#94A3B8] hover:text-white hover:bg-[#111827] transition-all"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ===== MOBILE SLIDE-DOWN MENU ===== */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-[57px] left-0 right-0 z-50 bg-[#070D18] border-b border-[#1a2436] p-4 space-y-2 animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-smooth font-medium text-sm',
                    isActive
                      ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                      : 'text-[#94A3B8] hover:bg-[#111827] hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-[#1a2436] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {userName && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#111827] border border-[#1a2436]">
                    <div className="w-6 h-6 rounded-full bg-[#F97316]/20 flex items-center justify-center shrink-0">
                      {isAdmin ? <ShieldCheck className="w-3 h-3 text-[#F97316]" /> : <User className="w-3 h-3 text-[#94A3B8]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{userName}</p>
                      <p className="text-[10px] text-[#64748B] capitalize">{userRole}</p>
                    </div>
                  </div>
                )}
                <ThemeSwitcher />
              </div>
              {onSignOut && (
                <button
                  onClick={() => { onSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[#64748B] hover:text-white hover:bg-[#111827] transition-all duration-200 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070D18] border-t border-[#1a2436] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-[8px] transition-all duration-200 min-w-0',
                isActive
                  ? 'text-[#F97316]'
                  : 'text-[#64748B]'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]')} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">
                {item.id === 'dashboard' ? 'Inicio'
                  : item.id === 'orders' ? 'Órdenes'
                  : item.id === 'search' ? 'Buscar'
                  : item.id === 'assignments' ? 'Asignar'
                  : item.id === 'reports' ? 'Reportes'
                  : item.id === 'users' ? 'Usuarios'
                  : item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex w-64 bg-[#070D18] dark:bg-[#070D18] border-r border-[#1a2436] dark:border-[#1a2436] h-screen sticky top-0 flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-[#1a2436] dark:border-[#1a2436]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center">
              <span className="text-white font-bold text-sm font-['Bricolage_Grotesque']">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold font-['Bricolage_Grotesque'] text-white">
                Hida<span className="text-[#F97316]">sol</span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-2 tracking-wide uppercase">
            Gestión de Órdenes
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-smooth font-medium text-sm',
                  isActive
                    ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                    : 'text-[#94A3B8] hover:bg-[#111827] hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-[#64748B] uppercase tracking-wide">Tema</span>
          <ThemeSwitcher />
        </div>

        {/* User info */}
        {userName && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[#111827] border border-[#1a2436]">
              <div className="w-7 h-7 rounded-full bg-[#F97316]/20 flex items-center justify-center shrink-0">
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-[#F97316]" /> : <User className="w-3.5 h-3.5 text-[#94A3B8]" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-[#64748B] capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-[#1a2436] dark:border-[#1a2436] space-y-2">
          {(isAdmin || userRole === 'ventas') && (
            <div className="flex gap-2">
              {onOpenAssign && (
                <button
                  onClick={onOpenAssign}
                  className="relative flex items-center justify-center gap-2 px-3 py-3 rounded-[10px] bg-[#111827] border border-[#1a2436] text-[#94A3B8] hover:text-white hover:border-[#F97316]/40 transition-all duration-200"
                  title="Asignar órdenes sin asignar"
                >
                  <UserPlus className="w-5 h-5" />
                  {unassignedCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow">
                      {unassignedCount > 9 ? '9+' : unassignedCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={onNewOrder}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold text-sm transition-smooth hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#F97316]/25"
              >
                <Plus className="w-5 h-5" />
                <span>Nueva Orden</span>
              </button>
            </div>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[#64748B] hover:text-white hover:bg-[#111827] transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
