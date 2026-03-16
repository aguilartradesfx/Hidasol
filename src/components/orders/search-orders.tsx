import { useState, useMemo } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/order-utils';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchOrdersProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export function SearchOrders({ orders, onOrderClick, onStatusChange }: SearchOrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');

  const materiales = useMemo(() => {
    const uniqueMateriales = new Set(orders.map(o => o.materialPrincipal));
    return Array.from(uniqueMateriales).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(q) ||
        order.cliente.toLowerCase().includes(q) ||
        order.productoNombre.toLowerCase().includes(q) ||
        order.tipoTrabajo.toLowerCase().includes(q) ||
        (order.especificaciones || '').toLowerCase().includes(q) ||
        (order.notasAdicionales || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || order.estado === statusFilter;
      const matchesMaterial = materialFilter === 'all' || order.materialPrincipal === materialFilter;

      return matchesSearch && matchesStatus && matchesMaterial;
    });
  }, [orders, searchQuery, statusFilter, materialFilter]);

  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'Nueva':
        return 'bg-[#60A5FA]/20 text-[#93C5FD] border border-[#60A5FA]/30';
      case 'En proceso':
        return 'bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30';
      case 'Terminado':
        return 'bg-[#34D399]/20 text-[#6EE7B7] border border-[#34D399]/30';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMaterialFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || materialFilter !== 'all';

  return (
    <div className="bg-card rounded-[12px] border border-border">
      <div className="p-4 lg:p-6 border-b border-border space-y-4">
        <div>
          <h2 className="text-2xl font-semibold font-['Bricolage_Grotesque']">
            Buscar Órdenes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Filtra por ID, cliente, producto o notas
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por ID, cliente, producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-[10px] border-border focus:ring-primary"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
              <SelectTrigger className="h-10 rounded-[10px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Nueva">Nueva</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Terminado">Terminado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="h-10 rounded-[10px]">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los materiales</SelectItem>
                {materiales.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-[10px] border border-border hover:bg-muted transition-smooth flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No se encontraron órdenes</p>
            <p className="text-sm text-muted-foreground mt-2">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onOrderClick(order)}
              className="group p-4 rounded-[10px] border border-border hover:border-[#F97316]/40 transition-smooth cursor-pointer hover:bg-[#F97316]/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-[#F97316]">
                      {order.id}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const statuses: OrderStatus[] = ['Nueva', 'En proceso', 'Terminado'];
                        const currentIndex = statuses.indexOf(order.estado);
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                        onStatusChange(order.id, nextStatus);
                      }}
                      className={`px-3 py-1 rounded-[5px] text-xs font-medium transition-smooth hover:scale-105 ${getStatusStyles(order.estado)}`}
                    >
                      {order.estado}
                    </button>
                  </div>

                  <div className="font-medium text-base truncate">{order.cliente}</div>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="truncate max-w-[150px]">{order.productoNombre}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{order.materialPrincipal}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatDate(order.fechaIngreso)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base lg:text-lg font-semibold font-mono">
                    {formatCurrency(order.valorTotal)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cant: {order.cantidad}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
