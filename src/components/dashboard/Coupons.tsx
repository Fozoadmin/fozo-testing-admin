/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RefreshCw, X, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

type Coupon = {
  id: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  restaurantId: string | null;
  restaurantName?: string | null;
  groceryStoreId: string | null;
  groceryStoreName?: string | null;
  applicableTo: 'restaurant' | 'grocery' | 'both';
  minOrderValue: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  visibility: boolean;
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

type GroceryStoreLite = {
  id: string;
  storeName: string;
  status?: string;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
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
  const [search, setSearch] = useState('');

  // Restaurant dropdown states
  const [allRestaurants, setAllRestaurants] = useState<RestaurantLite[]>([]);
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearchFilter, setRestaurantSearchFilter] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantLite | null>(null);

  // Grocery store dropdown states
  const [allGroceryStores, setAllGroceryStores] = useState<GroceryStoreLite[]>([]);
  const [groceryDropdownOpen, setGroceryDropdownOpen] = useState(false);
  const [grocerySearchFilter, setGrocerySearchFilter] = useState('');
  const [selectedGroceryStore, setSelectedGroceryStore] = useState<GroceryStoreLite | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'flat' as 'flat' | 'percentage',
    discountValue: '',
    applicableTo: 'restaurant' as 'restaurant' | 'grocery' | 'both',
    restaurantId: '',
    groceryStoreId: '',
    minOrderValue: '0',
    maxDiscountAmount: '',
    usageLimit: '100000',
    expiresAt: '',
    isActive: true,
    visibility: true,
  });

  const loadCoupons = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await adminApi.getAllCoupons();
      setCoupons((data.coupons || []) as Coupon[]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load coupons');
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
            const approved = Array.isArray(restaurants)
              ? restaurants.filter((r: any) => !r.status || r.status === 'approved')
              : [];
            setAllRestaurants(approved);
          } catch (e) {
            console.warn('Failed to load restaurants for coupons:', e);
          }
        })(),
        (async () => {
          try {
            const stores = await adminApi.getAllGroceryStores();
            if (!mounted) return;
            const storeList = Array.isArray(stores) ? stores : [];
            setAllGroceryStores(
              storeList.map((s: any) => ({
                id: s.id,
                storeName: s.storeName || s.store_name,
                status: s.status,
              }))
            );
          } catch (e) {
            console.warn('Failed to load grocery stores for coupons:', e);
          }
        })(),
      ]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (restaurantDropdownOpen && !target.closest('.restaurant-dropdown-container')) {
        setRestaurantDropdownOpen(false);
      }
      if (groceryDropdownOpen && !target.closest('.grocery-dropdown-container')) {
        setGroceryDropdownOpen(false);
      }
    };
    if (restaurantDropdownOpen || groceryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [restaurantDropdownOpen, groceryDropdownOpen]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearchFilter.trim().toLowerCase();
    if (!q) return allRestaurants;
    return allRestaurants.filter(r => {
      const name = (r.restaurantName || '').toLowerCase();
      const email = (r.userEmail || '').toLowerCase();
      const phone = (r.phoneNumber || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [allRestaurants, restaurantSearchFilter]);

  const filteredGroceryStores = useMemo(() => {
    const q = grocerySearchFilter.trim().toLowerCase();
    if (!q) return allGroceryStores;
    return allGroceryStores.filter(s => (s.storeName || '').toLowerCase().includes(q));
  }, [allGroceryStores, grocerySearchFilter]);

  const selectRestaurant = (restaurant: RestaurantLite) => {
    setSelectedRestaurant(restaurant);
    const rid = (restaurant.restaurantId || restaurant.id || '').toString();
    setForm(s => ({ ...s, restaurantId: rid }));
    setRestaurantDropdownOpen(false);
    setRestaurantSearchFilter('');
  };

  const clearSelectedRestaurant = () => {
    setSelectedRestaurant(null);
    setForm(s => ({ ...s, restaurantId: '' }));
    setRestaurantSearchFilter('');
  };

  const selectGroceryStore = (store: GroceryStoreLite) => {
    setSelectedGroceryStore(store);
    setForm(s => ({ ...s, groceryStoreId: store.id }));
    setGroceryDropdownOpen(false);
    setGrocerySearchFilter('');
  };

  const clearSelectedGroceryStore = () => {
    setSelectedGroceryStore(null);
    setForm(s => ({ ...s, groceryStoreId: '' }));
    setGrocerySearchFilter('');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(c => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  const onCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error('Coupon code is required');
    if (!form.discountValue) return toast.error('Discount value is required');

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0)
      return toast.error('Discount value must be > 0');
    if (form.discountType === 'percentage' && discountValue > 100)
      return toast.error('Percentage cannot exceed 100');

    const minOrderValue = Number(form.minOrderValue || '0');
    const usageLimit = Number(form.usageLimit || '100000');
    const maxDiscountAmount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null;

    const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;

    setCreating(true);
    try {
      await adminApi.createCoupon({
        code,
        discountType: form.discountType,
        discountValue,
        applicableTo: form.applicableTo,
        restaurantId: form.restaurantId?.trim() ? form.restaurantId.trim() : null,
        groceryStoreId: form.groceryStoreId?.trim() ? form.groceryStoreId.trim() : null,
        minOrderValue,
        maxDiscountAmount:
          maxDiscountAmount && Number.isFinite(maxDiscountAmount) ? maxDiscountAmount : null,
        usageLimit,
        expiresAt,
        isActive: form.isActive,
        visibility: form.visibility,
      });
      toast.success('Coupon created');
      setOpenCreate(false);
      setForm({
        code: '',
        discountType: 'flat',
        discountValue: '',
        applicableTo: 'restaurant',
        restaurantId: '',
        groceryStoreId: '',
        minOrderValue: '0',
        maxDiscountAmount: '',
        usageLimit: '100000',
        expiresAt: '',
        isActive: true,
        visibility: true,
      });
      setSelectedRestaurant(null);
      setSelectedGroceryStore(null);
      setRestaurantSearchFilter('');
      setGrocerySearchFilter('');
      setRestaurantDropdownOpen(false);
      setGroceryDropdownOpen(false);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue ?? ''),
      applicableTo: coupon.applicableTo || 'restaurant',
      restaurantId: coupon.restaurantId ?? '',
      groceryStoreId: coupon.groceryStoreId ?? '',
      minOrderValue: String(coupon.minOrderValue ?? 0),
      maxDiscountAmount:
        coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
          ? ''
          : String(coupon.maxDiscountAmount),
      usageLimit: String(coupon.usageLimit ?? 100000),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive,
      visibility: coupon.visibility ?? true,
    });

    if (coupon.restaurantId) {
      const match = allRestaurants.find(r => (r.restaurantId || r.id) === coupon.restaurantId);
      setSelectedRestaurant(
        match || {
          restaurantId: coupon.restaurantId,
          restaurantName: coupon.restaurantName || 'Restaurant',
        }
      );
    } else {
      setSelectedRestaurant(null);
    }

    if (coupon.groceryStoreId) {
      const match = allGroceryStores.find(s => s.id === coupon.groceryStoreId);
      setSelectedGroceryStore(
        match || {
          id: coupon.groceryStoreId,
          storeName: coupon.groceryStoreName || 'Grocery Store',
        }
      );
    } else {
      setSelectedGroceryStore(null);
    }

    setRestaurantSearchFilter('');
    setGrocerySearchFilter('');
    setRestaurantDropdownOpen(false);
    setGroceryDropdownOpen(false);
    setOpenEdit(true);
  };

  const onUpdate = async () => {
    if (!selectedCoupon) return;
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error('Coupon code is required');
    if (!form.discountValue) return toast.error('Discount value is required');

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0)
      return toast.error('Discount value must be > 0');
    if (form.discountType === 'percentage' && discountValue > 100)
      return toast.error('Percentage cannot exceed 100');

    const minOrderValue = Number(form.minOrderValue || '0');
    const usageLimit = Number(form.usageLimit || '100000');
    const maxDiscountAmount = form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null;
    const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;

    setEditing(true);
    try {
      await adminApi.updateCoupon(selectedCoupon.id, {
        code,
        discountType: form.discountType,
        discountValue,
        applicableTo: form.applicableTo,
        restaurantId: form.restaurantId?.trim() ? form.restaurantId.trim() : null,
        groceryStoreId: form.groceryStoreId?.trim() ? form.groceryStoreId.trim() : null,
        minOrderValue,
        maxDiscountAmount:
          maxDiscountAmount && Number.isFinite(maxDiscountAmount) ? maxDiscountAmount : null,
        usageLimit,
        expiresAt,
        isActive: form.isActive,
        visibility: form.visibility,
      });
      toast.success('Coupon updated');
      setOpenEdit(false);
      setSelectedCoupon(null);
      setSelectedRestaurant(null);
      setSelectedGroceryStore(null);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update coupon');
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
      toast.success('Coupon deleted');
      setOpenDelete(false);
      setSelectedCoupon(null);
      await loadCoupons(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (coupon: Coupon, next: boolean) => {
    const optimistic = coupons.map(c => (c.id === coupon.id ? { ...c, isActive: next } : c));
    setCoupons(optimistic);
    try {
      await adminApi.setCouponActive(coupon.id, next);
      toast.success(`Coupon ${next ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update coupon');
      // rollback
      setCoupons(coupons);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Coupons</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Create and manage coupons used across customer checkout and validation APIs.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={async () => {
                setRefreshing(true);
                await loadCoupons(true);
                setRefreshing(false);
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                  <DialogDescription>
                    Coupons can be global (no restaurantId) or restaurant-specific. Customers can
                    apply one discount per order.
                  </DialogDescription>
                </DialogHeader>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Code</Label>
                    <Input
                      value={form.code}
                      onChange={e => setForm(s => ({ ...s, code: e.target.value }))}
                      placeholder='DEMO50'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Applies To</Label>
                    <Select
                      value={form.applicableTo}
                      onValueChange={v => {
                        setForm(s => ({
                          ...s,
                          applicableTo: v as any,
                          restaurantId: '',
                          groceryStoreId: '',
                        }));
                        setSelectedRestaurant(null);
                        setSelectedGroceryStore(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select applicability' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='restaurant'>Restaurant</SelectItem>
                        <SelectItem value='grocery'>Grocery</SelectItem>
                        <SelectItem value='both'>Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Discount Type</Label>
                    <Select
                      value={form.discountType}
                      onValueChange={v => setForm(s => ({ ...s, discountType: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='flat'>Flat</SelectItem>
                        <SelectItem value='percentage'>Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label>
                      Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </Label>
                    <Input
                      value={form.discountValue}
                      onChange={e => setForm(s => ({ ...s, discountValue: e.target.value }))}
                      placeholder={form.discountType === 'percentage' ? '10' : '50'}
                      inputMode='decimal'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Minimum Order Value (₹)</Label>
                    <Input
                      value={form.minOrderValue}
                      onChange={e => setForm(s => ({ ...s, minOrderValue: e.target.value }))}
                      inputMode='decimal'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Max Discount Amount (₹) (optional)</Label>
                    <Input
                      value={form.maxDiscountAmount}
                      onChange={e => setForm(s => ({ ...s, maxDiscountAmount: e.target.value }))}
                      placeholder='200'
                      inputMode='decimal'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Usage Limit</Label>
                    <Input
                      value={form.usageLimit}
                      onChange={e => setForm(s => ({ ...s, usageLimit: e.target.value }))}
                      inputMode='numeric'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Expires At (optional)</Label>
                    <Input
                      type='datetime-local'
                      value={form.expiresAt}
                      onChange={e => setForm(s => ({ ...s, expiresAt: e.target.value }))}
                    />
                  </div>

                  {/* Restaurant Dropdown — shown when applicableTo is restaurant or both */}
                  {(form.applicableTo === 'restaurant' || form.applicableTo === 'both') && (
                    <div className='space-y-2 md:col-span-2'>
                      <Label>Restaurant (optional)</Label>
                      {selectedRestaurant ? (
                        <div className='bg-muted/30 border-border flex items-center justify-between rounded-lg border p-3'>
                          <div>
                            <div className='font-medium'>
                              {selectedRestaurant.restaurantName || 'Selected Restaurant'}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {selectedRestaurant.userEmail || selectedRestaurant.phoneNumber || ''}
                            </div>
                          </div>
                          <Button size='sm' variant='ghost' onClick={clearSelectedRestaurant}>
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ) : (
                        <div className='restaurant-dropdown-container relative'>
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              setRestaurantDropdownOpen(!restaurantDropdownOpen);
                            }}
                            className='border-input bg-background hover:border-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm'
                          >
                            <span className='text-muted-foreground'>
                              All restaurants (click to pick one)
                            </span>
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${restaurantDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                          {restaurantDropdownOpen && (
                            <div className='bg-background border-input absolute z-50 mt-1 w-full rounded-md border shadow-lg'>
                              <div className='border-b p-2'>
                                <Input
                                  placeholder='Search restaurants...'
                                  value={restaurantSearchFilter}
                                  onChange={e => setRestaurantSearchFilter(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className='h-8'
                                  autoFocus
                                />
                              </div>
                              <div
                                className='max-h-64 overflow-auto p-1'
                                onClick={e => e.stopPropagation()}
                              >
                                {filteredRestaurants.length === 0 ? (
                                  <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                                    No restaurants found
                                  </div>
                                ) : (
                                  filteredRestaurants.map(restaurant => {
                                    const rid = (
                                      restaurant.restaurantId ||
                                      restaurant.id ||
                                      ''
                                    ).toString();
                                    return (
                                      <div
                                        key={rid}
                                        onClick={() => selectRestaurant(restaurant)}
                                        className='hover:bg-accent flex cursor-pointer items-center rounded px-2 py-1.5 text-sm'
                                      >
                                        <div className='flex-1'>
                                          <div className='font-medium'>
                                            {restaurant.restaurantName}
                                          </div>
                                          <div className='text-muted-foreground text-xs'>
                                            {restaurant.userEmail || restaurant.phoneNumber || ''}
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
                      <p className='text-muted-foreground text-xs'>
                        Leave empty to apply to all restaurants.
                      </p>
                    </div>
                  )}

                  {/* Grocery Store Dropdown — shown when applicableTo is grocery or both */}
                  {(form.applicableTo === 'grocery' || form.applicableTo === 'both') && (
                    <div className='space-y-2 md:col-span-2'>
                      <Label>Grocery Store (optional)</Label>
                      {selectedGroceryStore ? (
                        <div className='bg-muted/30 border-border flex items-center justify-between rounded-lg border p-3'>
                          <div className='font-medium'>{selectedGroceryStore.storeName}</div>
                          <Button size='sm' variant='ghost' onClick={clearSelectedGroceryStore}>
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ) : (
                        <div className='grocery-dropdown-container relative'>
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              setGroceryDropdownOpen(!groceryDropdownOpen);
                            }}
                            className='border-input bg-background hover:border-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm'
                          >
                            <span className='text-muted-foreground'>
                              All grocery stores (click to pick one)
                            </span>
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${groceryDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                          {groceryDropdownOpen && (
                            <div className='bg-background border-input absolute z-50 mt-1 w-full rounded-md border shadow-lg'>
                              <div className='border-b p-2'>
                                <Input
                                  placeholder='Search grocery stores...'
                                  value={grocerySearchFilter}
                                  onChange={e => setGrocerySearchFilter(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className='h-8'
                                  autoFocus
                                />
                              </div>
                              <div
                                className='max-h-64 overflow-auto p-1'
                                onClick={e => e.stopPropagation()}
                              >
                                {filteredGroceryStores.length === 0 ? (
                                  <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                                    No grocery stores found
                                  </div>
                                ) : (
                                  filteredGroceryStores.map(store => (
                                    <div
                                      key={store.id}
                                      onClick={() => selectGroceryStore(store)}
                                      className='hover:bg-accent cursor-pointer rounded px-2 py-1.5 text-sm'
                                    >
                                      <div className='font-medium'>{store.storeName}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <p className='text-muted-foreground text-xs'>
                        Leave empty to apply to all grocery stores.
                      </p>
                    </div>
                  )}

                  <div className='flex items-center justify-between rounded-lg border p-3 md:col-span-2'>
                    <div>
                      <div className='font-medium'>Active</div>
                      <div className='text-muted-foreground text-xs'>
                        Inactive coupons won’t validate in checkout.
                      </div>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={v => setForm(s => ({ ...s, isActive: v }))}
                    />
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-3 md:col-span-2'>
                    <div>
                      <div className='font-medium'>Visibility</div>
                      <div className='text-muted-foreground text-xs'>
                        Hidden coupons won’t appear in customer app but are still usable if code is
                        known.
                      </div>
                    </div>
                    <Switch
                      checked={form.visibility}
                      onCheckedChange={v => setForm(s => ({ ...s, visibility: v }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setOpenCreate(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={onCreate} disabled={creating}>
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex items-center gap-2'>
            <Input
              placeholder='Search by code...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='max-w-sm'
            />
          </div>

          {loading ? (
            <div className='text-muted-foreground text-sm'>Loading coupons...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Max Cap</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className='text-right'>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className='text-muted-foreground py-8 text-center'>
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(c => {
                    const expired = !!c.expiresAt && new Date(c.expiresAt) <= new Date();
                    const applicableToLabel =
                      c.applicableTo === 'both'
                        ? 'Both'
                        : c.applicableTo === 'grocery'
                          ? 'Grocery'
                          : 'Restaurant';
                    const storeLabel =
                      c.applicableTo === 'grocery' || c.applicableTo === 'both'
                        ? c.groceryStoreName || (c.groceryStoreId ? 'Grocery Store' : null)
                        : c.restaurantName || (c.restaurantId ? 'Restaurant' : null);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className='font-medium'>{c.code}</TableCell>
                        <TableCell>
                          <Badge variant={c.applicableTo === 'both' ? 'outline' : 'secondary'}>
                            {applicableToLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {storeLabel ? (
                            <span className='text-sm'>{storeLabel}</span>
                          ) : (
                            <Badge variant='secondary'>All</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{c.discountType}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}%`
                            : `₹${c.discountValue}`}
                        </TableCell>
                        <TableCell>₹{c.minOrderValue}</TableCell>
                        <TableCell>
                          {c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : '—'}
                        </TableCell>
                        <TableCell>
                          {c.usageCount}/{c.usageLimit}
                        </TableCell>
                        <TableCell>{formatDate(c.expiresAt)}</TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant='destructive'>Expired</Badge>
                          ) : c.isActive ? (
                            <Badge>Live</Badge>
                          ) : (
                            <Badge variant='secondary'>Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.visibility ? (
                            <Badge variant='outline'>Visible</Badge>
                          ) : (
                            <Badge variant='secondary'>Hidden</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 w-8 p-0'
                              onClick={() => openEditDialog(c)}
                              title='Edit'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive hover:text-destructive h-8 w-8 p-0'
                              onClick={() => openDeleteDialog(c)}
                              title='Delete'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Switch checked={c.isActive} onCheckedChange={v => toggleActive(c, v)} />
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
        onOpenChange={open => {
          setOpenEdit(open);
          if (!open) {
            setSelectedCoupon(null);
            setSelectedRestaurant(null);
            setSelectedGroceryStore(null);
            setRestaurantSearchFilter('');
            setGrocerySearchFilter('');
            setRestaurantDropdownOpen(false);
            setGroceryDropdownOpen(false);
          }
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update coupon fields. Deleting a used coupon is blocked; deactivate instead.
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm(s => ({ ...s, code: e.target.value }))}
              />
            </div>

            <div className='space-y-2'>
              <Label>Applies To</Label>
              <Select
                value={form.applicableTo}
                onValueChange={v => {
                  setForm(s => ({
                    ...s,
                    applicableTo: v as any,
                    restaurantId: '',
                    groceryStoreId: '',
                  }));
                  setSelectedRestaurant(null);
                  setSelectedGroceryStore(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select applicability' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='restaurant'>Restaurant</SelectItem>
                  <SelectItem value='grocery'>Grocery</SelectItem>
                  <SelectItem value='both'>Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Discount Type</Label>
              <Select
                value={form.discountType}
                onValueChange={v => setForm(s => ({ ...s, discountType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='flat'>Flat</SelectItem>
                  <SelectItem value='percentage'>Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}</Label>
              <Input
                value={form.discountValue}
                onChange={e => setForm(s => ({ ...s, discountValue: e.target.value }))}
                inputMode='decimal'
              />
            </div>

            <div className='space-y-2'>
              <Label>Minimum Order Value (₹)</Label>
              <Input
                value={form.minOrderValue}
                onChange={e => setForm(s => ({ ...s, minOrderValue: e.target.value }))}
                inputMode='decimal'
              />
            </div>

            <div className='space-y-2'>
              <Label>Max Discount Amount (₹) (optional)</Label>
              <Input
                value={form.maxDiscountAmount}
                onChange={e => setForm(s => ({ ...s, maxDiscountAmount: e.target.value }))}
                inputMode='decimal'
              />
            </div>

            <div className='space-y-2'>
              <Label>Usage Limit</Label>
              <Input
                value={form.usageLimit}
                onChange={e => setForm(s => ({ ...s, usageLimit: e.target.value }))}
                inputMode='numeric'
              />
            </div>

            <div className='space-y-2'>
              <Label>Expires At (optional)</Label>
              <Input
                type='datetime-local'
                value={form.expiresAt}
                onChange={e => setForm(s => ({ ...s, expiresAt: e.target.value }))}
              />
            </div>

            {/* Restaurant Dropdown — conditional on applicableTo */}
            {(form.applicableTo === 'restaurant' || form.applicableTo === 'both') && (
              <div className='space-y-2 md:col-span-2'>
                <Label>Restaurant (optional)</Label>
                {selectedRestaurant ? (
                  <div className='bg-muted/30 border-border flex items-center justify-between rounded-lg border p-3'>
                    <div>
                      <div className='font-medium'>
                        {selectedRestaurant.restaurantName || 'Selected Restaurant'}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {selectedRestaurant.userEmail || selectedRestaurant.phoneNumber || ''}
                      </div>
                    </div>
                    <Button size='sm' variant='ghost' onClick={clearSelectedRestaurant}>
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <div className='restaurant-dropdown-container relative'>
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setRestaurantDropdownOpen(!restaurantDropdownOpen);
                      }}
                      className='border-input bg-background hover:border-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm'
                    >
                      <span className='text-muted-foreground'>
                        All restaurants (click to pick one)
                      </span>
                      <ChevronDown
                        className={`ml-2 h-4 w-4 transition-transform ${restaurantDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                    {restaurantDropdownOpen && (
                      <div className='bg-background border-input absolute z-50 mt-1 w-full rounded-md border shadow-lg'>
                        <div className='border-b p-2'>
                          <Input
                            placeholder='Search restaurants...'
                            value={restaurantSearchFilter}
                            onChange={e => setRestaurantSearchFilter(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className='h-8'
                            autoFocus
                          />
                        </div>
                        <div
                          className='max-h-64 overflow-auto p-1'
                          onClick={e => e.stopPropagation()}
                        >
                          {filteredRestaurants.length === 0 ? (
                            <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                              No restaurants found
                            </div>
                          ) : (
                            filteredRestaurants.map(restaurant => {
                              const rid = (
                                restaurant.restaurantId ||
                                restaurant.id ||
                                ''
                              ).toString();
                              return (
                                <div
                                  key={rid}
                                  onClick={() => selectRestaurant(restaurant)}
                                  className='hover:bg-accent flex cursor-pointer items-center rounded px-2 py-1.5 text-sm'
                                >
                                  <div className='flex-1'>
                                    <div className='font-medium'>{restaurant.restaurantName}</div>
                                    <div className='text-muted-foreground text-xs'>
                                      {restaurant.userEmail || restaurant.phoneNumber || ''}
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
                <p className='text-muted-foreground text-xs'>
                  Leave empty to apply to all restaurants.
                </p>
              </div>
            )}

            {/* Grocery Store Dropdown — conditional on applicableTo */}
            {(form.applicableTo === 'grocery' || form.applicableTo === 'both') && (
              <div className='space-y-2 md:col-span-2'>
                <Label>Grocery Store (optional)</Label>
                {selectedGroceryStore ? (
                  <div className='bg-muted/30 border-border flex items-center justify-between rounded-lg border p-3'>
                    <div className='font-medium'>{selectedGroceryStore.storeName}</div>
                    <Button size='sm' variant='ghost' onClick={clearSelectedGroceryStore}>
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <div className='grocery-dropdown-container relative'>
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setGroceryDropdownOpen(!groceryDropdownOpen);
                      }}
                      className='border-input bg-background hover:border-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm'
                    >
                      <span className='text-muted-foreground'>
                        All grocery stores (click to pick one)
                      </span>
                      <ChevronDown
                        className={`ml-2 h-4 w-4 transition-transform ${groceryDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                    {groceryDropdownOpen && (
                      <div className='bg-background border-input absolute z-50 mt-1 w-full rounded-md border shadow-lg'>
                        <div className='border-b p-2'>
                          <Input
                            placeholder='Search grocery stores...'
                            value={grocerySearchFilter}
                            onChange={e => setGrocerySearchFilter(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className='h-8'
                            autoFocus
                          />
                        </div>
                        <div
                          className='max-h-64 overflow-auto p-1'
                          onClick={e => e.stopPropagation()}
                        >
                          {filteredGroceryStores.length === 0 ? (
                            <div className='text-muted-foreground px-2 py-4 text-center text-sm'>
                              No grocery stores found
                            </div>
                          ) : (
                            filteredGroceryStores.map(store => (
                              <div
                                key={store.id}
                                onClick={() => selectGroceryStore(store)}
                                className='hover:bg-accent cursor-pointer rounded px-2 py-1.5 text-sm'
                              >
                                <div className='font-medium'>{store.storeName}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className='text-muted-foreground text-xs'>
                  Leave empty to apply to all grocery stores.
                </p>
              </div>
            )}

            <div className='flex items-center justify-between rounded-lg border p-3 md:col-span-2'>
              <div>
                <div className='font-medium'>Active</div>
                <div className='text-muted-foreground text-xs'>
                  Inactive coupons won’t validate in checkout.
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(s => ({ ...s, isActive: v }))}
              />
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3 md:col-span-2'>
              <div>
                <div className='font-medium'>Visibility</div>
                <div className='text-muted-foreground text-xs'>
                  Hidden coupons won't appear in customer app but are still usable if code is known.
                </div>
              </div>
              <Switch
                checked={form.visibility}
                onCheckedChange={v => setForm(s => ({ ...s, visibility: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenEdit(false)} disabled={editing}>
              Cancel
            </Button>
            <Button onClick={onUpdate} disabled={editing}>
              {editing ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium'>{selectedCoupon?.code || 'this coupon'}</span>? This
              action cannot be undone.
              <div className='text-muted-foreground mt-2 text-xs'>
                Note: if a coupon has already been used, delete is blocked; deactivate it instead.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
