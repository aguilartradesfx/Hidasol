'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/order';
import {
  loadOrders,
  addOrder as addOrderToDB,
  updateOrderInDB,
  updateOrderStatus,
  updateDisenadoPor,
  subscribeToOrders,
  generateOrderIdFromDB,
} from '@/lib/order-store';
import { useToast } from '@/components/ui/use-toast';
import { groupOrdersByDate, calculateDashboardStats } from '@/lib/order-utils';
import { Sidebar } from '@/components/layout/sidebar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { HierarchicalOrderBrowser } from '@/components/orders/hierarchical-order-browser';
import { SearchOrders } from '@/components/orders/search-orders';
import { OrderDetailModal } from '@/components/orders/order-detail-modal';
import { OrderForm } from '@/components/orders/order-form';
import { ProductionTicket } from '@/components/orders/production-ticket';
import { AssignmentsView } from '@/components/orders/assignments-view';
import { useAuth } from '@/contexts/auth-context';
import { LoginPage } from '@/components/auth/login-page';

type NavSection = 'dashboard' | 'orders' | 'search' | 'assignments';

export default function Page() {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  // signOut is now synchronous (localStorage-based)
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const { toast } = useToast();

  // Load orders from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      const data = await loadOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast({
        title: '⚠️ Error cargando órdenes',
        description: 'No se pudieron cargar las órdenes. Intenta recargar la página.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    // Failsafe: if orders haven't loaded in 8 seconds, stop spinner
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    const previousOrders = orders;
    const previousSelected = selectedOrder;

    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, estado: newStatus } : o))
    );

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, estado: newStatus } : null);
    }

    const success = await updateOrderStatus(orderId, newStatus);
    if (!success) {
      // Revert optimistic update
      setOrders(previousOrders);
      setSelectedOrder(previousSelected);
      toast({ title: '❌ Error', description: 'No se pudo actualizar el estado en Supabase.', variant: 'destructive' });
    }
  };

  const handleDisenadoPorChange = async (orderId: string, value: string) => {
    const previousOrders = orders;
    const previousSelected = selectedOrder;

    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, disenadoPor: value || undefined } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, disenadoPor: value || undefined } : null);
    }
    const success = await updateDisenadoPor(orderId, value);
    if (!success) {
      setOrders(previousOrders);
      setSelectedOrder(previousSelected);
      toast({ title: '❌ Error', description: 'No se pudo actualizar "diseñado por" en Supabase.', variant: 'destructive' });
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleSaveOrder = async (order: Order): Promise<{ error: string | null }> => {
    if (orderToEdit) {
      // Update existing order
      const result = await updateOrderInDB(order.id, order);
      if (result.order) {
        setOrders(prev => prev.map(o => (o.id === order.id ? result.order! : o)));
        toast({ title: '✅ Orden actualizada', description: `Orden ${order.id} guardada correctamente.` });
        setIsFormModalOpen(false);
        setOrderToEdit(null);
        return { error: null };
      } else {
        const errMsg = result.error || 'No se pudo actualizar la orden.';
        toast({ title: '❌ Error al actualizar', description: errMsg, variant: 'destructive' });
        return { error: errMsg };
      }
    } else {
      // Generate proper sequential ID and add new order
      const newId = await generateOrderIdFromDB();
      const orderWithId = { ...order, id: newId };
      const result = await addOrderToDB(orderWithId);
      if (result.order) {
        setOrders(prev => [result.order!, ...prev]);
        toast({ title: '✅ Orden creada', description: `Orden ${newId} guardada en Supabase.` });
        setIsFormModalOpen(false);
        setOrderToEdit(null);
        return { error: null };
      } else {
        const errMsg = result.error || 'Error desconocido al guardar la orden.';
        toast({ 
          title: '❌ Error al guardar orden', 
          description: errMsg, 
          variant: 'destructive' 
        });
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

  // Auth loading splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://assets.cdn.filesafe.space/0M6K8lmvNdLqq7S28Bmn/media/69aa284636702f476fff7b74.png"
            alt="Hidasol"
            className="h-16 w-auto object-contain opacity-80"
          />
          <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNewOrder={handleNewOrder}
        isAdmin={isAdmin}
        userName={user.name || user.email}
        userRole={user.role}
        onSignOut={signOut}
      />

      <main className="flex-1 p-4 pt-[72px] pb-[72px] lg:p-8 lg:pt-8 lg:pb-8 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <>
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                      Dash<span className="text-[#F97316]">board</span>
                    </h1>
                    <p className="text-sm lg:text-lg text-muted-foreground">
                      Resumen de actividad y órdenes recientes
                    </p>
                  </div>

                  <StatsCards stats={stats} />

                  <RecentOrders
                    orders={orders}
                    onOrderClick={handleOrderClick}
                    onStatusChange={handleStatusChange}
                  />
                </>
              )}

              {activeSection === 'orders' && (
                <>
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                      Todas las Órdenes
                    </h1>
                    <p className="text-sm lg:text-lg text-muted-foreground">
                      Vista jerárquica organizada por fecha
                    </p>
                  </div>

                  <HierarchicalOrderBrowser
                    groupedOrders={groupedOrders}
                    onOrderClick={handleOrderClick}
                    onStatusChange={handleStatusChange}
                  />
                </>
              )}

              {activeSection === 'search' && (
                <>
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                      Buscar Órdenes
                    </h1>
                    <p className="text-sm lg:text-lg text-muted-foreground">
                      Encuentra órdenes rápidamente
                    </p>
                  </div>

                  <SearchOrders
                    orders={orders}
                    onOrderClick={handleOrderClick}
                    onStatusChange={handleStatusChange}
                  />
                </>
              )}

              {activeSection === 'assignments' && (
                <>
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1 lg:mb-2">
                      Asig<span className="text-[#F97316]">naciones</span>
                    </h1>
                    <p className="text-sm lg:text-lg text-muted-foreground">
                      Boletas de trabajo asignadas por diseñador
                    </p>
                  </div>

                  <AssignmentsView
                    orders={orders}
                    onOrderClick={handleOrderClick}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusChange={handleStatusChange}
        onEdit={handleEditOrder}
        onPrint={handlePrintTicket}
        onDisenadoPorChange={handleDisenadoPorChange}
        isAdmin={isAdmin}
      />

      <OrderForm
        order={orderToEdit}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setOrderToEdit(null);
        }}
        onSave={handleSaveOrder}
      />

      <ProductionTicket
        order={selectedOrder}
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
