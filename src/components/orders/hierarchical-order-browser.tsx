import { useState } from "react";
import { Order, OrdersGroupedByDate, OrderStatus } from "@/types/order";
import { MONTH_NAMES, formatCurrency } from "@/lib/order-utils";
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  Package,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { OrderIconView } from "@/components/orders/order-icon-view";

interface HierarchicalOrderBrowserProps {
  groupedOrders: OrdersGroupedByDate;
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

type ViewMode = "list" | "icons";

export function HierarchicalOrderBrowser({
  groupedOrders,
  onOrderClick,
  onStatusChange,
}: HierarchicalOrderBrowserProps) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const toggleYear = (year: number) => {
    const newSet = new Set(expandedYears);
    if (newSet.has(year)) {
      newSet.delete(year);
    } else {
      newSet.add(year);
    }
    setExpandedYears(newSet);
  };

  const toggleMonth = (yearMonth: string) => {
    const newSet = new Set(expandedMonths);
    if (newSet.has(yearMonth)) {
      newSet.delete(yearMonth);
    } else {
      newSet.add(yearMonth);
    }
    setExpandedMonths(newSet);
  };

  const toggleWeek = (yearMonthWeek: string) => {
    const newSet = new Set(expandedWeeks);
    if (newSet.has(yearMonthWeek)) {
      newSet.delete(yearMonthWeek);
    } else {
      newSet.add(yearMonthWeek);
    }
    setExpandedWeeks(newSet);
  };

  const toggleDay = (yearMonthWeekDay: string) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(yearMonthWeekDay)) {
      newSet.delete(yearMonthWeekDay);
    } else {
      newSet.add(yearMonthWeekDay);
    }
    setExpandedDays(newSet);
  };

  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case "Nueva":
        return "bg-[#60A5FA]/20 text-[#93C5FD] border border-[#60A5FA]/30";
      case "En proceso":
        return "bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30";
      case "Terminado":
        return "bg-[#34D399]/20 text-[#6EE7B7] border border-[#34D399]/30";
    }
  };

  const years = Object.keys(groupedOrders)
    .map(Number)
    .sort((a, b) => b - a);

  // Flatten all orders for icon view
  const allOrders: Order[] = [];
  Object.values(groupedOrders).forEach((months) => {
    Object.values(months).forEach((weeks) => {
      Object.values(weeks as Record<string, any>).forEach((days) => {
        Object.values(days as Record<string, any>).forEach(
          (dayOrders: Order[]) => {
            allOrders.push(...dayOrders);
          },
        );
      });
    });
  });
  // Sort by date descending
  allOrders.sort(
    (a, b) =>
      new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime(),
  );

  return (
    <div className="bg-card rounded-[12px] border border-border overflow-hidden">
      <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl lg:text-2xl font-semibold font-['Bricolage_Grotesque']">
            Todas las Órdenes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {viewMode === "list"
              ? "Organización jerárquica por fecha"
              : `${allOrders.length} órdenes en total`}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-[8px] p-1">
          <button
            onClick={() => setViewMode("list")}
            title="Vista de lista"
            className={`p-2 rounded-[6px] transition-all duration-200 ${
              viewMode === "list"
                ? "bg-background shadow-sm text-[#F97316]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("icons")}
            title="Vista de iconos"
            className={`p-2 rounded-[6px] transition-all duration-200 ${
              viewMode === "icons"
                ? "bg-background shadow-sm text-[#F97316]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === "icons" && (
        <div className="p-4 lg:p-6">
          <OrderIconView
            orders={allOrders}
            onOrderClick={onOrderClick}
            onStatusChange={onStatusChange}
          />
        </div>
      )}

      {viewMode === "list" && (
        <div className="p-4 lg:p-6 space-y-2">
          {years.map((year) => {
            const isYearExpanded = expandedYears.has(year);
            const months = Object.keys(groupedOrders[year])
              .map(Number)
              .sort((a, b) => b - a);

            return (
              <div key={year} className="space-y-2">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] bg-muted hover:bg-muted/80 transition-smooth font-semibold text-lg font-['Bricolage_Grotesque']"
                >
                  {isYearExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Calendar className="w-5 h-5" />
                  <span>{year}</span>
                </button>

                {isYearExpanded && (
                  <div className="ml-3 lg:ml-5 pl-3 lg:pl-4 border-l border-border space-y-2">
                    {months.map((month) => {
                      const yearMonth = `${year}-${month}`;
                      const isMonthExpanded = expandedMonths.has(yearMonth);
                      const weeks = Object.keys(groupedOrders[year][month])
                        .map(Number)
                        .sort((a, b) => b - a);

                      return (
                        <div key={yearMonth} className="space-y-2">
                          <button
                            onClick={() => toggleMonth(yearMonth)}
                            className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 rounded-[10px] hover:bg-muted/50 transition-smooth font-medium"
                          >
                            {isMonthExpanded ? (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>{MONTH_NAMES[month]}</span>
                          </button>

                          {isMonthExpanded && (
                            <div className="ml-3 lg:ml-5 pl-3 lg:pl-4 border-l border-border space-y-2">
                              {weeks.map((week) => {
                                const yearMonthWeek = `${yearMonth}-${week}`;
                                const isWeekExpanded =
                                  expandedWeeks.has(yearMonthWeek);
                                const days = Object.keys(
                                  groupedOrders[year][month][week],
                                )
                                  .sort()
                                  .reverse();

                                return (
                                  <div
                                    key={yearMonthWeek}
                                    className="space-y-2"
                                  >
                                    <button
                                      onClick={() => toggleWeek(yearMonthWeek)}
                                      className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 rounded-[10px] hover:bg-muted/50 transition-smooth text-sm"
                                    >
                                      {isWeekExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-primary" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                      <span className="font-medium">
                                        Semana {week}
                                      </span>
                                    </button>

                                    {isWeekExpanded && (
                                      <div className="ml-3 lg:ml-5 pl-3 lg:pl-4 border-l border-border space-y-2">
                                        {days.map((day) => {
                                          const yearMonthWeekDay = `${yearMonthWeek}-${day}`;
                                          const isDayExpanded =
                                            expandedDays.has(yearMonthWeekDay);
                                          const orders =
                                            groupedOrders[year][month][week][
                                              day
                                            ];
                                          const dayDate = new Date(day);

                                          return (
                                            <div
                                              key={yearMonthWeekDay}
                                              className="space-y-2"
                                            >
                                              <button
                                                onClick={() =>
                                                  toggleDay(yearMonthWeekDay)
                                                }
                                                className="w-full flex items-center justify-between gap-2 px-3 lg:px-4 py-2 rounded-[10px] hover:bg-muted/50 transition-smooth text-sm"
                                              >
                                                <div className="flex items-center gap-3">
                                                  {isDayExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-primary" />
                                                  ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                  )}
                                                  <span className="font-medium">
                                                    {dayDate.toLocaleDateString(
                                                      "es-CO",
                                                      {
                                                        day: "numeric",
                                                        month: "short",
                                                      },
                                                    )}
                                                  </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                  {orders.length}{" "}
                                                  {orders.length === 1
                                                    ? "orden"
                                                    : "órdenes"}
                                                </span>
                                              </button>

                                              {isDayExpanded && (
                                                <div className="ml-2 lg:ml-5 pl-2 lg:pl-4 border-l border-border space-y-2">
                                                  {orders.map((order) => (
                                                    <div
                                                      key={order.id}
                                                      onClick={() =>
                                                        onOrderClick(order)
                                                      }
                                                      className="group p-2 lg:p-3 rounded-[10px] border border-border hover:border-[#F97316]/40 transition-smooth cursor-pointer hover:bg-[#F97316]/5"
                                                    >
                                                      <div className="flex items-center justify-between gap-3">
                                                        <div className="flex-1 space-y-1">
                                                          <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-medium text-[#F97316]">
                                                              {order.id}
                                                            </span>
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const statuses: OrderStatus[] =
                                                                  [
                                                                    "Nueva",
                                                                    "En proceso",
                                                                    "Terminado",
                                                                  ];
                                                                const currentIndex =
                                                                  statuses.indexOf(
                                                                    order.estado,
                                                                  );
                                                                const nextStatus =
                                                                  statuses[
                                                                    (currentIndex +
                                                                      1) %
                                                                      statuses.length
                                                                  ];
                                                                onStatusChange(
                                                                  order.id,
                                                                  nextStatus,
                                                                );
                                                              }}
                                                              className={`px-2 py-0.5 rounded-[5px] text-xs font-medium transition-smooth hover:scale-105 ${getStatusStyles(order.estado)}`}
                                                            >
                                                              {order.estado}
                                                            </button>
                                                          </div>
                                                          <div className="text-sm font-medium">
                                                            {order.cliente}
                                                          </div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {
                                                              order.productoNombre
                                                            }
                                                          </div>
                                                        </div>
                                                        <div className="text-right">
                                                          <div className="text-sm font-semibold font-mono">
                                                            {formatCurrency(
                                                              order.valorTotal,
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
