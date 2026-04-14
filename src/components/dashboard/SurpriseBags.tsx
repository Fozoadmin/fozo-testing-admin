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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequestWithStatus } from '@/lib/utils';
import type { SurpriseBag, GroupedRestaurant, Restaurant, ApiError } from '@/types';

interface BagWithRestaurant extends SurpriseBag {
  restaurant: GroupedRestaurant;
}

export function SurpriseBags() {
  const [groupedRestaurants, setGroupedRestaurants] = useState<GroupedRestaurant[]>([]);
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);

  // Detail and Edit dialogs
  const [selectedBag, setSelectedBag] = useState<BagWithRestaurant | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [bagToDelete, setBagToDelete] = useState<{
    bag: SurpriseBag;
    restaurant: GroupedRestaurant;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Restaurant dropdown states
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearchFilter, setRestaurantSearchFilter] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<
    Restaurant | GroupedRestaurant | null
  >(null);

  const [formB, setFormB] = useState({
    bagName: '',
    denominationValue: '',
    actualWorth: '',
    description: '',
    imageUrl: '',
    quantityAvailable: '',
    pickupStartTime: '',
    pickupEndTime: '',
    availableDate: '',
    isActive: true,
    isVegetarian: true,
  });

  // Image upload states
  const [bagImageUrl, setBagImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [groupedData, restaurants] = await Promise.all([
          adminApi.getGroupedSurpriseBags(),
          adminApi.getAllRestaurants(),
        ]);
        if (!isMounted) return;
        setGroupedRestaurants(groupedData);
        // Filter only approved restaurants
        setAllRestaurants(restaurants.filter(r => r.status === 'approved'));
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (restaurantDropdownOpen && !target.closest('.restaurant-dropdown-container')) {
        setRestaurantDropdownOpen(false);
      }
    };

    if (restaurantDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [restaurantDropdownOpen]);

  const toggleRestaurant = (restaurantId: string) => {
    setExpandedRestaurants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(restaurantId)) {
        newSet.delete(restaurantId);
      } else {
        newSet.add(restaurantId);
      }
      return newSet;
    });
  };

  // Filter restaurants based on search
  const filteredRestaurants = allRestaurants.filter(restaurant => {
    if (!restaurantSearchFilter.trim()) return true;
    const searchTerm = restaurantSearchFilter.toLowerCase();
    const name = restaurant.restaurantName?.toLowerCase() || '';
    const email = restaurant.userEmail?.toLowerCase() || '';
    const phone = restaurant.phoneNumber?.toLowerCase() || '';
    return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
  });

  const selectRestaurant = (restaurant: Restaurant | GroupedRestaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantDropdownOpen(false);
    setRestaurantSearchFilter('');
  };

  const clearSelectedRestaurant = () => {
    setSelectedRestaurant(null);
    setRestaurantSearchFilter('');
  };

  const resetForm = () => {
    setFormB({
      bagName: '',
      denominationValue: '',
      actualWorth: '',
      description: '',
      imageUrl: '',
      quantityAvailable: '',
      pickupStartTime: '',
      pickupEndTime: '',
      availableDate: '',
      isActive: true,
      isVegetarian: true,
    });
    setSelectedRestaurant(null);
    setRestaurantSearchFilter('');
    setRestaurantDropdownOpen(false);
    setBagImageUrl('');
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const result = await adminApi.uploadSurpriseBagImage(file);
      setBagImageUrl(result.imageUrl);
      setFormB({ ...formB, imageUrl: result.imageUrl });
      toast.success('Image uploaded successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (err) {
      const error = err as ApiError;
      console.error('Image upload failed:', error);
      toast.error(error.message || 'Failed to upload image', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const isFormValid = () => {
    return (
      selectedRestaurant &&
      formB.bagName &&
      formB.denominationValue &&
      formB.actualWorth &&
      formB.quantityAvailable
    );
  };

  const handleCreate = async () => {
    try {
      setCreating(true);

      if (!selectedRestaurant) {
        alert('Please search and select a restaurant');
        return;
      }

      if (
        !formB.bagName ||
        !formB.denominationValue ||
        !formB.actualWorth ||
        !formB.quantityAvailable
      ) {
        alert('Please fill in all required fields');
        return;
      }

      // Use helper to get status code
      const result = await apiRequestWithStatus('/bags', {
        method: 'POST',
        body: JSON.stringify({
          targetRestaurantId: selectedRestaurant.restaurantId || selectedRestaurant.id,
          bagName: formB.bagName,
          denominationValue: parseFloat(formB.denominationValue),
          actualWorth: parseFloat(formB.actualWorth),
          description: formB.description || undefined,
          imageUrl: bagImageUrl || formB.imageUrl || undefined,
          quantityAvailable: parseInt(formB.quantityAvailable),
          pickupStartTime: formB.pickupStartTime ? `${formB.pickupStartTime}:00` : undefined,
          pickupEndTime: formB.pickupEndTime ? `${formB.pickupEndTime}:00` : undefined,
          availableDate: formB.availableDate || undefined,
          isActive: formB.isActive,
          isVegetarian: formB.isVegetarian,
        }),
      });

      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
        setGroupedRestaurants(await adminApi.getGroupedSurpriseBags());
        setOpenAdd(false);
        resetForm();
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      console.error('Create surprise bag failed', error);
      // Show error toast for unexpected errors
      const errorMessage = error?.message || 'Failed to create surprise bag';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  const openBagDetail = (bag: SurpriseBag, restaurant: GroupedRestaurant) => {
    setSelectedBag({ ...bag, restaurant });
    setOpenDetail(true);
  };

  const openEditDialog = (bag: SurpriseBag, restaurant: GroupedRestaurant) => {
    setSelectedBag({ ...bag, restaurant });

    // Pre-fill form with existing bag data
    setFormB({
      bagName: bag.bagName || '',
      denominationValue: bag.denominationValue?.toString() || '',
      actualWorth: bag.actualWorth?.toString() || '',
      description: bag.description || '',
      imageUrl: bag.imageUrl || '',
      quantityAvailable: bag.quantityAvailable?.toString() || '',
      pickupStartTime: bag.pickupStartTime ? bag.pickupStartTime.substring(0, 5) : '',
      pickupEndTime: bag.pickupEndTime ? bag.pickupEndTime.substring(0, 5) : '',
      availableDate: bag.availableDate ? bag.availableDate.split('T')[0] : '',
      isActive: bag.isActive !== undefined ? bag.isActive : true,
      isVegetarian: bag.isVegetarian !== undefined ? bag.isVegetarian : true,
    });

    // Set restaurant
    setSelectedRestaurant(restaurant);

    // Set image URL
    setBagImageUrl(bag.imageUrl || '');

    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedBag) return;

    try {
      setEditing(true);

      if (
        !formB.bagName ||
        !formB.denominationValue ||
        !formB.actualWorth ||
        !formB.quantityAvailable
      ) {
        alert('Please fill in all required fields');
        return;
      }

      const result = await apiRequestWithStatus(`/bags/${selectedBag.bagId}`, {
        method: 'PUT',
        body: JSON.stringify({
          targetRestaurantId: selectedBag.restaurant.restaurantId || selectedBag.restaurant.id,
          bagName: formB.bagName,
          denominationValue: parseFloat(formB.denominationValue),
          actualWorth: parseFloat(formB.actualWorth),
          description: formB.description || undefined,
          imageUrl: bagImageUrl || formB.imageUrl || undefined,
          quantityAvailable: parseInt(formB.quantityAvailable),
          pickupStartTime: formB.pickupStartTime ? `${formB.pickupStartTime}:00` : undefined,
          pickupEndTime: formB.pickupEndTime ? `${formB.pickupEndTime}:00` : undefined,
          availableDate: formB.availableDate || undefined,
          isActive: formB.isActive,
          isVegetarian: formB.isVegetarian,
        }),
      });

      if (result.status < 300) {
        toast.success(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
        setGroupedRestaurants(await adminApi.getGroupedSurpriseBags());
        setOpenEdit(false);
        resetForm();
        setSelectedBag(null);
      } else {
        toast.error(result.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      console.error('Update surprise bag failed', error);
      const errorMessage = error?.message || 'Failed to update surprise bag';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (bag: SurpriseBag, restaurant: GroupedRestaurant) => {
    setBagToDelete({ bag, restaurant });
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!bagToDelete) return;

    try {
      setDeleting(true);
      const restaurantId = bagToDelete.restaurant.restaurantId || bagToDelete.restaurant.id;
      await adminApi.deleteSurpriseBag(bagToDelete.bag.bagId, restaurantId);

      // Refresh list
      setGroupedRestaurants(await adminApi.getGroupedSurpriseBags());
      setDeleteConfirm(false);
      setBagToDelete(null);
      toast.success('Surprise bag deleted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      const error = err as ApiError;
      console.error('Delete failed', error);
      toast.error(error?.message || 'Failed to delete surprise bag', {
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
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle>Surprise Bags</CardTitle>
          <Dialog
            open={openAdd}
            onOpenChange={open => {
              setOpenAdd(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className='gap-2'>
                <Plus className='h-4 w-4' />
                Add Surprise Bag
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[95vh] min-h-[400px] overflow-y-auto sm:max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Add Surprise Bag</DialogTitle>
                <DialogDescription>
                  Search for a restaurant and create a surprise bag
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4'>
                {/* Restaurant Selection Dropdown */}
                <div className='space-y-3'>
                  <label className='text-sm font-medium'>Select Restaurant *</label>
                  {selectedRestaurant ? (
                    <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3'>
                      <div>
                        <div className='font-medium'>{selectedRestaurant.restaurantName}</div>
                        <div className='text-muted-foreground text-sm'>
                          {selectedRestaurant.userEmail || selectedRestaurant.phoneNumber}
                        </div>
                      </div>
                      <Button size='sm' variant='ghost' onClick={clearSelectedRestaurant}>
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ) : (
                    <div className='restaurant-dropdown-container relative'>
                      <div className='relative'>
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setRestaurantDropdownOpen(!restaurantDropdownOpen);
                          }}
                          className='border-input bg-background hover:border-ring flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm'
                        >
                          <div className='flex flex-1 items-center'>
                            <span className='text-muted-foreground'>Select a restaurant...</span>
                          </div>
                          <ChevronDown
                            className={`ml-2 h-4 w-4 transition-transform ${restaurantDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </div>

                        {/* Dropdown Menu */}
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
                            {restaurantSearchFilter && (
                              <div className='border-b p-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={e => {
                                    e.stopPropagation();
                                    setRestaurantSearchFilter('');
                                  }}
                                  className='w-full text-xs'
                                >
                                  Clear Search
                                </Button>
                              </div>
                            )}
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
                                  const restaurantId = restaurant.restaurantId || restaurant.id;
                                  return (
                                    <div
                                      key={restaurantId}
                                      onClick={() => selectRestaurant(restaurant)}
                                      className='hover:bg-accent flex cursor-pointer items-center rounded px-2 py-1.5 text-sm'
                                    >
                                      <div className='flex-1'>
                                        <div className='font-medium'>
                                          {restaurant.restaurantName}
                                        </div>
                                        <div className='text-muted-foreground text-xs'>
                                          {restaurant.userEmail || restaurant.phoneNumber}
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
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Only approved restaurants are shown
                      </p>
                    </div>
                  )}
                </div>

                {/* Bag Details - Only show if restaurant is selected */}
                {selectedRestaurant && (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='col-span-2'>
                        <label className='text-sm font-medium'>Bag Name *</label>
                        <Input
                          value={formB.bagName}
                          onChange={e => setFormB({ ...formB, bagName: e.target.value })}
                          placeholder='e.g., Dinner Surprise Pack'
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium'>Customer Pays (₹) *</label>
                        <Input
                          type='number'
                          step='0.01'
                          value={formB.denominationValue}
                          onChange={e => setFormB({ ...formB, denominationValue: e.target.value })}
                          placeholder='199.00'
                        />
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Price customer will pay
                        </p>
                      </div>

                      <div>
                        <label className='text-sm font-medium'>Actual Worth (₹) *</label>
                        <Input
                          type='number'
                          step='0.01'
                          value={formB.actualWorth}
                          onChange={e => setFormB({ ...formB, actualWorth: e.target.value })}
                          placeholder='399.00'
                        />
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Original value of items
                        </p>
                      </div>

                      <div className='col-span-2'>
                        <label className='text-sm font-medium'>Description</label>
                        <Input
                          value={formB.description}
                          onChange={e => setFormB({ ...formB, description: e.target.value })}
                          placeholder='Brief description of the bag contents'
                        />
                      </div>

                      {/* TODO: Bag Image - Disabled for now */}
                      {/* <div className="col-span-2">
                        <label className="text-sm font-medium">Bag Image</label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            disabled={uploadingImage}
                            className="cursor-pointer"
                          />
                          {uploadingImage && (
                            <p className="text-xs text-muted-foreground">Uploading image...</p>
                          )}
                          {bagImageUrl && (
                            <div className="mt-2">
                              <img 
                                src={bagImageUrl} 
                                alt="Bag preview" 
                                className="w-32 h-32 object-cover rounded-md border"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Image uploaded successfully</p>
                            </div>
                          )}
                        </div>
                      </div> */}
                    </div>

                    {/* Availability */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='text-sm font-medium'>Quantity Available *</label>
                        <Input
                          type='number'
                          value={formB.quantityAvailable}
                          onChange={e => setFormB({ ...formB, quantityAvailable: e.target.value })}
                          placeholder='10'
                        />
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Number of bags available
                        </p>
                      </div>

                      <div>
                        <label className='text-sm font-medium'>Available Till Date</label>
                        <Input
                          type='date'
                          value={formB.availableDate}
                          onChange={e => setFormB({ ...formB, availableDate: e.target.value })}
                        />
                        <p className='text-muted-foreground mt-1 text-xs'>Leave empty for today</p>
                      </div>
                    </div>

                    {/* Pickup Time */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='text-sm font-medium'>Pickup Start Time</label>
                        <Input
                          type='time'
                          value={formB.pickupStartTime}
                          onChange={e => setFormB({ ...formB, pickupStartTime: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium'>Pickup End Time</label>
                        <Input
                          type='time'
                          value={formB.pickupEndTime}
                          onChange={e => setFormB({ ...formB, pickupEndTime: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='bagActive'
                        checked={formB.isActive}
                        onChange={e => setFormB({ ...formB, isActive: e.target.checked })}
                        className='h-4 w-4'
                      />
                      <label htmlFor='bagActive' className='text-sm font-medium'>
                        Bag is Active
                      </label>
                      <p className='text-muted-foreground text-xs'>
                        (customers can see and purchase)
                      </p>
                    </div>

                    {/* Vegetarian Status */}
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='bagVegetarian'
                        checked={formB.isVegetarian}
                        onChange={e => setFormB({ ...formB, isVegetarian: e.target.checked })}
                        className='h-4 w-4'
                      />
                      <label htmlFor='bagVegetarian' className='text-sm font-medium'>
                        Vegetarian Bag
                      </label>
                      <p className='text-muted-foreground text-xs'>(mark as vegetarian option)</p>
                    </div>
                  </>
                )}
              </div>

              <div className='mt-4 flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setOpenAdd(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={creating || !isFormValid()} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Surprise Bag'}
                </Button>
              </div>
              {!isFormValid() && (
                <p className='mt-2 text-right text-xs text-amber-600'>
                  Please select a restaurant and fill all required fields
                </p>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-8 text-center'>Loading surprise bags...</div>
          ) : groupedRestaurants.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              No restaurants with surprise bags found
            </div>
          ) : (
            <div className='space-y-2'>
              {groupedRestaurants.map(restaurant => (
                <div key={restaurant.restaurantId} className='overflow-hidden rounded-lg border'>
                  {/* Restaurant Header - Clickable to expand/collapse */}
                  <div
                    className='bg-muted/30 hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors'
                    onClick={() => toggleRestaurant(restaurant.restaurantId)}
                  >
                    <div className='flex items-center gap-3'>
                      <button className='hover:bg-muted rounded p-1'>
                        {expandedRestaurants.has(restaurant.restaurantId) ? (
                          <ChevronDown className='h-5 w-5' />
                        ) : (
                          <ChevronRight className='h-5 w-5' />
                        )}
                      </button>
                      <div>
                        <h3 className='text-lg font-semibold'>{restaurant.restaurantName}</h3>
                        <p className='text-muted-foreground text-sm'>
                          {restaurant.restaurantOwnerPhone} • {restaurant.totalBags} bag
                          {restaurant.totalBags !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant='outline' className='text-sm'>
                      {restaurant.totalBags} Active Listing{restaurant.totalBags !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Expanded Bags Table */}
                  {expandedRestaurants.has(restaurant.restaurantId) && (
                    <div className='border-t p-4'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bag Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Worth</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Pickup Time</TableHead>
                            <TableHead>Veg/Non-Veg</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {restaurant.bags.map((bag: SurpriseBag) => (
                            <TableRow key={bag.bagId} className='hover:bg-muted/30 font-light'>
                              <TableCell
                                className='cursor-pointer font-medium hover:underline'
                                onClick={() => openBagDetail(bag, restaurant)}
                              >
                                {bag.bagName || 'N/A'}
                              </TableCell>
                              <TableCell>
                                ₹{Number(bag.denominationValue || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>₹{Number(bag.actualWorth || 0).toFixed(2)}</TableCell>
                              <TableCell>{bag.quantityAvailable || 0}</TableCell>
                              <TableCell className='text-sm'>{bag.pickupTime || 'N/A'}</TableCell>
                              <TableCell className='text-center'>
                                <Badge
                                  variant={bag.isVegetarian ? 'default' : 'destructive'}
                                  className={
                                    bag.isVegetarian
                                      ? 'border-transparent bg-green-600 text-white hover:bg-green-700'
                                      : ''
                                  }
                                >
                                  {bag.isVegetarian ? 'Veg' : 'Non-Veg'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={bag.isActive ? 'default' : 'secondary'}>
                                  {bag.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {bag.availableDate
                                  ? new Date(bag.availableDate).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell className='text-right'>
                                <div className='flex items-center justify-end gap-2'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={e => {
                                      e.stopPropagation();
                                      openEditDialog(bag, restaurant);
                                    }}
                                    className='h-8 w-8 p-0'
                                  >
                                    <Edit className='h-4 w-4' />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={e => {
                                      e.stopPropagation();
                                      openDeleteDialog(bag, restaurant);
                                    }}
                                    className='text-destructive hover:text-destructive h-8 w-8 p-0'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bag Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Surprise Bag Details</DialogTitle>
          </DialogHeader>
          {selectedBag && (
            <div className='grid gap-6'>
              {/* Bag Image */}
              <div className='flex justify-center'>
                {selectedBag.imageUrl ? (
                  <img
                    src={selectedBag.imageUrl}
                    alt={selectedBag.bagName || 'Surprise Bag'}
                    className='h-64 w-full max-w-md rounded-lg border object-contain shadow-sm'
                    onError={e => {
                      console.error('Failed to load image:', selectedBag.imageUrl);
                      e.currentTarget.onerror = null; // Prevent infinite loop
                      e.currentTarget.src = ''; // Clear src to show alt/placeholder
                    }}
                  />
                ) : (
                  // TODO: Bag Image - Disabled for now
                  // <div className="w-full max-w-md h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                  //   <p className="text-sm text-muted-foreground">No image available</p>
                  // </div>
                  <div></div>
                )}
              </div>

              {/* Basic Info */}
              <div>
                <h3 className='mb-3 font-semibold'>Basic Information</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>Bag Name</label>
                    <div className='mt-1 text-sm'>{selectedBag.bagName || '—'}</div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>Restaurant</label>
                    <div className='mt-1 text-sm'>
                      {selectedBag.restaurant?.restaurantName || '—'}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Customer Pays
                    </label>
                    <div className='mt-1 text-sm'>
                      ₹{Number(selectedBag.denominationValue || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Actual Worth
                    </label>
                    <div className='mt-1 text-sm'>
                      ₹{Number(selectedBag.actualWorth || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Quantity Available
                    </label>
                    <div className='mt-1 text-sm'>{selectedBag.quantityAvailable || 0}</div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>Status</label>
                    <div className='mt-1 text-sm'>
                      <Badge variant={selectedBag.isActive ? 'default' : 'secondary'}>
                        {selectedBag.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>Vegetarian</label>
                    <div className='mt-1 text-sm'>
                      <Badge variant={selectedBag.isVegetarian ? 'default' : 'secondary'}>
                        {selectedBag.isVegetarian ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Available Date
                    </label>
                    <div className='mt-1 text-sm'>
                      {selectedBag.availableDate
                        ? new Date(selectedBag.availableDate).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Pickup Start Time
                    </label>
                    <div className='mt-1 text-sm'>{selectedBag.pickupStartTime || '—'}</div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-sm font-medium'>
                      Pickup End Time
                    </label>
                    <div className='mt-1 text-sm'>{selectedBag.pickupEndTime || '—'}</div>
                  </div>
                  {selectedBag.description && (
                    <div className='col-span-2'>
                      <label className='text-muted-foreground text-sm font-medium'>
                        Description
                      </label>
                      <div className='mt-1 text-sm'>{selectedBag.description}</div>
                    </div>
                  )}
                  {selectedBag.imageUrl && (
                    <div className='col-span-2'>
                      <label className='text-muted-foreground text-sm font-medium'>Image URL</label>
                      <div className='text-muted-foreground mt-1 font-mono text-xs break-all'>
                        {selectedBag.imageUrl}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bag Dialog */}
      <Dialog
        open={openEdit}
        onOpenChange={open => {
          setOpenEdit(open);
          if (!open) {
            resetForm();
            setSelectedBag(null);
          }
        }}
      >
        <DialogContent className='max-h-[95vh] min-h-[400px] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Edit Surprise Bag</DialogTitle>
            <DialogDescription>Update surprise bag details</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            {/* Restaurant Info (Read-only) */}
            {selectedBag && selectedBag.restaurant && (
              <div className='space-y-3'>
                <label className='text-sm font-medium'>Restaurant</label>
                <div className='bg-muted/50 rounded-lg border p-3'>
                  <div className='font-medium'>{selectedBag.restaurant.restaurantName}</div>
                  <div className='text-muted-foreground text-sm'>
                    {selectedBag.restaurant.userEmail || selectedBag.restaurant.phoneNumber}
                  </div>
                </div>
              </div>
            )}

            {/* Bag Details */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <label className='text-sm font-medium'>Bag Name *</label>
                <Input
                  value={formB.bagName}
                  onChange={e => setFormB({ ...formB, bagName: e.target.value })}
                  placeholder='e.g., Dinner Surprise Pack'
                />
              </div>

              <div>
                <label className='text-sm font-medium'>Customer Pays (₹) *</label>
                <Input
                  type='number'
                  step='0.01'
                  value={formB.denominationValue}
                  onChange={e => setFormB({ ...formB, denominationValue: e.target.value })}
                  placeholder='199.00'
                />
                <p className='text-muted-foreground mt-1 text-xs'>Price customer will pay</p>
              </div>

              <div>
                <label className='text-sm font-medium'>Actual Worth (₹) *</label>
                <Input
                  type='number'
                  step='0.01'
                  value={formB.actualWorth}
                  onChange={e => setFormB({ ...formB, actualWorth: e.target.value })}
                  placeholder='399.00'
                />
                <p className='text-muted-foreground mt-1 text-xs'>Original value of items</p>
              </div>

              <div className='col-span-2'>
                <label className='text-sm font-medium'>Description</label>
                <Input
                  value={formB.description}
                  onChange={e => setFormB({ ...formB, description: e.target.value })}
                  placeholder='Brief description of the bag contents'
                />
              </div>

              <div className='col-span-2'>
                <label className='text-sm font-medium'>Bag Image</label>
                <div className='space-y-2'>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploadingImage}
                    className='cursor-pointer'
                  />
                  {uploadingImage && (
                    <p className='text-muted-foreground text-xs'>Uploading image...</p>
                  )}
                  {bagImageUrl && (
                    <div className='mt-2'>
                      <img
                        src={bagImageUrl}
                        alt='Bag preview'
                        className='h-32 w-32 rounded-md border object-cover'
                      />
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Image uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium'>Quantity Available *</label>
                <Input
                  type='number'
                  value={formB.quantityAvailable}
                  onChange={e => setFormB({ ...formB, quantityAvailable: e.target.value })}
                  placeholder='10'
                />
                <p className='text-muted-foreground mt-1 text-xs'>Number of bags available</p>
              </div>

              <div>
                <label className='text-sm font-medium'>Available Till Date</label>
                <Input
                  type='date'
                  value={formB.availableDate}
                  onChange={e => setFormB({ ...formB, availableDate: e.target.value })}
                />
                <p className='text-muted-foreground mt-1 text-xs'>Leave empty for today</p>
              </div>
            </div>

            {/* Pickup Time */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium'>Pickup Start Time</label>
                <Input
                  type='time'
                  value={formB.pickupStartTime}
                  onChange={e => setFormB({ ...formB, pickupStartTime: e.target.value })}
                />
              </div>

              <div>
                <label className='text-sm font-medium'>Pickup End Time</label>
                <Input
                  type='time'
                  value={formB.pickupEndTime}
                  onChange={e => setFormB({ ...formB, pickupEndTime: e.target.value })}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='bagActiveEdit'
                checked={formB.isActive}
                onChange={e => setFormB({ ...formB, isActive: e.target.checked })}
                className='h-4 w-4'
              />
              <label htmlFor='bagActiveEdit' className='text-sm font-medium'>
                Bag is Active
              </label>
              <p className='text-muted-foreground text-xs'>(customers can see and purchase)</p>
            </div>

            {/* Vegetarian Status */}
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='bagVegetarianEdit'
                checked={formB.isVegetarian}
                onChange={e => setFormB({ ...formB, isVegetarian: e.target.checked })}
                className='h-4 w-4'
              />
              <label htmlFor='bagVegetarianEdit' className='text-sm font-medium'>
                Vegetarian Bag
              </label>
              <p className='text-muted-foreground text-xs'>(mark as vegetarian option)</p>
            </div>
          </div>

          <div className='mt-4 flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setOpenEdit(false);
                resetForm();
                setSelectedBag(null);
              }}
            >
              Cancel
            </Button>
            <Button disabled={editing || !isFormValid()} onClick={handleUpdate}>
              {editing ? 'Updating...' : 'Update Surprise Bag'}
            </Button>
          </div>
          {!isFormValid() && (
            <p className='mt-2 text-right text-xs text-amber-600'>
              Please fill all required fields
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Surprise Bag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{bagToDelete?.bag.bagName || 'this surprise bag'}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Surprise Bag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
