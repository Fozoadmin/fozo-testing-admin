import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, X, ChevronDown, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

type Coupon = {
  id: string;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  restaurantId: string | null;
  restaurantName?: string | null;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

type RestaurantLite = {
  id?: string;
  restaurantId?: string;
  restaurantName?: string;
  status?: string;
  userEmail?: string;
  phoneNumber?: string;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

export function Coupons() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");

  // Restaurant dropdown states (reused pattern from SurpriseBags)
  const [allRestaurants, setAllRestaurants] = useState<RestaurantLite[]>([]);
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearchFilter, setRestaurantSearchFilter] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantLite | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "flat" as "flat" | "percentage",
    discountValue: "",
    restaurantId: "", // internal: filled when restaurant selected
    minOrderValue: "0",
    maxDiscountAmount: "",
    usageLimit: "100000",
    expiresAt: "", // datetime-local string
    isActive: true,
  });

  const loadCoupons = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await adminApi.getAllCoupons();
      setCoupons((data.coupons || []) as Coupon[]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load coupons");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await Promise.all([
        loadCoupons(false),
        (async () => {
          try {
            const restaurants = await adminApi.getAllRestaurants();
            if (!mounted) return;
            // Prefer approved restaurants for selection, but keep list if status missing.
            const approved = Array.isArray(restaurants)
              ? restaurants.filter((r: any) => !r.status || r.status === "approved")
              : [];
            setAllRestaurants(approved);
          } catch (e) {
            // Non-blocking: coupons page still works without restaurant lookup.
            console.warn("Failed to load restaurants for coupons:", e);
          }
        })(),
      ]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Click outside handler to close dropdown (same UX as SurpriseBags)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (restaurantDropdownOpen && !target.closest(".restaurant-dropdown-container")) {
        setRestaurantDropdownOpen(false);
      }
    };
    if (restaurantDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [restaurantDropdownOpen]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearchFilter.trim().toLowerCase();
    if (!q) return allRestaurants;
    return allRestaurants.filter((r) => {
      const name = (r.restaurantName || "").toLowerCase();
      const email = (r.userEmail || "").toLowerCase();
      const phone = (r.phoneNumber || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [allRestaurants, restaurantSearchFilter]);

  const selectRestaurant = (restaurant: RestaurantLite) => {
    setSelectedRestaurant(restaurant);
    const rid = (restaurant.restaurantId || restaurant.id || "").toString();
    setForm((s) => ({ ...s, restaurantId: rid }));
    setRestaurantDropdownOpen(false);
    setRestaurantSearchFilter("");
  };

  const clearSelectedRestaurant = () => {
    setSelectedRestaurant(null);
    setForm((s) => ({ ...s, restaurantId: "" }));
    setRestaurantSearchFilter("");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  const onCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error("Coupon code is required");
    if (!form.discountValue) return toast.error("Discount value is required");

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) return toast.error("Discount value must be > 0");
    if (form.discountType === "percentage" && discountValue > 100) return toast.error("Percentage cannot exceed 100");

    const minOrderValue = Number(form.minOrderValue || "0");
    const usageLimit = Number(form.usageLimit || "100000");
    const maxDiscountAmount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null;

    const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;

    setCreating(true);
    try {
      await adminApi.createCoupon({
        code,
        discountType: form.discountType,
        discountValue,
        restaurantId: form.restaurantId?.trim() ? form.restaurantId.trim() : null,
        minOrderValue,
        maxDiscountAmount: maxDiscountAmount && Number.isFinite(maxDiscountAmount) ? maxDiscountAmount : null,
        usageLimit,
        expiresAt,
        isActive: form.isActive,
      });
      toast.success("Coupon created");
      setOpenCreate(false);
      setForm({
        code: "",
        discountType: "flat",
        discountValue: "",
        restaurantId: "",
        minOrderValue: "0",
        maxDiscountAmount: "",
        usageLimit: "100000",
        expiresAt: "",
        isActive: true,
      });
      setSelectedRestaurant(null);
      setRestaurantSearchFilter("");
      setRestaurantDropdownOpen(false);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue ?? ""),
      restaurantId: coupon.restaurantId ?? "",
      minOrderValue: String(coupon.minOrderValue ?? 0),
      maxDiscountAmount: coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined ? "" : String(coupon.maxDiscountAmount),
      usageLimit: String(coupon.usageLimit ?? 100000),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive,
    });

    if (coupon.restaurantId) {
      const match = allRestaurants.find((r) => (r.restaurantId || r.id) === coupon.restaurantId);
      setSelectedRestaurant(match || { restaurantId: coupon.restaurantId, restaurantName: coupon.restaurantName || "Restaurant" });
    } else {
      setSelectedRestaurant(null);
    }

    setRestaurantSearchFilter("");
    setRestaurantDropdownOpen(false);
    setOpenEdit(true);
  };

  const onUpdate = async () => {
    if (!selectedCoupon) return;
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error("Coupon code is required");
    if (!form.discountValue) return toast.error("Discount value is required");

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) return toast.error("Discount value must be > 0");
    if (form.discountType === "percentage" && discountValue > 100) return toast.error("Percentage cannot exceed 100");

    const minOrderValue = Number(form.minOrderValue || "0");
    const usageLimit = Number(form.usageLimit || "100000");
    const maxDiscountAmount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null;
    const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;

    setEditing(true);
    try {
      await adminApi.updateCoupon(selectedCoupon.id, {
        code,
        discountType: form.discountType,
        discountValue,
        restaurantId: form.restaurantId?.trim() ? form.restaurantId.trim() : null,
        minOrderValue,
        maxDiscountAmount: maxDiscountAmount && Number.isFinite(maxDiscountAmount) ? maxDiscountAmount : null,
        usageLimit,
        expiresAt,
        isActive: form.isActive,
      });
      toast.success("Coupon updated");
      setOpenEdit(false);
      setSelectedCoupon(null);
      setSelectedRestaurant(null);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update coupon");
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setOpenDelete(true);
  };

  const onDelete = async () => {
    if (!selectedCoupon) return;
    setDeleting(true);
    try {
      await adminApi.deleteCoupon(selectedCoupon.id);
      toast.success("Coupon deleted");
      setOpenDelete(false);
      setSelectedCoupon(null);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (coupon: Coupon, next: boolean) => {
    const optimistic = coupons.map((c) => (c.id === coupon.id ? { ...c, isActive: next } : c));
    setCoupons(optimistic);
    try {
      await adminApi.setCouponActive(coupon.id, next);
      toast.success(`Coupon ${next ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update coupon");
      // rollback
      setCoupons(coupons);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coupons</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage coupons used across customer checkout and validation APIs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                setRefreshing(true);
                await loadCoupons(true);
                setRefreshing(false);
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                  <DialogDescription>
                    Coupons can be global (no restaurantId) or restaurant-specific. Customers can apply one discount per order.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                      placeholder="DEMO50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={form.discountType}
                      onValueChange={(v) => setForm((s) => ({ ...s, discountType: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Discount Value {form.discountType === "percentage" ? "(%)" : "(₹)"}
                    </Label>
                    <Input
                      value={form.discountValue}
                      onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))}
                      placeholder={form.discountType === "percentage" ? "10" : "50"}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Order Value (₹)</Label>
                    <Input
                      value={form.minOrderValue}
                      onChange={(e) => setForm((s) => ({ ...s, minOrderValue: e.target.value }))}
                      inputMode="decimal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Discount Amount (₹) (optional)</Label>
                    <Input
                      value={form.maxDiscountAmount}
                      onChange={(e) => setForm((s) => ({ ...s, maxDiscountAmount: e.target.value }))}
                      placeholder="200"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input
                      value={form.usageLimit}
                      onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expires At (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))}
                    />
                  </div>

                  {/* Restaurant Selection Dropdown (reused from SurpriseBags UX) */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Restaurant (optional)</Label>
                    {selectedRestaurant ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 border-border">
                        <div>
                          <div className="font-medium">{selectedRestaurant.restaurantName || "Selected Restaurant"}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedRestaurant.userEmail || selectedRestaurant.phoneNumber || ""}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={clearSelectedRestaurant}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative restaurant-dropdown-container">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setRestaurantDropdownOpen(!restaurantDropdownOpen);
                          }}
                          className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                        >
                          <div className="flex items-center flex-1">
                            <span className="text-muted-foreground">Global coupon (click to pick a restaurant)</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${restaurantDropdownOpen ? "rotate-180" : ""}`} />
                        </div>

                        {restaurantDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                            <div className="p-2 border-b">
                              <Input
                                placeholder="Search restaurants..."
                                value={restaurantSearchFilter}
                                onChange={(e) => setRestaurantSearchFilter(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-64 overflow-auto p-1" onClick={(e) => e.stopPropagation()}>
                              {filteredRestaurants.length === 0 ? (
                                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                                  No restaurants found
                                </div>
                              ) : (
                                filteredRestaurants.map((restaurant) => {
                                  const rid = (restaurant.restaurantId || restaurant.id || "").toString();
                                  return (
                                    <div
                                      key={rid}
                                      onClick={() => selectRestaurant(restaurant)}
                                      className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{restaurant.restaurantName}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {restaurant.userEmail || restaurant.phoneNumber || ""}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave empty for a global coupon. Restaurant-specific coupons only apply to that restaurant.
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:col-span-2 p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">Active</div>
                      <div className="text-xs text-muted-foreground">Inactive coupons won’t validate in checkout.</div>
                    </div>
                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button onClick={onCreate} disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search by code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading coupons...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Max Cap</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => {
                    const expired = !!c.expiresAt && new Date(c.expiresAt) <= new Date();
                    const restaurantLabel =
                      c.restaurantId === null || c.restaurantId === "" ? "Global" : (c.restaurantName || "Restaurant");
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.code}</TableCell>
                        <TableCell>
                          {restaurantLabel === "Global" ? (
                            <Badge variant="secondary">Global</Badge>
                          ) : (
                            <span className="text-sm">{restaurantLabel}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.discountType}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        </TableCell>
                        <TableCell>₹{c.minOrderValue}</TableCell>
                        <TableCell>{c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : "—"}</TableCell>
                        <TableCell>
                          {c.usageCount}/{c.usageLimit}
                        </TableCell>
                        <TableCell>{formatDate(c.expiresAt)}</TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : c.isActive ? (
                            <Badge>Live</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(c)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(c)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={c.isActive}
                            onCheckedChange={(v) => toggleActive(c, v)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Coupon Dialog */}
      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setSelectedCoupon(null);
            setSelectedRestaurant(null);
            setRestaurantSearchFilter("");
            setRestaurantDropdownOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon fields. Deleting a used coupon is blocked; deactivate instead.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm((s) => ({ ...s, discountType: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discount Value {form.discountType === "percentage" ? "(%)" : "(₹)"}</Label>
              <Input
                value={form.discountValue}
                onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Order Value (₹)</Label>
              <Input
                value={form.minOrderValue}
                onChange={(e) => setForm((s) => ({ ...s, minOrderValue: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Discount Amount (₹) (optional)</Label>
              <Input
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((s) => ({ ...s, maxDiscountAmount: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input
                value={form.usageLimit}
                onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))}
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))} />
            </div>

            {/* Restaurant Selection Dropdown (same as create) */}
            <div className="space-y-2 md:col-span-2">
              <Label>Restaurant (optional)</Label>
              {selectedRestaurant ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 border-border">
                  <div>
                    <div className="font-medium">{selectedRestaurant.restaurantName || "Selected Restaurant"}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedRestaurant.userEmail || selectedRestaurant.phoneNumber || ""}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={clearSelectedRestaurant}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative restaurant-dropdown-container">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setRestaurantDropdownOpen(!restaurantDropdownOpen);
                    }}
                    className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-muted-foreground">Global coupon (click to pick a restaurant)</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${restaurantDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {restaurantDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search restaurants..."
                          value={restaurantSearchFilter}
                          onChange={(e) => setRestaurantSearchFilter(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-auto p-1" onClick={(e) => e.stopPropagation()}>
                        {filteredRestaurants.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-center text-muted-foreground">No restaurants found</div>
                        ) : (
                          filteredRestaurants.map((restaurant) => {
                            const rid = (restaurant.restaurantId || restaurant.id || "").toString();
                            return (
                              <div
                                key={rid}
                                onClick={() => selectRestaurant(restaurant)}
                                className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{restaurant.restaurantName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {restaurant.userEmail || restaurant.phoneNumber || ""}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between md:col-span-2 p-3 rounded-lg border">
              <div>
                <div className="font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Inactive coupons won’t validate in checkout.</div>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={editing}>
              Cancel
            </Button>
            <Button onClick={onUpdate} disabled={editing}>
              {editing ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{selectedCoupon?.code || "this coupon"}</span>? This action cannot be undone.
              <div className="text-xs text-muted-foreground mt-2">
                Note: if a coupon has already been used, delete is blocked; deactivate it instead.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


