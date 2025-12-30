import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, User, Trash2 } from "lucide-react";
import { DialogDescription } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { apiRequestWithStatus } from "@/lib/utils";

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Detail popup
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
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
      const filtered = allCustomers.filter((customer) => {
        const name = customer.fullName?.toLowerCase() || '';
        const email = customer.email?.toLowerCase() || '';
        const phone = customer.phoneNumber?.toLowerCase() || '';
        return name.includes(searchTermLower) || email.includes(searchTermLower) || phone.includes(searchTermLower);
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

  const openCustomerDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setOpenDetail(true);
  };

  const openDeleteDialog = (customer: any) => {
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
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh list
        await fetchCustomers();
        setDeleteConfirm(false);
        setSelectedCustomer(null);
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('Delete failed', error);
      // Show error toast for unexpected errors
      const errorMessage = error?.message || "Failed to delete customer";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Customers</CardTitle>
            <div className="flex gap-2 items-end">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium mb-1 block">Search Customers</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="pl-9 h-9 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found</div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow 
                    key={c.id}
                  >
                    <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => openCustomerDetail(c)}>{c.fullName || 'N/A'}</TableCell>
                    <TableCell>{c.email || 'N/A'}</TableCell>
                    <TableCell>{c.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="default" 
                        className="bg-blue-100 text-blue-800 border-blue-200"
                      >
                        customer
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isVerified ? "default" : "secondary"}>
                        {c.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDeleteDialog(c)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="text-sm mt-1">{selectedCustomer.fullName || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="text-sm mt-1">{selectedCustomer.email || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <div className="text-sm mt-1">{selectedCustomer.phoneNumber || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Type</label>
                  <div className="text-sm mt-1">
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                      {selectedCustomer.userType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verified</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedCustomer.isVerified ? "default" : "secondary"}>
                      {selectedCustomer.isVerified ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedCustomer.isActive ? "default" : "destructive"}>
                      {selectedCustomer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="text-sm mt-1">
                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="text-sm mt-1 font-mono text-xs">{selectedCustomer.id}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.fullName || selectedCustomer?.email || 'this customer'}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. This will permanently delete the customer
              account and all associated data.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              disabled={deleting} 
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
