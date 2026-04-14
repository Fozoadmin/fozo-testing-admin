/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { isTenDigitPhone, normalizePhoneDigits, apiRequestWithStatus } from '@/lib/utils';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  suspended: 'destructive',
  closed: 'outline',
};

const emptyForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  storeName: '',
  contactPersonName: '',
  fssaiLicenseNumber: '',
  gstinNumber: '',
  description: '',
};

const emptyBank = {
  accountNumber: '',
  ifscCode: '',
  accountHolderName: '',
  bankName: '',
};

const emptyEditForm = {
  storeName: '',
  contactPersonName: '',
  fssaiLicenseNumber: '',
  gstinNumber: '',
  description: '',
  imageUrl: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed',
  documentsVerified: false,
  isApproved: false,
};

export function GroceryStores() {
  const [stores, setStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Add dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [bank, setBank] = useState({ ...emptyBank });
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyEditForm });
  const [editBank, setEditBank] = useState({ ...emptyBank });
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editing, setEditing] = useState(false);

  // Delete dialog
  const [openDelete, setOpenDelete] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  // Local search filtering
  useEffect(() => {
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      setStores(
        allStores.filter(
          s =>
            s.store_name?.toLowerCase().includes(term) ||
            s.contact_person_name?.toLowerCase().includes(term)
        )
      );
    } else {
      setStores(allStores);
    }
  }, [searchFilter, allStores]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllGroceryStores();
      setAllStores(data);
      setStores(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch grocery stores');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    file: File,
    setter: (url: string) => void,
    loadingSetter: (v: boolean) => void
  ) => {
    loadingSetter(true);
    try {
      const { imageUrl: url } = await adminApi.uploadGroceryImage(file);
      setter(url);
      toast.success('Image uploaded successfully!', { position: 'top-right', autoClose: 2000 });
    } catch (error: any) {
      toast.error(error.message || 'Image upload failed');
    } finally {
      loadingSetter(false);
    }
  };

  const resetAddForm = () => {
    setForm({ ...emptyForm });
    setBank({ ...emptyBank });
    setImageUrl('');
  };

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.storeName.trim() || !form.password.trim()) {
      toast.error('Full name, store name, and password are required');
      return;
    }
    if (!form.email && !form.phoneNumber) {
      toast.error('Please provide either email or phone number');
      return;
    }
    if (form.phoneNumber && !isTenDigitPhone(form.phoneNumber)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    const bankAccountDetails =
      bank.accountNumber || bank.ifscCode
        ? {
            accountNumber: bank.accountNumber,
            ifscCode: bank.ifscCode,
            accountHolderName: bank.accountHolderName,
            bankName: bank.bankName,
          }
        : undefined;

    const phoneDigits = normalizePhoneDigits(form.phoneNumber);

    setCreating(true);
    try {
      const result = await apiRequestWithStatus('/admin/grocery-stores', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneDigits ? `+91${phoneDigits}` : undefined,
          email: form.email || undefined,
          password: form.password,
          fullName: form.fullName,
          storeName: form.storeName,
          contactPersonName: form.contactPersonName || form.fullName,
          fssaiLicenseNumber: form.fssaiLicenseNumber || undefined,
          gstinNumber: form.gstinNumber || undefined,
          description: form.description || undefined,
          imageUrl: imageUrl || undefined,
          bankAccountDetails,
        }),
      });

      if (result.status < 300) {
        toast.success(result.message || 'Grocery store created successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        setOpenAdd(false);
        resetAddForm();
        await fetchStores();
      } else {
        toast.error(result.message || 'Failed to create grocery store', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create grocery store', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (store: any) => {
    setSelectedStore(store);
    setEditForm({
      storeName: store.store_name || '',
      contactPersonName: store.contact_person_name || '',
      fssaiLicenseNumber: store.fssai_license_number || '',
      gstinNumber: store.gstin_number || '',
      description: store.description || '',
      imageUrl: store.image_url || '',
      status: store.status || 'pending',
      documentsVerified: store.documents_verified || false,
      isApproved: store.is_approved || false,
    });
    const bd = store.bank_account_details;
    setEditBank({
      accountNumber: bd?.account_number || bd?.accountNumber || '',
      ifscCode: bd?.ifsc_code || bd?.ifscCode || '',
      accountHolderName: bd?.account_holder_name || bd?.accountHolderName || '',
      bankName: bd?.bank_name || bd?.bankName || '',
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedStore) return;
    setEditing(true);
    try {
      const bankAccountDetails =
        editBank.accountNumber || editBank.ifscCode
          ? {
              accountNumber: editBank.accountNumber,
              ifscCode: editBank.ifscCode,
              accountHolderName: editBank.accountHolderName,
              bankName: editBank.bankName,
            }
          : undefined;

      await adminApi.updateGroceryStore(selectedStore.id, {
        storeName: editForm.storeName || undefined,
        contactPersonName: editForm.contactPersonName || undefined,
        fssaiLicenseNumber: editForm.fssaiLicenseNumber || undefined,
        gstinNumber: editForm.gstinNumber || undefined,
        description: editForm.description || undefined,
        imageUrl: editForm.imageUrl || undefined,
        status: editForm.status,
        documentsVerified: editForm.documentsVerified,
        isApproved: editForm.isApproved,
        bankAccountDetails,
      });
      toast.success('Grocery store updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      setOpenEdit(false);
      setSelectedStore(null);
      await fetchStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteGroceryStore(storeToDelete.id);
      toast.success('Grocery store deleted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      setOpenDelete(false);
      setStoreToDelete(null);
      await fetchStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete store', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Grossy Stores</CardTitle>

          {/* ===== ADD STORE DIALOG ===== */}
          <Dialog
            open={openAdd}
            onOpenChange={v => {
              setOpenAdd(v);
              if (!v) resetAddForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='mr-1 h-4 w-4' /> Add Store
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Add Grocery Store</DialogTitle>
                <DialogDescription>
                  Create a new grocery store owner account and dark store in one step.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue='basic' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='basic'>Basic Info</TabsTrigger>
                  <TabsTrigger value='bank'>Bank Details</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value='basic' className='mt-4 space-y-3'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Owner / User Account
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      placeholder='Full Name *'
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                    />
                    <Input
                      placeholder='Password *'
                      type='password'
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      placeholder='Phone Number (10 digits)'
                      value={form.phoneNumber}
                      onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    />
                    <Input
                      placeholder='Email'
                      type='email'
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <p className='text-muted-foreground pt-2 text-xs font-medium tracking-wide uppercase'>
                    Store Details
                  </p>
                  <Input
                    placeholder='Store Name *'
                    value={form.storeName}
                    onChange={e => setForm({ ...form, storeName: e.target.value })}
                  />
                  <Input
                    placeholder='Contact Person Name'
                    value={form.contactPersonName}
                    onChange={e => setForm({ ...form, contactPersonName: e.target.value })}
                  />
                  <Input
                    placeholder='Description'
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      placeholder='FSSAI License Number'
                      value={form.fssaiLicenseNumber}
                      onChange={e => setForm({ ...form, fssaiLicenseNumber: e.target.value })}
                    />
                    <Input
                      placeholder='GSTIN Number'
                      value={form.gstinNumber}
                      onChange={e => setForm({ ...form, gstinNumber: e.target.value })}
                    />
                  </div>

                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>Store Image</p>
                    <div className='flex items-center gap-2'>
                      <input
                        type='file'
                        accept='image/*'
                        className='text-sm'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, setImageUrl, setUploadingImage);
                        }}
                      />
                      {uploadingImage && <Loader2 className='h-4 w-4 animate-spin' />}
                    </div>
                    {imageUrl && (
                      <img src={imageUrl} alt='preview' className='h-20 rounded object-cover' />
                    )}
                  </div>
                </TabsContent>

                {/* Bank Details Tab */}
                <TabsContent value='bank' className='mt-4 space-y-3'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    Bank Account Details (Optional)
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      placeholder='Account Number'
                      value={bank.accountNumber}
                      onChange={e => setBank({ ...bank, accountNumber: e.target.value })}
                    />
                    <Input
                      placeholder='IFSC Code'
                      value={bank.ifscCode}
                      onChange={e => setBank({ ...bank, ifscCode: e.target.value })}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <Input
                      placeholder='Account Holder Name'
                      value={bank.accountHolderName}
                      onChange={e => setBank({ ...bank, accountHolderName: e.target.value })}
                    />
                    <Input
                      placeholder='Bank Name'
                      value={bank.bankName}
                      onChange={e => setBank({ ...bank, bankName: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className='mt-4'>
                <Button variant='outline' onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
                  Create Store
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className='mb-4 flex items-center gap-2'>
            <Search className='text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search stores...'
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className='max-w-sm'
            />
          </div>

          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                      No grocery stores found
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map(store => (
                    <TableRow key={store.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          {store.image_url && (
                            <img
                              src={store.image_url}
                              alt={store.store_name}
                              className='h-8 w-8 rounded object-cover'
                            />
                          )}
                          {store.store_name}
                        </div>
                      </TableCell>
                      <TableCell>{store.contact_person_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[store.status] || 'secondary'}>
                          {store.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(store.average_rating).toFixed(1)}</TableCell>
                      <TableCell>
                        {store.documents_verified ? (
                          <Badge variant='default'>Verified</Badge>
                        ) : (
                          <Badge variant='outline'>Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='sm' onClick={() => openEditDialog(store)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setStoreToDelete(store);
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

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Grocery Store</DialogTitle>
            <DialogDescription>Update store details and status.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='basic' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='basic'>Basic Info</TabsTrigger>
              <TabsTrigger value='bank'>Bank Details</TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='mt-4 space-y-3'>
              <Input
                placeholder='Store Name'
                value={editForm.storeName}
                onChange={e => setEditForm({ ...editForm, storeName: e.target.value })}
              />
              <Input
                placeholder='Contact Person Name'
                value={editForm.contactPersonName}
                onChange={e => setEditForm({ ...editForm, contactPersonName: e.target.value })}
              />
              <Input
                placeholder='Description'
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  placeholder='FSSAI License Number'
                  value={editForm.fssaiLicenseNumber}
                  onChange={e => setEditForm({ ...editForm, fssaiLicenseNumber: e.target.value })}
                />
                <Input
                  placeholder='GSTIN Number'
                  value={editForm.gstinNumber}
                  onChange={e => setEditForm({ ...editForm, gstinNumber: e.target.value })}
                />
              </div>

              <div className='space-y-1'>
                <label className='text-sm font-medium'>Status</label>
                <select
                  className='bg-background w-full rounded-md border px-3 py-2 text-sm'
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                >
                  {['pending', 'approved', 'rejected', 'suspended', 'closed'].map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-4'>
                <label className='flex cursor-pointer items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={editForm.documentsVerified}
                    onChange={e =>
                      setEditForm({ ...editForm, documentsVerified: e.target.checked })
                    }
                  />
                  Documents Verified
                </label>
                <label className='flex cursor-pointer items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={editForm.isApproved}
                    onChange={e => setEditForm({ ...editForm, isApproved: e.target.checked })}
                  />
                  Approved
                </label>
              </div>

              <div className='space-y-2'>
                <p className='text-sm font-medium'>Store Image</p>
                <div className='flex items-center gap-2'>
                  <input
                    type='file'
                    accept='image/*'
                    className='text-sm'
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleImageUpload(
                          file,
                          url => setEditForm({ ...editForm, imageUrl: url }),
                          setEditUploadingImage
                        );
                    }}
                  />
                  {editUploadingImage && <Loader2 className='h-4 w-4 animate-spin' />}
                </div>
                {editForm.imageUrl && (
                  <img
                    src={editForm.imageUrl}
                    alt='preview'
                    className='h-20 rounded object-cover'
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value='bank' className='mt-4 space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  placeholder='Account Number'
                  value={editBank.accountNumber}
                  onChange={e => setEditBank({ ...editBank, accountNumber: e.target.value })}
                />
                <Input
                  placeholder='IFSC Code'
                  value={editBank.ifscCode}
                  onChange={e => setEditBank({ ...editBank, ifscCode: e.target.value })}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  placeholder='Account Holder Name'
                  value={editBank.accountHolderName}
                  onChange={e => setEditBank({ ...editBank, accountHolderName: e.target.value })}
                />
                <Input
                  placeholder='Bank Name'
                  value={editBank.bankName}
                  onChange={e => setEditBank({ ...editBank, bankName: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className='mt-4'>
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

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grocery Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{storeToDelete?.store_name}</strong>? This
              will also delete all associated items and cannot be undone.
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
