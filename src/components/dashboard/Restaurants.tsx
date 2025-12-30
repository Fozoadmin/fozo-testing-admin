import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MapPin, Loader2, Building2, Edit, Trash2, CheckCircle2, XCircle, Ban, Search } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isTenDigitPhone, normalizePhoneDigits, apiRequestWithStatus } from "@/lib/utils";
import { toast } from "react-toastify";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  // Search states
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [restaurantSearchFilter, setRestaurantSearchFilter] = useState("");
  
  // Detail popup
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  // Edit mode
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Cuisines
  const [cuisines, setCuisines] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>([]);
  
  // Basic Info
  const [formR, setFormR] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    restaurantName: "",
    contactPersonName: "",
    fssaiLicenseNumber: "",
    gstinNumber: ""
  });

  // Location Info
  const [location, setLocation] = useState({
    locationName: "",
    address: "",
    latitude: "",
    longitude: "",
    contactNumber: "",
    email: ""
  });

  // Operating Hours
  const [operatingHours, setOperatingHours] = useState<Record<string, {open: string, close: string, isClosed: boolean}>>({
    monday: { open: "09:00", close: "22:00", isClosed: false },
    tuesday: { open: "09:00", close: "22:00", isClosed: false },
    wednesday: { open: "09:00", close: "22:00", isClosed: false },
    thursday: { open: "09:00", close: "22:00", isClosed: false },
    friday: { open: "09:00", close: "22:00", isClosed: false },
    saturday: { open: "09:00", close: "22:00", isClosed: false },
    sunday: { open: "09:00", close: "22:00", isClosed: false }
  });

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: ""
  });

  // Image upload states
  const [restaurantImageUrl, setRestaurantImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchAllRestaurants();
    fetchCuisines();
  }, []);

  // Fetch all restaurants for dropdown
  const fetchAllRestaurants = async () => {
    try {
      const data = await adminApi.getAllRestaurants();
      setAllRestaurants(data);
      setRestaurants(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setLoading(false);
    }
  };

  // Real-time local search filtering
  useEffect(() => {
    if (restaurantSearchFilter.trim()) {
      const searchTerm = restaurantSearchFilter.toLowerCase().trim();
      const filtered = allRestaurants.filter((restaurant) => {
        const name = restaurant.restaurantName?.toLowerCase() || '';
        const email = restaurant.userEmail?.toLowerCase() || '';
        const phone = restaurant.phoneNumber?.toLowerCase() || '';
        return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
      });
      setRestaurants(filtered);
    } else {
      // If search is empty, show all restaurants
      setRestaurants(allRestaurants);
    }
  }, [restaurantSearchFilter, allRestaurants]);

  const fetchCuisines = async () => {
    try {
      const data = await adminApi.getAllCuisines();
      setCuisines(data);
    } catch (error) {
      console.error('Error fetching cuisines:', error);
    }
  };

  const handleClearSearch = () => {
    setRestaurantSearchFilter("");
    setRestaurants(allRestaurants);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const result = await adminApi.uploadRestaurantImage(file);
      setRestaurantImageUrl(result.imageUrl);
      toast.success("Image uploaded successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast.error(error.message || "Failed to upload image", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const openRestaurantDetail = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setOpenDetail(true);
  };

  const resetForm = () => {
    setFormR({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      restaurantName: "",
      contactPersonName: "",
      fssaiLicenseNumber: "",
      gstinNumber: ""
    });
    setLocation({
      locationName: "",
      address: "",
      latitude: "",
      longitude: "",
      contactNumber: "",
      email: ""
    });
    setOperatingHours({
      monday: { open: "09:00", close: "22:00", isClosed: false },
      tuesday: { open: "09:00", close: "22:00", isClosed: false },
      wednesday: { open: "09:00", close: "22:00", isClosed: false },
      thursday: { open: "09:00", close: "22:00", isClosed: false },
      friday: { open: "09:00", close: "22:00", isClosed: false },
      saturday: { open: "09:00", close: "22:00", isClosed: false },
      sunday: { open: "09:00", close: "22:00", isClosed: false }
    });
    setBankDetails({
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: ""
    });
    setSelectedCuisineIds([]);
      setRestaurantImageUrl("");
  };

  // Geocode address to get lat/long
  const handleGeocodeAddress = async () => {
    if (!location.address.trim()) {
      alert("Please enter an address first");
      return;
    }

    try {
      setGeocoding(true);
      const encodedAddress = encodeURIComponent(location.address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        setLocation({
          ...location,
          latitude: lat.toString(),
          longitude: lng.toString()
        });
        
        alert("Location coordinates found successfully!");
      } else {
        alert(`Geocoding failed: ${data.status}. Please check the address and try again.`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to get coordinates. Please check your internet connection and try again.");
    } finally {
      setGeocoding(false);
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Basic info validation
    const basicValid = formR.fullName && formR.password && formR.restaurantName && 
                       (formR.email || formR.phoneNumber);
    
    // Location validation (must have address AND coordinates)
    const locationValid = location.address && location.latitude && location.longitude;
    
    // Cuisine validation (at least one cuisine must be selected)
    const cuisineValid = selectedCuisineIds.length > 0;
    
    return basicValid && locationValid && cuisineValid;
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      
      // Validate required fields
      if (!formR.fullName || !formR.password || !formR.restaurantName) {
        alert("Please fill in all required fields (Name, Password, Restaurant Name)");
        return;
      }
      
      if (!formR.email && !formR.phoneNumber) {
        alert("Please provide either email or phone number");
        return;
      }

      if (formR.phoneNumber && !isTenDigitPhone(formR.phoneNumber)) {
        alert("Mobile number must be exactly 10 digits");
        return;
      }

      if (location.contactNumber && !isTenDigitPhone(location.contactNumber)) {
        alert("Mobile number must be exactly 10 digits");
        return;
      }
      
      if (!location.address || !location.latitude || !location.longitude) {
        alert("Please provide complete location details (Address, Latitude, Longitude)");
        return;
      }
      
      if (selectedCuisineIds.length === 0) {
        alert("Please select at least one cuisine");
        return;
      }
      
      // Build bank details object if any field is provided
      const bankAccountDetails = (bankDetails.accountNumber || bankDetails.ifscCode) ? {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      } : undefined;
      
      // Build operating hours array
      const hoursArray = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        openTime: operatingHours[day].isClosed ? null : operatingHours[day].open + ':00',
        closeTime: operatingHours[day].isClosed ? null : operatingHours[day].close + ':00',
        isClosed: operatingHours[day].isClosed
      }));

      const userPhoneDigits = normalizePhoneDigits(formR.phoneNumber);
      const locationPhoneDigits = normalizePhoneDigits(location.contactNumber);
      
      // Single API call to onboard restaurant with all details - using helper to get status
      const result = await apiRequestWithStatus('/admin/restaurants', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: userPhoneDigits ? `+91${userPhoneDigits}` : undefined,
          email: formR.email || undefined,
          password: formR.password,
          fullName: formR.fullName,
          userType: 'restaurant',
          restaurantName: formR.restaurantName,
          contactPersonName: formR.contactPersonName || formR.fullName,
          fssaiLicenseNumber: formR.fssaiLicenseNumber || undefined,
          gstinNumber: formR.gstinNumber || undefined,
          imageUrl: restaurantImageUrl || undefined,
          bankAccountDetails,
          primaryLocation: {
            locationName: location.locationName || formR.restaurantName,
            address: location.address,
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            contactNumber: locationPhoneDigits ? `+91${locationPhoneDigits}` : (userPhoneDigits ? `+91${userPhoneDigits}` : undefined),
            email: location.email || formR.email
          },
          operatingHours: hoursArray,
          restaurantCuisineIds: selectedCuisineIds
        })
      });
      
      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh the list
        setRestaurants(await adminApi.getAllRestaurants());
        setOpenAdd(false);
        resetForm();
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      console.error('Create restaurant failed', err);
      // Show error toast for unexpected errors
      const errorMessage = err?.message || "Failed to add restaurant";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close' | 'isClosed', value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const openEditDialog = async (restaurant: any) => {
    try {
      // Fetch full restaurant details including location and operating hours
      const fullDetails = await adminApi.getRestaurantById(restaurant.restaurantId);
      setSelectedRestaurant(fullDetails);
      
      // Pre-fill form with existing data
      setFormR({
        fullName: fullDetails.userFullName || "",
        email: fullDetails.userEmail || "",
        phoneNumber: fullDetails.phoneNumber?.replace('+91', '') || "",
        password: "", // Don't pre-fill password
        restaurantName: fullDetails.restaurantName || "",
        contactPersonName: fullDetails.contactPersonName || "",
        fssaiLicenseNumber: fullDetails.fssaiLicenseNumber || "",
        gstinNumber: fullDetails.gstinNumber || ""
      });
      
      // Pre-fill location
      if (fullDetails.primaryLocation) {
        setLocation({
          locationName: fullDetails.primaryLocation.locationName || "",
          address: fullDetails.primaryLocation.address || "",
          latitude: fullDetails.primaryLocation.latitude?.toString() || "",
          longitude: fullDetails.primaryLocation.longitude?.toString() || "",
          contactNumber: fullDetails.primaryLocation.contactNumber?.replace('+91', '') || "",
          email: fullDetails.primaryLocation.email || ""
        });
      }
      
      // Pre-fill operating hours
      if (fullDetails.operatingHours) {
        const hours: Record<string, {open: string, close: string, isClosed: boolean}> = {};
        DAYS_OF_WEEK.forEach(day => {
          const dayData = fullDetails.operatingHours[day];
          if (dayData) {
            hours[day] = {
              open: dayData.openTime?.substring(0, 5) || "09:00",
              close: dayData.closeTime?.substring(0, 5) || "22:00",
              isClosed: dayData.isClosed || false
            };
          } else {
            hours[day] = { open: "09:00", close: "22:00", isClosed: false };
          }
        });
        setOperatingHours(hours);
      }
      
      // Pre-fill bank details
      if (fullDetails.bankAccountDetails) {
        setBankDetails({
          accountNumber: fullDetails.bankAccountDetails.accountNumber || "",
          ifscCode: fullDetails.bankAccountDetails.ifscCode || "",
          accountHolderName: fullDetails.bankAccountDetails.accountHolderName || "",
          bankName: fullDetails.bankAccountDetails.bankName || ""
        });
      }
      
      // Pre-fill cuisines
      setSelectedCuisineIds(fullDetails.cuisines ? fullDetails.cuisines.map((c: any) => c.id) : []);
      
      // Pre-fill image URL
      setRestaurantImageUrl(fullDetails.imageUrl || "");
      
      setOpenEdit(true);
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      alert('Failed to load restaurant details');
    }
  };

  const handleUpdate = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setEditing(true);
      
      // Validate cuisines
      if (selectedCuisineIds.length === 0) {
        alert("Please select at least one cuisine");
        return;
      }
      
      // Build bank details object if any field is provided
      const bankAccountDetails = (bankDetails.accountNumber || bankDetails.ifscCode) ? {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      } : undefined;
      
      // Build operating hours array
      const hoursArray = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        openTime: operatingHours[day].isClosed ? null : operatingHours[day].open + ':00',
        closeTime: operatingHours[day].isClosed ? null : operatingHours[day].close + ':00',
        isClosed: operatingHours[day].isClosed
      }));

      if (location.contactNumber && !isTenDigitPhone(location.contactNumber)) {
        alert("Mobile number must be exactly 10 digits");
        return;
      }
      const locationPhoneDigits = normalizePhoneDigits(location.contactNumber);
      
      // Update restaurant profile (basic info, location, hours, bank)
      await adminApi.updateRestaurantProfile(selectedRestaurant.restaurantId, {
        restaurantName: formR.restaurantName,
        contactPersonName: formR.contactPersonName,
        fssaiLicenseNumber: formR.fssaiLicenseNumber || undefined,
        gstinNumber: formR.gstinNumber || undefined,
        imageUrl: restaurantImageUrl || undefined,
        bankAccountDetails,
        primaryLocation: {
          locationName: location.locationName || formR.restaurantName,
          address: location.address,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          contactNumber: locationPhoneDigits ? `+91${locationPhoneDigits}` : undefined,
          email: location.email || undefined
        },
        operatingHours: hoursArray
      });
      
      // Update cuisines
      await adminApi.updateRestaurantCuisines(selectedRestaurant.restaurantId, selectedCuisineIds);
      
      // Refresh list
      const updatedRestaurants = await adminApi.getAllRestaurants();
      setRestaurants(updatedRestaurants);
      setOpenEdit(false);
      resetForm();
      alert("Restaurant updated successfully!");
    } catch (error) {
      console.error('Update failed', error);
      alert(`Failed to update restaurant: ${error}`);
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setDeleting(true);
      await adminApi.deleteRestaurant(selectedRestaurant.restaurantId);
      
      // Refresh list
      const updatedRestaurants = await adminApi.getAllRestaurants();
      setRestaurants(updatedRestaurants);
      setDeleteConfirm(false);
      setSelectedRestaurant(null);
      toast.success("Restaurant deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Delete failed', error);
      alert(`Failed to delete restaurant: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    try {
      // Use helper to get status code
      const result = await apiRequestWithStatus(`/admin/restaurants/${restaurantId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Show toast based on status
      if (result.status < 300) {
        toast.success(`Restaurant ${newStatus} successfully`, {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh list
        const updatedRestaurants = await adminApi.getAllRestaurants();
        setRestaurants(updatedRestaurants);
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error('Status update failed', error);
      // Show error toast for unexpected errors
      const errorMessage = error?.message || "Failed to update status";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Partner Restaurants</CardTitle>
            <Dialog open={openAdd} onOpenChange={(open) => { setOpenAdd(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4"/>Add Restaurant</Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Restaurant</DialogTitle>
                <DialogDescription>Complete restaurant onboarding with all details</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="hours">Operating Hours</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Owner Full Name *</label>
                      <Input value={formR.fullName} onChange={e => setFormR({...formR, fullName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Restaurant Name *</label>
                      <Input value={formR.restaurantName} onChange={e => setFormR({...formR, restaurantName: e.target.value})} placeholder="Tasty Bites" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input type="email" value={formR.email} onChange={e => setFormR({...formR, email: e.target.value})} placeholder="owner@restaurant.com" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number *</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                        <Input 
                          value={formR.phoneNumber} 
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setFormR({...formR, phoneNumber: value});
                            }
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Enter 10-digit mobile number</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <Input type="password" value={formR.password} onChange={e => setFormR({...formR, password: e.target.value})} placeholder="Initial password" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Person</label>
                      <Input value={formR.contactPersonName} onChange={e => setFormR({...formR, contactPersonName: e.target.value})} placeholder="Manager name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">FSSAI License</label>
                      <Input value={formR.fssaiLicenseNumber} onChange={e => setFormR({...formR, fssaiLicenseNumber: e.target.value})} placeholder="12345678901234" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">GSTIN</label>
                      <Input value={formR.gstinNumber} onChange={e => setFormR({...formR, gstinNumber: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Restaurant Image (Optional)</label>
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
                        {restaurantImageUrl && (
                          <div className="mt-2">
                            <img 
                              src={restaurantImageUrl} 
                              alt="Restaurant preview" 
                              className="w-32 h-32 object-cover rounded-md border"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Image uploaded successfully</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cuisine Selection */}
                  <div className="mt-4">
                    <MultiSelect
                      label="Cuisines *"
                      options={cuisines}
                      selected={selectedCuisineIds}
                      onChange={setSelectedCuisineIds}
                      placeholder="Select cuisines..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Search and select multiple cuisines. At least one is required.
                    </p>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> Restaurants onboarded by admins are automatically approved and verified.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Location Name</label>
                      <Input value={location.locationName} onChange={e => setLocation({...location, locationName: e.target.value})} placeholder="Main Branch" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Address *</label>
                      <Input value={location.address} onChange={e => setLocation({...location, address: e.target.value})} placeholder="123 Main Street, City, State - 400001" />
                      <p className="text-xs text-muted-foreground mt-1">Enter the full address and click the button below to get coordinates</p>
                    </div>
                    <div className="col-span-2">
                      <Button 
                        type="button"
                        onClick={handleGeocodeAddress} 
                        disabled={!location.address || geocoding}
                        className="w-full gap-2"
                        variant="secondary"
                      >
                        {geocoding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting Coordinates...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            Get Coordinates from Address
                          </>
                        )}
                      </Button>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Latitude *</label>
                      <Input 
                        type="text" 
                        value={location.latitude} 
                        readOnly 
                        placeholder="Auto-filled from address"
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-populated from address</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Longitude *</label>
                      <Input 
                        type="text" 
                        value={location.longitude} 
                        readOnly 
                        placeholder="Auto-filled from address"
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-populated from address</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location Contact</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                        <Input 
                          value={location.contactNumber} 
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setLocation({...location, contactNumber: value});
                            }
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location Email</label>
                      <Input type="email" value={location.email} onChange={e => setLocation({...location, email: e.target.value})} placeholder="branch@restaurant.com" />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Operating Hours Tab */}
                <TabsContent value="hours" className="space-y-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="flex items-center gap-4 p-2 border rounded">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      <input 
                        type="checkbox" 
                        checked={operatingHours[day].isClosed} 
                        onChange={(e) => updateOperatingHours(day, 'isClosed', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label className="text-sm">Closed</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          value={operatingHours[day].open} 
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          disabled={operatingHours[day].isClosed}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input 
                          type="time" 
                          value={operatingHours[day].close} 
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          disabled={operatingHours[day].isClosed}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                {/* Bank Details Tab */}
                <TabsContent value="bank" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Account Holder Name</label>
                      <Input value={bankDetails.accountHolderName} onChange={e => setBankDetails({...bankDetails, accountHolderName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bank Name</label>
                      <Input value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="HDFC Bank" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Number</label>
                      <Input value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="1234567890" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">IFSC Code</label>
                      <Input value={bankDetails.ifscCode} onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})} placeholder="HDFC0001234" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancel</Button>
                <Button disabled={creating || !isFormValid()} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Restaurant'}
                </Button>
              </div>
              {!isFormValid() && (
                <p className="text-xs text-amber-600 text-right mt-2">
                  Please fill all required fields including address coordinates and at least one cuisine
                </p>
              )}
            </DialogContent>
          </Dialog>
          </div>
          {/* Restaurant Real-time Search */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 max-w-md">
              <label className="text-sm font-medium mb-1 block">Search Restaurants</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={restaurantSearchFilter}
                  onChange={(e) => setRestaurantSearchFilter(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="pl-9"
                />
              </div>
            </div>
            {restaurantSearchFilter && (
              <Button variant="outline" onClick={handleClearSearch} className="mb-0">
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No restaurants found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((r) => (
                  <TableRow 
                    key={r.restaurantId}
                  >
                    <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => openRestaurantDetail(r)}>{r.restaurantName || 'N/A'}</TableCell>
                    <TableCell>{r.contactPersonName || 'N/A'}</TableCell>
                    <TableCell>{r.userEmail || 'N/A'}</TableCell>
                    <TableCell>{r.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Select value={r.status || 'pending'} onValueChange={(value) => handleStatusChange(r.restaurantId, value)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="approved">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Approved
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-red-600" />
                              Rejected
                            </div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2">
                              <Ban className="h-3 w-3 text-orange-600" />
                              Suspended
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{r.averageRating || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={r.documentsVerified ? "default" : "secondary"}>
                        {r.documentsVerified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(r)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDeleteDialog(r)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Restaurant Details
            </DialogTitle>
          </DialogHeader>
          {selectedRestaurant && (
            <div className="grid gap-6">
              {/* Restaurant Image */}
              {selectedRestaurant.imageUrl && (
                <div className="flex justify-center">
                  <div className="space-y-2">
                    <img 
                      src={selectedRestaurant.imageUrl} 
                      alt={selectedRestaurant.restaurantName || 'Restaurant'} 
                      className="w-full max-w-md h-64 object-cover rounded-lg border shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Restaurant Name</label>
                    <div className="text-sm mt-1">{selectedRestaurant.restaurantName || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <div className="text-sm mt-1">{selectedRestaurant.contactPersonName || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="text-sm mt-1">{selectedRestaurant.userEmail || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="text-sm mt-1">{selectedRestaurant.phoneNumber || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">FSSAI License</label>
                    <div className="text-sm mt-1">{selectedRestaurant.fssaiLicenseNumber || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                    <div className="text-sm mt-1">{selectedRestaurant.gstinNumber || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-sm mt-1">
                      <Badge variant={
                        selectedRestaurant.status === "approved" ? "default" :
                        selectedRestaurant.status === "rejected" ? "destructive" :
                        "secondary"
                      }>
                        {selectedRestaurant.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Average Rating</label>
                    <div className="text-sm mt-1">{selectedRestaurant.averageRating || '0.0'} ⭐</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documents Verified</label>
                    <div className="text-sm mt-1">
                      <Badge variant={selectedRestaurant.documentsVerified ? "default" : "secondary"}>
                        {selectedRestaurant.documentsVerified ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <div className="text-sm mt-1">
                      {selectedRestaurant.createdAt ? new Date(selectedRestaurant.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuisines */}
              {selectedRestaurant.cuisines && selectedRestaurant.cuisines.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Cuisines</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.cuisines.map((cuisine: any) => (
                      <Badge key={cuisine.id} variant="secondary">
                        {cuisine.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* IDs */}
              <div>
                <h3 className="font-semibold mb-3">System IDs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Restaurant ID</label>
                    <div className="text-xs mt-1 font-mono">{selectedRestaurant.restaurantId}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <div className="text-xs mt-1 font-mono">{selectedRestaurant.userId}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Restaurant Dialog */}
      <Dialog open={openEdit} onOpenChange={(open) => { 
        setOpenEdit(open); 
        if (!open) resetForm(); 
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>
              Update details for {selectedRestaurant?.restaurantName}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="cuisines">Cuisines</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Restaurant Name *</label>
                  <Input value={formR.restaurantName} onChange={e => setFormR({...formR, restaurantName: e.target.value})} placeholder="Tasty Bites" />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input value={formR.contactPersonName} onChange={e => setFormR({...formR, contactPersonName: e.target.value})} placeholder="Manager name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={formR.email} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                    <Input value={formR.phoneNumber} disabled className="bg-muted cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phone cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">FSSAI License</label>
                  <Input value={formR.fssaiLicenseNumber} onChange={e => setFormR({...formR, fssaiLicenseNumber: e.target.value})} placeholder="12345678901234" />
                </div>
                <div>
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input value={formR.gstinNumber} onChange={e => setFormR({...formR, gstinNumber: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Restaurant Image (Optional)</label>
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
                    {restaurantImageUrl && (
                      <div className="mt-2">
                        <img 
                          src={restaurantImageUrl} 
                          alt="Restaurant preview" 
                          className="w-32 h-32 object-cover rounded-md border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Image uploaded successfully</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Location Name</label>
                  <Input value={location.locationName} onChange={e => setLocation({...location, locationName: e.target.value})} placeholder="Main Branch" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Address *</label>
                  <Input value={location.address} onChange={e => setLocation({...location, address: e.target.value})} placeholder="123 Main Street, City, State - 400001" />
                  <p className="text-xs text-muted-foreground mt-1">Enter the full address and click below to update coordinates</p>
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button"
                    onClick={handleGeocodeAddress} 
                    disabled={!location.address || geocoding}
                    className="w-full gap-2"
                    variant="secondary"
                  >
                    {geocoding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting Coordinates...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Update Coordinates from Address
                      </>
                    )}
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Latitude *</label>
                  <Input 
                    type="text" 
                    value={location.latitude} 
                    readOnly 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Longitude *</label>
                  <Input 
                    type="text" 
                    value={location.longitude} 
                    readOnly 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location Contact</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                    <Input 
                      value={location.contactNumber} 
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setLocation({...location, contactNumber: value});
                        }
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Location Email</label>
                  <Input type="email" value={location.email} onChange={e => setLocation({...location, email: e.target.value})} placeholder="branch@restaurant.com" />
                </div>
              </div>
            </TabsContent>
            
            {/* Operating Hours Tab */}
            <TabsContent value="hours" className="space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center gap-4 p-2 border rounded">
                  <div className="w-24 font-medium capitalize">{day}</div>
                  <input 
                    type="checkbox" 
                    checked={operatingHours[day].isClosed} 
                    onChange={(e) => updateOperatingHours(day, 'isClosed', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label className="text-sm">Closed</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time" 
                      value={operatingHours[day].open} 
                      onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                      disabled={operatingHours[day].isClosed}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input 
                      type="time" 
                      value={operatingHours[day].close} 
                      onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                      disabled={operatingHours[day].isClosed}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </TabsContent>
            
            {/* Cuisines Tab */}
            <TabsContent value="cuisines" className="space-y-4">
              <MultiSelect
                label="Cuisines *"
                options={cuisines}
                selected={selectedCuisineIds}
                onChange={setSelectedCuisineIds}
                placeholder="Select cuisines..."
              />
              <p className="text-xs text-muted-foreground">
                Search and select multiple cuisines. At least one is required.
              </p>
            </TabsContent>
            
            {/* Bank Details Tab */}
            <TabsContent value="bank" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Account Holder Name</label>
                  <Input value={bankDetails.accountHolderName} onChange={e => setBankDetails({...bankDetails, accountHolderName: e.target.value})} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <Input value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="HDFC Bank" />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Number</label>
                  <Input value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="1234567890" />
                </div>
                <div>
                  <label className="text-sm font-medium">IFSC Code</label>
                  <Input value={bankDetails.ifscCode} onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})} placeholder="HDFC0001234" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setOpenEdit(false); resetForm(); }}>Cancel</Button>
            <Button 
              disabled={editing || !formR.restaurantName} 
              onClick={handleUpdate}
            >
              {editing ? 'Updating...' : 'Update Restaurant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedRestaurant?.restaurantName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. This will permanently delete the restaurant,
              all its data, and the associated user account.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              disabled={deleting} 
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Restaurant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
