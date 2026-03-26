/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { subscribeToEvent, SOCKET_EVENTS } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, Loader2, MapPin, Phone, User2, Truck, IndianRupee, CheckCircle2, XCircle, Clock, ShoppingCart } from "lucide-react";
import { cn, apiRequestWithStatus } from "@/lib/utils";
import { ORDER_STATUS, getStatusLabel } from "@/constants/orderStatus";
import type { OrderStatus } from "@/constants/orderStatus";
import { toast } from "react-toastify";

// ------------------ Types ------------------
export type Order = {
  id: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  totalBagAmount: string; // "49.00"
  deliveryFee: string; // "0.00"
  platformCommission: string; // "10.00"
  totalPaymentAmount: string; // "59.00"
  discountAmount: string; // "0.00"
  couponCode: string | null;
  walletAmountUsed: string; // "0.00"
  finalAmountPaid: string | null; // actual amount collected after discounts
  deliveryAddressSnapshot: string;
  deliveryLatitude: string; // "12.929507"
  deliveryLongitude: string; // "77.677976"
  customerPhoneSnapshot: string;
  customerEmailSnapshot: string | null;
  notesToRestaurant: string | null;
  orderStatus: OrderStatus;
  paymentStatus: "paid" | "pending" | "failed";
  paymentTransactionId: string | null;
  paymentMethod: string | null;
  orderDate: string; // ISO date
  restaurantConfirmedAt: string | null;
  deliveryPartnerAssignedAt: string | null;
  pickupTimeSlotStart: string | null; // "18:00:00"
  pickupTimeSlotEnd: string | null; // "23:00:00"
  expectedDeliveryTime: string | null;
  actualDeliveryTime: string | null;
  cancellationReason: string | null;
  cancelledByUserType: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  customerName: string | null;
  customerPhone: string | null;
  restaurantName: string | null;
  restaurantContactPerson: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerPhone: string | null;
  items: Array<{
    bagId: string;
    bagName: string;
    bagIsVegetarian: boolean;
    quantity: number;
    pricePaid: number;
    actualWorth: number;
    co2SavedKg: number;
  }>;
};

export type DeliveryPartner = {
  id: string;
  fullName: string;
  phoneNumber?: string;
};

export type GroceryOrder = {
  id: string;
  customerId: string;
  storeId: string;
  deliveryPartnerId: string | null;
  storeNameSnapshot: string;
  storeImage: string | null;
  totalItemsAmount: string;
  deliveryCharge: string;
  handlingCharge: string;
  platformCommission: string;
  gstAmount: string;
  discountAmount: string;
  totalPaymentAmount: string;
  deliveryAddressSnapshot: string | null;
  orderStatus: string;
  paymentMethod: string | null;
  paymentStatus: string;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    groceryItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

const GROCERY_STATUS_OPTIONS = [
  "all",
  "placed",
  "confirmed",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled_user",
  "cancelled_store",
] as const;

type GroceryOrderStatus = (typeof GROCERY_STATUS_OPTIONS)[number];

const groceryStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    placed: "Placed",
    confirmed: "Confirmed",
    ready_for_pickup: "Ready for Pickup",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled_user: "Cancelled by User",
    cancelled_store: "Cancelled by Store",
    all: "All Statuses",
  };
  return map[s] ?? s;
};

const groceryStatusVariant = (s: string) => {
  if (!s) return "outline" as const;
  if (s === "delivered") return "default" as const;
  if (s.startsWith("cancelled")) return "destructive" as const;
  if (["out_for_delivery", "ready_for_pickup", "confirmed", "placed"].includes(s)) return "secondary" as const;
  return "outline" as const;
};

// ------------------ Utils ------------------
const formatINR = (n: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    typeof n === "string" ? Number(n) : n
  );

const timeAgo = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const statusVariant = (s: Order["orderStatus"]) => {
  switch (s) {
    case ORDER_STATUS.DELIVERED:
      return "default" as const;
    case ORDER_STATUS.CANCELLED_BY_USER:
    case ORDER_STATUS.CANCELLED_BY_RESTAURANT:
    case ORDER_STATUS.CANCELLED_BY_ADMIN:
    case ORDER_STATUS.REFUNDED:
      return "destructive" as const;
    case ORDER_STATUS.OUT_FOR_DELIVERY:
    case ORDER_STATUS.READY_FOR_PICKUP:
    case ORDER_STATUS.CONFIRMED:
    case ORDER_STATUS.PLACED:
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const STATUS_OPTIONS: Array<OrderStatus | "all"> = [
  "all",
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED_BY_USER,
  ORDER_STATUS.CANCELLED_BY_RESTAURANT,
  ORDER_STATUS.CANCELLED_BY_ADMIN,
  ORDER_STATUS.REFUNDED,
];

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ------------------ Main Component ------------------
export function Orders() {
  const [activeTab, setActiveTab] = useState<"restaurant" | "grocery">("restaurant");

  // ── Restaurant orders state ──
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [selected, setSelected] = useState<Order | null>(null);

  // ── Grocery orders state ──
  const [groceryStatus, setGroceryStatus] = useState<GroceryOrderStatus>("all");
  const [groceryOrders, setGroceryOrders] = useState<GroceryOrder[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(true);
  const [groceryError, setGroceryError] = useState<string | null>(null);
  const [groceryQuery, setGroceryQuery] = useState("");
  const debouncedGroceryQuery = useDebounced(groceryQuery);
  const [selectedGrocery, setSelectedGrocery] = useState<GroceryOrder | null>(null);
  const [updatingGroceryStatusId, setUpdatingGroceryStatusId] = useState<string | null>(null);

  // Delivery partners for assignment when moving to out_for_delivery
  const [assignOpen, setAssignOpen] = useState(false);
  const [dpList, setDpList] = useState<DeliveryPartner[]>([]);
  const [dpLoading, setDpLoading] = useState(false);
  const [dpError, setDpError] = useState<string | null>(null);
  const [dpSelectedId, setDpSelectedId] = useState<string>("");
  const [pendingOutForDeliveryOrder, setPendingOutForDeliveryOrder] = useState<Order | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await adminApi.getAllOrders();
        if (!isMounted) return;
        const sorted = [...(data?.orders ?? [])].sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted as Order[]);
      } catch (e: any) {
        if (!isMounted) return;
        console.error("Error fetching orders:", e);
        setError("Failed to load orders. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for new orders via socket
  useEffect(() => {
    const unsubscribe = subscribeToEvent<Order>(SOCKET_EVENTS.NEW_ORDER, () => {
      // Refetch all orders to ensure we have the latest data
      adminApi.getAllOrders()
        .then((data) => {
          const sorted = [...(data?.orders ?? [])].sort(
            (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted as Order[]);
        })
        .catch((err) => {
          console.error('Error refetching orders after socket event:', err);
        });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Fetch grocery orders
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await adminApi.getAllGroceryOrders();
        if (!isMounted) return;
        const sorted = [...(data?.orders ?? [])].sort(
          (a: GroceryOrder, b: GroceryOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setGroceryOrders(sorted);
      } catch (e: any) {
        if (!isMounted) return;
        setGroceryError("Failed to load grocery orders.");
      } finally {
        if (isMounted) setGroceryLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Listen for new / updated grocery orders via socket
  useEffect(() => {
    const unsubNew = subscribeToEvent<GroceryOrder>(SOCKET_EVENTS.NEW_GROCERY_ORDER, () => {
      adminApi.getAllGroceryOrders()
        .then((data) => {
          const sorted = [...(data?.orders ?? [])].sort(
            (a: GroceryOrder, b: GroceryOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setGroceryOrders(sorted);
        })
        .catch((err) => console.error('Error refetching grocery orders after socket event:', err));
    });

    const unsubUpdated = subscribeToEvent<GroceryOrder>(SOCKET_EVENTS.GROCERY_ORDER_UPDATED, (updated) => {
      setGroceryOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, orderStatus: (updated as any).order_status ?? o.orderStatus } : o))
      );
    });

    return () => {
      unsubNew?.();
      unsubUpdated?.();
    };
  }, []);

  // Fetch delivery partners when assignment dialog opens
  useEffect(() => {
    let alive = true;
    const fetchDPs = async () => {
      if (!assignOpen) return;
      setDpLoading(true);
      setDpError(null);
      try {
        const rawData = await adminApi.getAllDeliveryPartners(undefined, 'true');
        if (!alive) return;

        const normalized: DeliveryPartner[] = (rawData ?? []).map((d: any) => ({
          id: d.id,
          fullName: d.fullName ?? null,
          phoneNumber: d.phoneNumber ?? null,
        }));

        setDpList(normalized);
      } catch {
        if (!alive) return;
        setDpError("Failed to load delivery partners");
      } finally {
        if (alive) setDpLoading(false);
      }
    };
    fetchDPs();
    return () => {
      alive = false;
    };
  }, [assignOpen]);

  // Derived counts for quick-glance KPIs
  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    let revenue = 0;
    for (const o of orders) {
      counts[o.orderStatus] = (counts[o.orderStatus] ?? 0) + 1;
      revenue += Number(o.finalAmountPaid ?? o.totalPaymentAmount ?? 0);
    }
    return {
      counts,
      total: orders.length,
      revenue,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let out = orders;
    if (status !== "all") out = out.filter((o) => o.orderStatus === status);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      out = out.filter((o) => {
        return (
          o.id.toLowerCase().includes(q) ||
          (o.customerName?.toLowerCase() ?? "").includes(q) ||
          (o.customerPhone?.toLowerCase() ?? "").includes(q) ||
          (o.restaurantName?.toLowerCase() ?? "").includes(q) ||
          (o.deliveryPartnerName?.toLowerCase() ?? "").includes(q)
        );
      });
    }
    return out;
  }, [orders, status, debouncedQuery]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* clipboard not available */ }
  };

  const openMapsUrl = (o: Order) => {
    const lat = o.deliveryLatitude;
    const lng = o.deliveryLongitude;
    const q = encodeURIComponent(`${lat},${lng}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  // --- Status update handler ---
  const handleStatusChange = async (
    order: Order,
    newStatus: OrderStatus
  ) => {
    if (newStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
      // Open assignment dialog; require a DP selection for admins per backend
      setPendingOutForDeliveryOrder(order);
      setDpSelectedId(order.deliveryPartnerId || "");
      setAssignOpen(true);
      return;
    }

    const prev = order.orderStatus;
    setUpdatingStatusId(order.id);
    try {
      // optimistic UI update
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, orderStatus: newStatus } : o)));
      
      // Use helper to get status code
      const result = await apiRequestWithStatus(`/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus }),
      });
      
      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
        setSelected((sel) => (sel && sel.id === order.id ? { ...sel, orderStatus: newStatus } : sel));
      } else {
        // revert on failure
        setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, orderStatus: prev } : o)));
        setSelected((sel) => (sel && sel.id === order.id ? { ...sel, orderStatus: prev } : sel));
        // Show red toast for error
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (e: any) {
      // revert on failure
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, orderStatus: prev } : o)));
      setSelected((sel) => (sel && sel.id === order.id ? { ...sel, orderStatus: prev } : sel));
      // Show error toast for unexpected errors
      const errorMessage = e?.message || "Failed to update order status";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // --- Confirm out_for_delivery with selected DP ---
  const confirmOutForDelivery = async () => {
    if (!pendingOutForDeliveryOrder || !dpSelectedId) return;
    setUpdatingStatusId(pendingOutForDeliveryOrder.id);
    const prev = pendingOutForDeliveryOrder.orderStatus;
    const prevDpId = pendingOutForDeliveryOrder.deliveryPartnerId;
    const prevDpName = pendingOutForDeliveryOrder.deliveryPartnerName;
    const prevDpPhone = pendingOutForDeliveryOrder.deliveryPartnerPhone;
    
    try {
      // optimistic update for UI
      const chosen = dpList.find((d) => d.id === dpSelectedId);
      setOrders((os) =>
        os.map((o) =>
          o.id === pendingOutForDeliveryOrder.id
            ? {
                ...o,
                orderStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
                deliveryPartnerId: dpSelectedId,
                deliveryPartnerName: chosen?.fullName || o.deliveryPartnerName || null,
                deliveryPartnerPhone: chosen?.phoneNumber || o.deliveryPartnerPhone || null,
              }
            : o
        )
      );
      
      // Use helper to get status code
      const result = await apiRequestWithStatus(`/orders/${pendingOutForDeliveryOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          newStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
          deliveryPartnerId: dpSelectedId,
        }),
      });
      
      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
        setSelected((sel) =>
          sel && sel.id === pendingOutForDeliveryOrder.id
            ? {
                ...sel,
                orderStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
                deliveryPartnerId: dpSelectedId,
                deliveryPartnerName: chosen?.fullName || sel.deliveryPartnerName,
                deliveryPartnerPhone: chosen?.phoneNumber || sel.deliveryPartnerPhone,
              }
            : sel
        );
        setAssignOpen(false);
        setPendingOutForDeliveryOrder(null);
        setDpSelectedId("");
      } else {
        // revert on failure
        setOrders((os) =>
          os.map((o) =>
            o.id === pendingOutForDeliveryOrder.id
              ? {
                  ...o,
                  orderStatus: prev,
                  deliveryPartnerId: prevDpId,
                  deliveryPartnerName: prevDpName,
                  deliveryPartnerPhone: prevDpPhone,
                }
              : o
          )
        );
        // Show red toast for error
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (e: any) {
      // On failure, revert optimistic change
      setOrders((os) =>
        os.map((o) =>
          o.id === pendingOutForDeliveryOrder.id
            ? {
                ...o,
                orderStatus: prev,
                deliveryPartnerId: prevDpId,
                deliveryPartnerName: prevDpName,
                deliveryPartnerPhone: prevDpPhone,
              }
            : o
        )
      );
      // Show error toast for unexpected errors
      const errorMessage = e?.message || "Failed to update order status";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Grocery filtered list
  const filteredGrocery = useMemo(() => {
    let out = groceryOrders;
    if (groceryStatus !== "all") out = out.filter((o) => o.orderStatus === groceryStatus);
    if (debouncedGroceryQuery.trim()) {
      const q = debouncedGroceryQuery.trim().toLowerCase();
      out = out.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customerName?.toLowerCase() ?? "").includes(q) ||
        (o.customerPhone?.toLowerCase() ?? "").includes(q) ||
        (o.storeNameSnapshot?.toLowerCase() ?? "").includes(q)
      );
    }
    return out;
  }, [groceryOrders, groceryStatus, debouncedGroceryQuery]);

  // Grocery status update handler
  const handleGroceryStatusChange = async (order: GroceryOrder, newStatus: string) => {
    const prev = order.orderStatus;
    setUpdatingGroceryStatusId(order.id);
    setGroceryOrders((os) => os.map((o) => o.id === order.id ? { ...o, orderStatus: newStatus } : o));
    try {
      await adminApi.updateGroceryOrderStatus(order.id, newStatus);
      setSelectedGrocery((sel) => sel && sel.id === order.id ? { ...sel, orderStatus: newStatus } : sel);
      toast.success(`Status updated to ${groceryStatusLabel(newStatus)}`, { position: "top-right", autoClose: 3000 });
    } catch (e: any) {
      setGroceryOrders((os) => os.map((o) => o.id === order.id ? { ...o, orderStatus: prev } : o));
      setSelectedGrocery((sel) => sel && sel.id === order.id ? { ...sel, orderStatus: prev } : sel);
      toast.error(e?.message || "Failed to update status", { position: "top-right", autoClose: 3000 });
    } finally {
      setUpdatingGroceryStatusId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "restaurant" ? "default" : "outline"}
          className="gap-2"
          onClick={() => setActiveTab("restaurant")}
        >
          <Truck className="h-4 w-4" /> Restaurant Orders
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {orders.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "grocery" ? "default" : "outline"}
          className="gap-2"
          onClick={() => setActiveTab("grocery")}
        >
          <ShoppingCart className="h-4 w-4" /> Grocery Orders
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {groceryOrders.length}
          </span>
        </Button>
      </div>

      {activeTab === "grocery" ? (
        /* ────── GROCERY ORDERS PANEL ────── */
        <div className="grid gap-4">
          <Card className="rounded-2xl">
            <CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 col-span-2">
                <Input
                  value={groceryQuery}
                  onChange={(e) => setGroceryQuery(e.target.value)}
                  placeholder="Search by ID, customer, store, phone"
                  aria-label="Search grocery orders"
                />
                <Select value={groceryStatus} onValueChange={(v) => setGroceryStatus(v as GroceryOrderStatus)}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {GROCERY_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{groceryStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">{groceryOrders.length}</div>
                </div>
                <div className="rounded-xl border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Revenue</div>
                  <div className="text-lg font-semibold">
                    {formatINR(groceryOrders.reduce((s, o) => s + Number(o.totalPaymentAmount || 0), 0))}
                  </div>
                </div>
                <div className="rounded-xl border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Delivered</div>
                  <div className="text-lg font-semibold">
                    {groceryOrders.filter((o) => o.orderStatus === "delivered").length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-0"><CardTitle>Grocery Orders</CardTitle></CardHeader>
            <CardContent>
              {groceryLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading grocery orders…
                </div>
              ) : groceryError ? (
                <div className="text-center py-8 text-destructive">{groceryError}</div>
              ) : filteredGrocery.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No grocery orders found</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrocery.map((o) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setSelectedGrocery(o)}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedGrocery(o); }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{o.id.substring(0, 8)}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); copy(o.id); }} aria-label="Copy order id">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium truncate max-w-[160px]">{o.customerName || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{o.customerPhone || "-"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-[180px]">{o.storeNameSnapshot || "N/A"}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {Number(o.totalPaymentAmount || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={o.orderStatus}
                              onValueChange={(v) => handleGroceryStatusChange(o, v)}
                              disabled={updatingGroceryStatusId === o.id}
                            >
                              <SelectTrigger className="h-7 w-[170px] text-xs px-2">
                                {updatingGroceryStatusId === o.id ? (
                                  <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Updating…</span>
                                ) : (
                                  <Badge variant={groceryStatusVariant(o.orderStatus)} className="capitalize whitespace-nowrap text-xs">
                                    {groceryStatusLabel(o.orderStatus)}
                                  </Badge>
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {GROCERY_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                                  <SelectItem key={s} value={s}>{groceryStatusLabel(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{timeAgo(o.createdAt)}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableCaption>{filteredGrocery.length} grocery orders listed</TableCaption>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grocery Order Detail Sheet */}
          <Sheet open={!!selectedGrocery} onOpenChange={(open) => !open && setSelectedGrocery(null)}>
            <SheetContent side="right" className="w-full px-2 sm:max-w-xl lg:max-w-2xl overflow-y-auto">
              {selectedGrocery && (
                <div className="space-y-4">
                  <SheetHeader>
                    <SheetTitle>Grocery Order #{selectedGrocery.id}</SheetTitle>
                  </SheetHeader>

                  {/* Status update */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedGrocery.orderStatus}
                      onValueChange={(v) => handleGroceryStatusChange(selectedGrocery, v)}
                    >
                      <SelectTrigger className="w-[240px]"><SelectValue placeholder="Update status" /></SelectTrigger>
                      <SelectContent>
                        {GROCERY_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                          <SelectItem key={s} value={s}>{groceryStatusLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updatingGroceryStatusId === selectedGrocery.id && (
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Updating…
                      </span>
                    )}
                  </div>

                  {/* Overview */}
                  <Card className="rounded-xl">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoRow label="Order ID" value={selectedGrocery.id} copyable />
                      <InfoRow label="Created" value={formatDateTime(selectedGrocery.createdAt)} />
                      <InfoRow label="Payment Method" value={selectedGrocery.paymentMethod || "-"} />
                      <InfoRow label="Payment Status" value={selectedGrocery.paymentStatus}
                        icon={selectedGrocery.paymentStatus === "paid"
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : selectedGrocery.paymentStatus === "failed"
                          ? <XCircle className="h-4 w-4 text-destructive" />
                          : <Clock className="h-4 w-4" />} />
                    </CardContent>
                  </Card>

                  {/* Amounts */}
                  <Card className="rounded-xl">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Bill Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <MoneyRow label="Items" value={selectedGrocery.totalItemsAmount} />
                      <MoneyRow label="Delivery" value={selectedGrocery.deliveryCharge} />
                      <MoneyRow label="Handling" value={selectedGrocery.handlingCharge} />
                      <MoneyRow label="Platform Commission" value={selectedGrocery.platformCommission} />
                      <MoneyRow label="GST" value={selectedGrocery.gstAmount} />
                      {Number(selectedGrocery.discountAmount || 0) > 0 && (
                        <div className="col-span-2 flex justify-between items-center text-emerald-600 text-sm">
                          <span>Discount</span>
                          <span className="font-medium">-{formatINR(selectedGrocery.discountAmount)}</span>
                        </div>
                      )}
                      <Separator className="col-span-2" />
                      <MoneyRow label="Total Collected from Customer" value={selectedGrocery.totalPaymentAmount} bold />
                    </CardContent>
                  </Card>

                  {/* Items */}
                  <Card className="rounded-xl">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Items</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {selectedGrocery.items?.length > 0 ? selectedGrocery.items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <div>
                            <div className="text-sm font-medium">{item.itemName}</div>
                            <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />{Number(item.totalPrice).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @ {formatINR(item.unitPrice)} each
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-muted-foreground">No items found.</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* People & Places */}
                  <Card className="rounded-xl">
                    <CardHeader className="pb-2"><CardTitle className="text-base">People & Places</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium flex items-center gap-2"><User2 className="h-4 w-4" />Customer</div>
                          <div className="text-sm">{selectedGrocery.customerName || "-"}</div>
                          <div className="text-xs text-muted-foreground">{selectedGrocery.customerPhone || "-"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Store</div>
                          <div className="text-sm">{selectedGrocery.storeNameSnapshot || "-"}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" />Delivery Address</div>
                        <div className="text-sm leading-5 whitespace-pre-wrap">{selectedGrocery.deliveryAddressSnapshot || "-"}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      ) : (
      /* ────── RESTAURANT ORDERS PANEL ────── */
      <div className="grid gap-4">
      {/* Filters & KPIs */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* Search + Filter */}
          <div className="flex items-center gap-2 col-span-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, customer, restaurant, phone"
              aria-label="Search orders"
            />
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Statuses" : getStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Total Orders</div>
              <div className="text-lg font-semibold">{kpis.total}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-lg font-semibold">{formatINR(kpis.revenue)}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Delivered</div>
              <div className="text-lg font-semibold">{kpis.counts[ORDER_STATUS.DELIVERED] ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-0"><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Pickup Window</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(o)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelected(o);
                      }}
                      aria-label={`Open details for order ${o.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{o.id.substring(0, 8)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(o.id);
                            }}
                            aria-label="Copy order id"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User2 className="h-4 w-4" />
                          <div className="truncate">
                            <div className="font-medium truncate max-w-[180px]">{o.customerName || "N/A"}</div>
                            <a
                              href={o.customerPhone ? `tel:${o.customerPhone}` : undefined}
                              className={cn("text-xs text-muted-foreground", !o.customerPhone && "pointer-events-none")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {o.customerPhone || "-"}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[220px]">{o.restaurantName || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        {o.pickupTimeSlotStart && o.pickupTimeSlotEnd ? (
                          <div className="text-sm">
                            {o.pickupTimeSlotStart}–{o.pickupTimeSlotEnd}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {Number(o.finalAmountPaid ?? o.totalPaymentAmount ?? 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(o.orderStatus)} className="capitalize">
                          {getStatusLabel(o.orderStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{timeAgo(o.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{filtered.length} orders listed</TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={!!selected} onOpenChange={(open: boolean) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full px-2 sm:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-[1200px] overflow-y-auto">
          {selected && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>Order #{selected.id}</span>
                </SheetTitle>
              </SheetHeader>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selected.orderStatus}
                  onValueChange={(v) => handleStatusChange(selected, v as OrderStatus)}
                >
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="Update status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {getStatusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {updatingStatusId === selected.id && (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Updating…
                  </span>
                )}

                <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) { setPendingOutForDeliveryOrder(null); setDpSelectedId(""); } }}>
                  <DialogTrigger asChild>
                    {/* Hidden trigger; dialog opens programmatically when choosing out_for_delivery */}
                    <span />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set "Out for delivery"</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-1">
                        <Label htmlFor="dp">Select delivery partner</Label>
                        <Select value={dpSelectedId} onValueChange={setDpSelectedId}>
                          <SelectTrigger id="dp"><SelectValue placeholder={dpLoading ? "Loading…" : "Choose partner"} /></SelectTrigger>
                          <SelectContent>
                            {dpError && <div className="px-2 py-1 text-destructive text-sm">{dpError}</div>}
                            {dpList.map((dp) => (
                              <SelectItem key={dp.id} value={dp.id}>
                                {dp.fullName}{dp.phoneNumber ? ` • ${dp.phoneNumber}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={confirmOutForDelivery} disabled={!dpSelectedId || updatingStatusId !== null} className="gap-2">
                        {updatingStatusId && <Loader2 className="h-4 w-4 animate-spin"/>}
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Overview */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Order ID" value={selected.id} copyable />
                  <InfoRow label="Created" value={formatDateTime(selected.createdAt)} />
                  <InfoRow label="Payment" value={selected.paymentStatus} icon={
                    selected.paymentStatus === "paid" ? <CheckCircle2 className="h-4 w-4"/> : selected.paymentStatus === "failed" ? <XCircle className="h-4 w-4"/> : <Clock className="h-4 w-4"/>} />
                  <InfoRow label="Txn ID" value={selected.paymentTransactionId || "-"} copyable />
                </CardContent>
              </Card>

              {/* Money */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Bill Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <MoneyRow label="Bag Amount" value={selected.totalBagAmount} />
                  <MoneyRow label="Delivery Fee" value={selected.deliveryFee} />
                  <MoneyRow label="Platform Commission" value={selected.platformCommission} />
                  <div className="col-span-2 text-xs text-muted-foreground">Subtotal incl. GST & handling</div>
                  <MoneyRow label="Subtotal" value={selected.totalPaymentAmount} />
                  {Number(selected.discountAmount || 0) > 0 && (
                    <div className="col-span-2 flex justify-between items-center text-emerald-600 text-sm">
                      <span>Discount{selected.couponCode ? ` (${selected.couponCode})` : ''}</span>
                      <span className="font-medium">-{formatINR(selected.discountAmount)}</span>
                    </div>
                  )}
                  {Number(selected.walletAmountUsed || 0) > 0 && (
                    <div className="col-span-2 flex justify-between items-center text-emerald-600 text-sm">
                      <span>Wallet Used</span>
                      <span className="font-medium">-{formatINR(selected.walletAmountUsed)}</span>
                    </div>
                  )}
                  <Separator className="col-span-2"/>
                  <MoneyRow
                    label="Total Collected from Customer"
                    value={selected.finalAmountPaid ?? selected.totalPaymentAmount}
                    bold
                  />
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selected.items && selected.items.length > 0 ? (
                    <div className="space-y-2">
                      {selected.items.map((item, index) => (
                        <div
                          key={item.bagId || index}
                          className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{item.bagName}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1 py-0.5",
                                  item.bagIsVegetarian
                                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                    : "border-red-300 text-red-700 bg-red-50"
                                )}
                              >
                                {item.bagIsVegetarian ? "Veg" : "Non-veg"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="text-right text-sm space-y-1">
                            <div className="flex items-center justify-end gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {Number(item.pricePaid || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Worth {formatINR(item.actualWorth || 0)}
                            </div>
                            {typeof item.co2SavedKg === "number" && item.co2SavedKg > 0 && (
                              <div className="text-[11px] text-emerald-600">
                                CO₂ saved: {item.co2SavedKg} kg
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No items found for this order.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Parties */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">People & Places</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><User2 className="h-4 w-4"/>Customer</div>
                      <div className="text-sm">{selected.customerName || "-"}</div>
                      <a className="text-xs text-muted-foreground inline-flex items-center gap-1" href={selected.customerPhone ? `tel:${selected.customerPhone}` : undefined} onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3 w-3"/>{selected.customerPhone || "-"}
                      </a>
                      <div className="text-xs text-muted-foreground">{selected.customerEmailSnapshot || ""}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Restaurant</div>
                      <div className="text-sm">{selected.restaurantName || "-"}</div>
                      <div className="text-xs text-muted-foreground">Contact: {selected.restaurantContactPerson || "-"}</div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4"/>Delivery Partner</div>
                      <div className="text-sm">{selected.deliveryPartnerName || "Unassigned"}</div>
                      <a className={cn("text-xs text-muted-foreground inline-flex items-center gap-1", !selected.deliveryPartnerPhone && "pointer-events-none")}
                         href={selected.deliveryPartnerPhone ? `tel:${selected.deliveryPartnerPhone}` : undefined}
                         onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3 w-3"/>{selected.deliveryPartnerPhone || "-"}
                      </a>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4"/>Delivery Address</div>
                      <div className="text-sm leading-5 whitespace-pre-wrap">{selected.deliveryAddressSnapshot}</div>
                      <a className="text-xs text-muted-foreground inline-flex items-center gap-1" href={openMapsUrl(selected)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        Open in Maps <ExternalLink className="h-3 w-3"/>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timing */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Timing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <InfoRow label="Order Date" value={formatDateTime(selected.orderDate)} />
                  <InfoRow label="Pickup Window" value={
                    selected.pickupTimeSlotStart && selected.pickupTimeSlotEnd
                      ? `${selected.pickupTimeSlotStart}–${selected.pickupTimeSlotEnd}`
                      : "-"
                  } />
                  <InfoRow label="Expected Delivery" value={formatDateTime(selected.expectedDeliveryTime)} />
                  <InfoRow label="Actual Delivery" value={formatDateTime(selected.actualDeliveryTime)} />
                </CardContent>
              </Card>

              {/* Notes / Cancellation */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm whitespace-pre-wrap min-h-[20px]">
                    {selected.notesToRestaurant || <span className="text-muted-foreground">No notes</span>}
                  </div>
                  {selected.cancellationReason && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                      <div className="font-medium mb-1">Cancellation</div>
                      <div className="text-sm">{selected.cancellationReason}</div>
                      <div className="text-xs text-muted-foreground mt-1">By: {selected.cancelledByUserType || "-"}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
    )}
    </div>
  );
}

// ------------------ Subcomponents ------------------
function InfoRow({ label, value, copyable, icon }: { label: string; value: string | number; copyable?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm max-w-[220px] truncate" title={String(value)}>{String(value)}</div>
        {copyable && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={async () => {
              try { await navigator.clipboard.writeText(String(value)); } catch { /* clipboard not available */ }
            }}
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MoneyRow({ label, value, bold }: { label: string; value: string | number; bold?: boolean }) {
  const v = typeof value === "string" ? Number(value) : value;
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("flex items-center gap-1 text-sm", bold && "font-semibold")}> <IndianRupee className="h-3 w-3"/>{v.toFixed(2)}</div>
    </div>
  );
}
