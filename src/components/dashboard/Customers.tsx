import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, User, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequestWithStatus } from '@/lib/utils';
import type { Customer as CustomerType, ApiError } from '@/types';

export function Customers() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail popup
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Real-time local search filtering
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      const filtered = allCustomers.filter(customer => {
        const name = customer.fullName?.toLowerCase() || '';
        const email = customer.email?.toLowerCase() || '';
        const phone = customer.phoneNumber?.toLowerCase() || '';
        return (
          name.includes(searchTermLower) ||
          email.includes(searchTermLower) ||
          phone.includes(searchTermLower)
        );
      });
      setCustomers(filtered);
    } else {
      // If search is empty, show all customers
      setCustomers(allCustomers);
    }
  }, [searchTerm, allCustomers]);

  const fetchCustomers = async () => {
    try {
      const data = await adminApi.getAllUsers('customer');
      setAllCustomers(data);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleClearSearch = () => {
  //   setSearchTerm("");
  //   setCustomers(allCustomers);
  // };

  const openCustomerDetail = (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setOpenDetail(true);
  };

  const openDeleteDialog = (customer: CustomerType) => {
    setSelectedCustomer(customer);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      setDeleting(true);
      // Use helper to get status code
      const result = await apiRequestWithStatus(`/admin/users/${selectedCustomer.id}`, {
        method: 'DELETE',
      });

      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
        // Refresh list
        await fetchCustomers();
        setDeleteConfirm(false);
        setSelectedCustomer(null);
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      console.error('Delete failed', error);
      // Show error toast for unexpected errors
      const errorMessage = error?.message || 'Failed to delete customer';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='grid gap-4'>
      <Card className='rounded-2xl'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <CardTitle>Customers</CardTitle>
            <div className='flex items-end gap-2'>
              <div className='max-w-md flex-1'>
                <label className='mb-1 block text-sm font-medium'>Search Customers</label>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder='Search by name, email, or phone...'
                    className='h-9 w-[300px] pl-9'
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-8 text-center'>Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>No customers found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell
                      className='cursor-pointer font-medium hover:underline'
                      onClick={() => openCustomerDetail(c)}
                    >
                      {c.fullName || 'N/A'}
                    </TableCell>
                    <TableCell>{c.email || 'N/A'}</TableCell>
                    <TableCell>{c.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant='default'
                        className='border-blue-200 bg-blue-100 text-blue-800'
                      >
                        customer
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isVerified ? 'default' : 'secondary'}>
                        {c.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openDeleteDialog(c)}
                        className='text-destructive hover:text-destructive h-8 w-8 p-0'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className='grid gap-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Full Name</label>
                  <div className='mt-1 text-sm'>{selectedCustomer.fullName || '—'}</div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Email</label>
                  <div className='mt-1 text-sm'>{selectedCustomer.email || '—'}</div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Phone Number</label>
                  <div className='mt-1 text-sm'>{selectedCustomer.phoneNumber || '—'}</div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>User Type</label>
                  <div className='mt-1 text-sm'>
                    <Badge variant='default' className='border-blue-200 bg-blue-100 text-blue-800'>
                      {selectedCustomer.userType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Verified</label>
                  <div className='mt-1 text-sm'>
                    <Badge variant={selectedCustomer.isVerified ? 'default' : 'secondary'}>
                      {selectedCustomer.isVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Active</label>
                  <div className='mt-1 text-sm'>
                    <Badge variant={selectedCustomer.isActive ? 'default' : 'destructive'}>
                      {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>Created At</label>
                  <div className='mt-1 text-sm'>
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <label className='text-muted-foreground text-sm font-medium'>User ID</label>
                  <div className='mt-1 font-mono text-sm text-xs'>{selectedCustomer.id}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedCustomer?.fullName || selectedCustomer?.email || 'this customer'}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className='bg-destructive/10 border-destructive/20 rounded-lg border p-4'>
            <p className='text-destructive text-sm font-medium'>⚠️ Warning</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              This action cannot be undone. This will permanently delete the customer account and
              all associated data.
            </p>
          </div>
          <div className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant='destructive' disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
