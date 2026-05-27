'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, TipoOrden } from '@/types/order';
import {
  loadOrders,
  addOrder as addOrderToDB,
  updateOrderInDB,
  updateOrderStatus,
  updateDisenadoPor,
  moveOrderToStation,
  subscribeToOrders,
  generateOrderIdFromDB,
} from '@/lib/order-store';
import type { Station } from '@/lib/stations';
import { useToast } from '@/components/ui/use-toast';
import { groupOrdersByDate, calculateDashboardStats } from '@/lib/order-utils';
import { Sidebar } from '@/components/layout/sidebar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { HierarchicalOrderBrowser } from '@/components/orders/hierarchical-order-browser';
import { SearchOrders } from '@/components/orders/search-orders';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { OrderForm } from '@/components/orders/order-form';
import { SellosForm } from '@/components/orders/sellos-form';
import { PapeleriaForm } from '@/components/orders/papeleria-form';
import { OrderTypeSelector } from '@/components/orders/order-type-selector';
import { ProductionTicket } from '@/components/orders/production-ticket';
import { QuickAssignModal } from '@/components/orders/quick-assign-modal';
import { ReportsView } from '@/components/orders/reports-view';
import { AssignmentsView } from '@/components/orders/assignments-view';
import { DesignerDashboard } from '@/components/orders/designer-dashboard';
import { UsersView } from '@/components/orders/users-view';
import { StationDashboard } from '@/components/orders/station-dashboard';
import { useAuth } from '@/contexts/auth-context';
import { LoginPage } from '@/components/auth/login-page';
import { isStationOnlyRole, primaryStationForRole } from '@/lib/stations';

type NavSection = 'dashboard' | 'orders' | 'search' | 'assignments' | 'reports' | 'users';

export default function Page() {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  // New: type selector + per-type form state
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TipoOrden | null>(null);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);

  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await loadOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast({ title: '⚠️ Error cargando órdenes', description: 'Intenta recargar la página.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
    const unsubscribe = subscribeToOrders((updatedOrders) => setOrders(updatedOrders));
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [fetchOrders]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const previousOrders = orders;
    const previousSelected = selectedOrder;
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, estado: newStatus } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, estado: newStatus } : null);
    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
      setOrders(previousOrders);
      setSelectedOrder(previousSelected);
      toast({ title: '❌ Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
    }
  };

  const handleDisenadoPorChange = async (orderId: string, value: string) => {
    const previousOrders = orders;
    const previousSelected = selectedOrder;
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, disenadoPor: value || undefined } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, disenadoPor: value || undefined } : null);
    const success = await updateDisenadoPor(orderId, value);
    if (!success) {
      setOrders(previousOrders);
      setSelectedOrder(previousSelected);
      toast({ title: '❌ Error', description: 'No se pudo actualizar "diseñado por".', variant: 'destructive' });
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStationChange = async (orderId: string, newStation: Station) => {
    if (!user) return;
    const now = new Date();
    const previousOrders = orders;
    const previousSelected = selectedOrder;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, estacionAnterior: o.estacionActual, estacionActual: newStation, estacionDesde: now }
          : o,
      ),
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev =>
        prev
          ? { ...prev, estacionAnterior: prev.estacionActual, estacionActual: newStation, estacionDesde: now }
          : null,
      );
    }

    const { ok, error } = await moveOrderToStation(
      orderId,
      newStation,
      { id: user.id, name: user.name },
    );

    if (!ok) {
      setOrders(previousOrders);
      setSelectedOrder(previousSelected);
      toast({
        title: '❌ Error',
        description: error || 'No se pudo mover la orden de estación.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '✅ Movida',
      description: `Orden ${orderId} ahora en ${newStation}.`,
    });
  };

  // Open type selector instead of going straight to form
  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsTypeSelectorOpen(true);
  };

  const handleTypeSelect = (tipo: TipoOrden) => {
    setIsTypeSelectorOpen(false);
    setActiveFormType(tipo);
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setIsDetailModalOpen(false);
    setActiveFormType(order.tipoOrden || 'Rotulacion');
  };

  const handleCloseForm = () => {
    setActiveFormType(null);
    setOrderToEdit(null);
  };

  const handleSaveOrder = async (order: Order): Promise<{ error: string | null }> => {
    if (orderToEdit) {
      const result = await updateOrderInDB(order.id, order);
      if (result.order) {
        setOrders(prev => prev.map(o => (o.id === order.id ? result.order! : o)));
        toast({ title: '✅ Orden actualizada', description: `Orden ${order.id} guardada correctamente.` });
        handleCloseForm();
        return { error: null };
      } else {
        const errMsg = result.error || 'No se pudo actualizar la orden.';
        toast({ title: '❌ Error al actualizar', description: errMsg, variant: 'destructive' });
        return { error: errMsg };
      }
    } else {
      const newId = await generateOrderIdFromDB();
      const orderWithId = { ...order, id: newId };
      const result = await addOrderToDB(orderWithId);
      if (result.order) {
        setOrders(prev => [result.order!, ...prev]);
        toast({ title: '✅ Orden creada', description: `Orden ${newId} guardada.` });
        handleCloseForm();
        return { error: null };
      } else {
        const errMsg = result.error || 'Error desconocido al guardar la orden.';
        toast({ title: '❌ Error al guardar', description: errMsg, variant: 'destructive' });
        return { error: errMsg };
      }
    }
  };

  const handlePrintTicket = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(false);
    setIsTicketModalOpen(true);
  };

  const stats = calculateDashboardStats(orders);
  const groupedOrders = groupOrdersByDate(orders);
  const unassignedOrders = orders.filter(o => !o.disenadoPor);

  // ── Auth guards ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="https://assets.cdn.filesafe.space/0M6K8lmvNdLqq7S28Bmn/media/69aa284636702f476fff7b74.png"
            alt="Hidasol" className="h-16 w-auto object-contain opacity-80" />
          <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // ── Station-only roles get a minimal dashboard scoped to their station ────
  const stationOnly = isStationOnlyRole(user.role);
  const myStation = primaryStationForRole(user.role);

  if (stationOnly && myStation) {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      );
    }
    return (
      <>
        <StationDashboard
          station={myStation}
          orders={orders}
          user={{ name: user.name }}
          onOrderClick={handleOrderClick}
          onSignOut={signOut}
        />
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); }}
          onStatusChange={handleStatusChange}
          onEdit={handleEditOrder}
          onPrint={handlePrintTicket}
          onDisenadoPorChange={handleDisenadoPorChange}
          onStationChange={handleStationChange}
          isAdmin={isAdmin}
        />
        <ProductionTicket
          order={selectedOrder}
          isOpen={isTicketModalOpen}
          onClose={() => { setIsTicketModalOpen(false); setSelectedOrder(null); }}
        />
      </>
    );
  }

  // ── Designer view ──────────────────────────────────────────────────────────
  const isDesigner = user.role === 'diseno';
  const myOrders = isDesigner
    ? orders.filter(o => o.disenadoPor === user.name)
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      {!isDesigner && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onNewOrder={handleNewOrder}
          onOpenAssign={isAdmin ? () => setIsQuickAssignOpen(true) : undefined}
          unassignedCount={unassignedOrders.length}
          isAdmin={isAdmin}
          userName={user.name || user.email}
          userRole={user.role}
          onSignOut={signOut}
        />
      )}

      {/* Minimal top bar for designers */}
      {isDesigner && (
        <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#070D18] border-b border-[#1a2436] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center">
              <span className="text-white font-bold text-xs font-['Bricolage_Grotesque']">H</span>
            </div>
            <span className="text-white font-bold font-['Bricolage_Grotesque']">
              Hida<span className="text-[#F97316]">sol</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#94A3B8]">{user.name}</span>
            <button
              onClick={signOut}
              className="text-xs text-[#64748B] hover:text-white transition-colors px-2 py-1 rounded-[6px] hover:bg-[#111827]"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto relative z-10 ${
        isDesigner
          ? 'p-4 pt-[72px] pb-6 lg:p-8 lg:pt-[72px]'
          : 'p-4 pt-[72px] pb-[72px] lg:p-8 lg:pt-8 lg:pb-8'
      }`}>
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* ── Designer specialised view ── */}
              {isDesigner && (
                <DesignerDashboard
                  myOrders={myOrders}
                  user={user}
                  onOrderClick={handleOrderClick}
                />
              )}

              {/* ── Regular sections (non-designers) ── */}
              {!isDesigner && (
                <>
                  {activeSection === 'dashboard' && (
                    <>
                      <div>
                        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                          Dash<span className="text-[#F97316]">board</span>
                        </h1>
                        <p className="text-sm lg:text-lg text-muted-foreground">Resumen de actividad y órdenes recientes</p>
                      </div>
                      <StatsCards stats={stats} />
                      <RecentOrders orders={orders} onOrderClick={handleOrderClick} onStatusChange={handleStatusChange} />
                    </>
                  )}

                  {activeSection === 'orders' && (
                    <>
                      <div>
                        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                          Todas las Órdenes
                        </h1>
                        <p className="text-sm lg:text-lg text-muted-foreground">Vista jerárquica organizada por fecha</p>
                      </div>
                      <HierarchicalOrderBrowser groupedOrders={groupedOrders} onOrderClick={handleOrderClick} onStatusChange={handleStatusChange} />
                    </>
                  )}

                  {activeSection === 'search' && (
                    <>
                      <div>
                        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                          Buscar Órdenes
                        </h1>
                        <p className="text-sm lg:text-lg text-muted-foreground">Encuentra órdenes rápidamente</p>
                      </div>
                      <SearchOrders orders={orders} onOrderClick={handleOrderClick} onStatusChange={handleStatusChange} />
                    </>
                  )}

                  {activeSection === 'assignments' && (
                    <>
                      <div>
                        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                          Asig<span className="text-[#F97316]">naciones</span>
                        </h1>
                        <p className="text-sm lg:text-lg text-muted-foreground">Boletas de trabajo asignadas por diseñador</p>
                      </div>
                      <AssignmentsView orders={orders} onOrderClick={handleOrderClick} />
                    </>
                  )}

                  {activeSection === 'reports' && isAdmin && (
                    <>
                      <div>
                        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                          Repor<span className="text-[#F97316]">tes</span>
                        </h1>
                        <p className="text-sm lg:text-lg text-muted-foreground">Métricas mensuales generadas automáticamente</p>
                      </div>
                      <ReportsView />
                    </>
                  )}

                  {activeSection === 'users' && isAdmin && <UsersView />}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); }}
        onStatusChange={handleStatusChange}
        onEdit={handleEditOrder}
        onPrint={handlePrintTicket}
        onDisenadoPorChange={handleDisenadoPorChange}
        onStationChange={handleStationChange}
        isAdmin={isAdmin}
      />

      <ProductionTicket
        order={selectedOrder}
        isOpen={isTicketModalOpen}
        onClose={() => { setIsTicketModalOpen(false); setSelectedOrder(null); }}
      />

      {/* Type selector */}
      <OrderTypeSelector
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        onSelect={handleTypeSelect}
      />

      {/* Rotulación form */}
      <OrderForm
        order={activeFormType === 'Rotulacion' ? orderToEdit : null}
        isOpen={activeFormType === 'Rotulacion'}
        onClose={handleCloseForm}
        onSave={handleSaveOrder}
      />

      {/* Sellos form */}
      <SellosForm
        order={activeFormType === 'Sellos' ? orderToEdit : null}
        isOpen={activeFormType === 'Sellos'}
        onClose={handleCloseForm}
        onSave={handleSaveOrder}
      />

      {/* Quick assign */}
      <QuickAssignModal
        isOpen={isQuickAssignOpen}
        onClose={() => setIsQuickAssignOpen(false)}
        orders={orders}
        onAssign={(orderId, designer) => {
          handleDisenadoPorChange(orderId, designer);
          if (unassignedOrders.length <= 1) setIsQuickAssignOpen(false);
        }}
      />

      {/* Papelería form */}
      <PapeleriaForm
        order={activeFormType === 'Papeleria' ? orderToEdit : null}
        isOpen={activeFormType === 'Papeleria'}
        onClose={handleCloseForm}
        onSave={handleSaveOrder}
      />
    </div>
  );
}
