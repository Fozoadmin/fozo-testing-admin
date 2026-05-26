import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { GroceryBundleBox, GroceryItem, GroceryStore } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, PackagePlus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

type BundleFormValues = {
  storeId: string;
  name: string;
  category: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  price: string;
  mrp: string;
  quantityAvailable: string;
  totalQuantityListed: string;
  deliveryWindow: string;
  co2SavedKg: string;
  productType: string;
  brand: string;
  expiryDate: string;
  isActive: boolean;
  isInStock: boolean;
  productIds: string[];
};

const emptyBundleForm: BundleFormValues = {
  storeId: '',
  name: '',
  category: 'Bundle Box',
  subtitle: '',
  description: '',
  imageUrl: '',
  price: '',
  mrp: '',
  quantityAvailable: '',
  totalQuantityListed: '',
  deliveryWindow: '',
  co2SavedKg: '',
  productType: '',
  brand: '',
  expiryDate: '',
  isActive: true,
  isInStock: true,
  productIds: [],
};

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');

function BundleForm({
  form,
  setForm,
  stores,
  items,
  uploading,
  onImageUpload,
}: {
  form: BundleFormValues;
  setForm: (value: BundleFormValues) => void;
  stores: GroceryStore[];
  items: GroceryItem[];
  uploading: boolean;
  onImageUpload: (file: File, setter: (url: string) => void) => void;
}) {
  const storeItems = useMemo(
    () => items.filter(item => !form.storeId || item.store_id === form.storeId),
    [form.storeId, items]
  );

  const toggleProduct = (id: string) => {
    setForm({
      ...form,
      productIds: form.productIds.includes(id)
        ? form.productIds.filter(productId => productId !== id)
        : [...form.productIds, id],
    });
  };

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <label className='text-sm font-medium'>Store *</label>
        <select
          className='bg-background w-full rounded-md border px-3 py-2 text-sm'
          value={form.storeId}
          onChange={e => setForm({ ...form, storeId: e.target.value, productIds: [] })}
        >
          <option value=''>Select a store</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.store_name || store.storeName}
            </option>
          ))}
        </select>
      </div>

      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        <Input
          placeholder='Bundle Name *'
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder='Category'
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        />
      </div>
      <Input
        placeholder='Subtitle'
        value={form.subtitle}
        onChange={e => setForm({ ...form, subtitle: e.target.value })}
      />
      <Input
        placeholder='Description'
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />

      <div className='grid grid-cols-2 gap-2'>
        <Input
          placeholder='Price (₹) *'
          type='number'
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
        <Input
          placeholder='MRP (₹) *'
          type='number'
          value={form.mrp}
          onChange={e => setForm({ ...form, mrp: e.target.value })}
        />
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <Input
          placeholder='Qty Available'
          type='number'
          value={form.quantityAvailable}
          onChange={e => setForm({ ...form, quantityAvailable: e.target.value })}
        />
        <Input
          placeholder='Total Qty Listed'
          type='number'
          value={form.totalQuantityListed}
          onChange={e => setForm({ ...form, totalQuantityListed: e.target.value })}
        />
      </div>

      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        <Input
          placeholder='Delivery Window'
          value={form.deliveryWindow}
          onChange={e => setForm({ ...form, deliveryWindow: e.target.value })}
        />
        <Input
          placeholder='CO2 Saved Kg'
          type='number'
          value={form.co2SavedKg}
          onChange={e => setForm({ ...form, co2SavedKg: e.target.value })}
        />
        <Input
          placeholder='Type'
          value={form.productType}
          onChange={e => setForm({ ...form, productType: e.target.value })}
        />
        <Input
          placeholder='Brand'
          value={form.brand}
          onChange={e => setForm({ ...form, brand: e.target.value })}
        />
        <Input
          type='date'
          value={form.expiryDate}
          onChange={e => setForm({ ...form, expiryDate: e.target.value })}
        />
      </div>

      <div className='flex items-center gap-4'>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={form.isInStock}
            onChange={e => setForm({ ...form, isInStock: e.target.checked })}
          />
          In Stock
        </label>
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Bundle Image</label>
        <div className='flex items-center gap-2'>
          <input
            type='file'
            accept='image/*'
            className='text-sm'
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onImageUpload(file, url => setForm({ ...form, imageUrl: url }));
            }}
          />
          {uploading && <Loader2 className='h-4 w-4 animate-spin' />}
        </div>
        {form.imageUrl && <img src={form.imageUrl} alt='preview' className='h-20 rounded object-cover' />}
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Products in Bundle *</label>
        <div className='max-h-56 space-y-2 overflow-auto rounded-md border p-2'>
          {storeItems.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              Select a store with grocery products before choosing bundle contents.
            </p>
          ) : (
            storeItems.map(item => (
              <label
                key={item.id}
                className='hover:bg-muted flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm'
              >
                <input
                  type='checkbox'
                  checked={form.productIds.includes(item.id)}
                  onChange={() => toggleProduct(item.id)}
                />
                {item.image_url && (
                  <img src={item.image_url} alt='' className='h-8 w-8 rounded object-cover' />
                )}
                <span className='flex-1'>{item.item_name}</span>
                <span className='text-muted-foreground'>₹{Number(item.price ?? 0).toFixed(2)}</span>
              </label>
            ))
          )}
        </div>
        <p className='text-muted-foreground text-xs'>{form.productIds.length} products selected</p>
      </div>
    </div>
  );
}

const buildPayload = (form: BundleFormValues) => ({
  storeId: form.storeId,
  name: form.name.trim(),
  category: form.category.trim() || 'Bundle Box',
  subtitle: form.subtitle || undefined,
  description: form.description || undefined,
  imageUrl: form.imageUrl || undefined,
  price: Number(form.price),
  mrp: Number(form.mrp),
  quantityAvailable: Number(form.quantityAvailable),
  totalQuantityListed: Number(form.totalQuantityListed),
  deliveryWindow: form.deliveryWindow || undefined,
  co2SavedKg: Number(form.co2SavedKg || 0),
  productType: form.productType || undefined,
  brand: form.brand || undefined,
  expiryDate: form.expiryDate || undefined,
  isActive: form.isActive,
  isInStock: form.isInStock,
  items: form.productIds.map(groceryItemId => ({ groceryItemId, quantity: 1 })),
});

export function GroceryBundleBoxes() {
  const [bundleBoxes, setBundleBoxes] = useState<GroceryBundleBox[]>([]);
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyBundleForm });
  const [creating, setCreating] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<GroceryBundleBox | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyBundleForm });
  const [editing, setEditing] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<GroceryBundleBox | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bundleData, storeData, itemData] = await Promise.all([
        adminApi.getAllGroceryBundleBoxes(undefined, undefined, true),
        adminApi.getAllGroceryStores(),
        adminApi.getAllGroceryItems(),
      ]);
      setBundleBoxes(bundleData);
      setStores(storeData);
      setItems(itemData);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to fetch bundle boxes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredBundleBoxes = bundleBoxes.filter(bundle => {
    const matchesSearch = bundle.name?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStore = storeFilter ? bundle.store_id === storeFilter : true;
    return matchesSearch && matchesStore;
  });

  const handleImageUpload = async (file: File, setter: (url: string) => void, edit = false) => {
    edit ? setEditUploadingImage(true) : setUploadingImage(true);
    try {
      const { imageUrl } = await adminApi.uploadGroceryImage(file);
      setter(imageUrl);
      toast.success('Image uploaded');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Image upload failed'));
    } finally {
      edit ? setEditUploadingImage(false) : setUploadingImage(false);
    }
  };

  const validateForm = (values: BundleFormValues) => {
    if (!values.storeId) return 'Store is required';
    if (!values.name.trim()) return 'Bundle name is required';
    if (!values.price || Number(values.price) <= 0) return 'Valid price is required';
    if (!values.mrp || Number(values.mrp) <= 0) return 'Valid MRP is required';
    if (values.productIds.length === 0) return 'Select at least one product';
    return null;
  };

  const handleCreate = async () => {
    const error = validateForm(form);
    if (error) return toast.error(error);
    setCreating(true);
    try {
      await adminApi.createGroceryBundleBox(buildPayload(form));
      toast.success('Bundle box created');
      setOpenAdd(false);
      setForm({ ...emptyBundleForm });
      await fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create bundle box'));
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (bundle: GroceryBundleBox) => {
    setSelectedBundle(bundle);
    setEditForm({
      storeId: bundle.store_id || '',
      name: bundle.name || '',
      category: bundle.category || 'Bundle Box',
      subtitle: bundle.subtitle || '',
      description: bundle.description || '',
      imageUrl: bundle.image_url || '',
      price: String(bundle.price || ''),
      mrp: String(bundle.mrp || ''),
      quantityAvailable: String(bundle.quantity_available ?? 0),
      totalQuantityListed: String(bundle.total_quantity_listed ?? 0),
      deliveryWindow: bundle.delivery_window || '',
      co2SavedKg: String(bundle.co2_saved_kg ?? 0),
      productType: bundle.product_type || '',
      brand: bundle.brand || '',
      expiryDate: toDateInputValue(bundle.expiry_date),
      isActive: bundle.is_active ?? true,
      isInStock: bundle.is_in_stock ?? true,
      productIds: bundle.items?.map(item => item.groceryItemId) ?? [],
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedBundle) return;
    const error = validateForm(editForm);
    if (error) return toast.error(error);
    setEditing(true);
    try {
      await adminApi.updateGroceryBundleBox(selectedBundle.id, buildPayload(editForm));
      toast.success('Bundle box updated');
      setOpenEdit(false);
      setSelectedBundle(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update bundle box'));
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!bundleToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteGroceryBundleBox(bundleToDelete.id);
      toast.success('Bundle box deleted');
      setOpenDelete(false);
      setBundleToDelete(null);
      await fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete bundle box'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Bundle Boxes</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <PackagePlus className='mr-1 h-4 w-4' /> Add Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Add Bundle Box</DialogTitle>
                <DialogDescription>Create a bundle and choose the grocery products inside it.</DialogDescription>
              </DialogHeader>
              <BundleForm
                form={form}
                setForm={setForm}
                stores={stores}
                items={items}
                uploading={uploadingImage}
                onImageUpload={(file, setter) => handleImageUpload(file, setter)}
              />
              <DialogFooter>
                <Button variant='outline' onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className='mb-4 flex flex-wrap items-center gap-2'>
            <Search className='text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search bundle boxes...'
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className='max-w-xs'
            />
            <select
              className='bg-background rounded-md border px-3 py-2 text-sm'
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
            >
              <option value=''>All Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.store_name || store.storeName}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBundleBoxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-muted-foreground py-8 text-center'>
                      No bundle boxes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBundleBoxes.map(bundle => (
                    <TableRow key={bundle.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          {bundle.image_url && (
                            <img src={bundle.image_url} alt={bundle.name} className='h-8 w-8 rounded object-cover' />
                          )}
                          <div>
                            <div>{bundle.name}</div>
                            <div className='text-muted-foreground text-xs'>{bundle.category || 'Bundle Box'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bundle.store_name}</TableCell>
                      <TableCell>₹{Number(bundle.price).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(bundle.mrp).toFixed(2)}</TableCell>
                      <TableCell>{bundle.items?.length ?? 0}</TableCell>
                      <TableCell>{bundle.quantity_available}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <Badge variant={bundle.is_active ? 'default' : 'outline'}>
                            {bundle.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={bundle.is_in_stock ? 'default' : 'secondary'}>
                            {bundle.is_in_stock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='sm' onClick={() => openEditDialog(bundle)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setBundleToDelete(bundle);
                              setOpenDelete(true);
                            }}
                          >
                            <Trash2 className='text-destructive h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Bundle Box</DialogTitle>
            <DialogDescription>Update bundle details and selected products.</DialogDescription>
          </DialogHeader>
          <BundleForm
            form={editForm}
            setForm={setEditForm}
            stores={stores}
            items={items}
            uploading={editUploadingImage}
            onImageUpload={(file, setter) => handleImageUpload(file, setter, true)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={editing}>
              {editing ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bundle Box</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{bundleToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
