import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Truck, UtensilsCrossed, IndianRupee, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "./StatCard";
import { getStatusLabel } from "@/constants/orderStatus";

export function Finance() {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [restaurantData, setRestaurantData] = useState<any[]>([]);
  const [deliveryPartnerData, setDeliveryPartnerData] = useState<any[]>([]);
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());
  const [expandedDeliveryPartners, setExpandedDeliveryPartners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<string[]>([]);
  const [selectedDeliveryPartnerIds, setSelectedDeliveryPartnerIds] = useState<string[]>([]);
  
  // Restaurant filter states
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearchFilter, setRestaurantSearchFilter] = useState("");
  
  // Delivery Partner filter states
  const [allDeliveryPartners, setAllDeliveryPartners] = useState<any[]>([]);
  const [deliveryPartnerDropdownOpen, setDeliveryPartnerDropdownOpen] = useState(false);
  const [deliveryPartnerSearchFilter, setDeliveryPartnerSearchFilter] = useState("");
  
  // Time period filter states
  const [restaurantTimePeriod, setRestaurantTimePeriod] = useState<string>("total");
  const [restaurantStartDate, setRestaurantStartDate] = useState<string>("");
  const [restaurantEndDate, setRestaurantEndDate] = useState<string>("");
  const [deliveryPartnerTimePeriod, setDeliveryPartnerTimePeriod] = useState<string>("total");
  const [deliveryPartnerStartDate, setDeliveryPartnerStartDate] = useState<string>("");
  const [deliveryPartnerEndDate, setDeliveryPartnerEndDate] = useState<string>("");

  useEffect(() => {
    fetchAllRestaurants();
    fetchAllDeliveryPartners();
    fetchRestaurantData();
    fetchDeliveryPartnerData();
  }, []);

  // Calculate dates based on time period
  const calculateDateRange = (period: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDate = today.toISOString().split('T')[0];
    let startDate = '';

    switch (period) {
      case 'day':
        startDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'total':
        startDate = '';
        break;
      case 'custom':
        // Keep existing custom dates
        return { startDate: restaurantStartDate, endDate: restaurantEndDate };
      default:
        startDate = '';
    }

    return { startDate, endDate };
  };

  // Update dates when time period changes
  useEffect(() => {
    if (restaurantTimePeriod !== 'custom' && restaurantTimePeriod !== 'total') {
      const { startDate, endDate } = calculateDateRange(restaurantTimePeriod);
      setRestaurantStartDate(startDate);
      setRestaurantEndDate(endDate);
    } else if (restaurantTimePeriod === 'total') {
      setRestaurantStartDate("");
      setRestaurantEndDate("");
    }
  }, [restaurantTimePeriod]);

  useEffect(() => {
    if (deliveryPartnerTimePeriod !== 'custom' && deliveryPartnerTimePeriod !== 'total') {
      const { startDate, endDate } = calculateDateRange(deliveryPartnerTimePeriod);
      setDeliveryPartnerStartDate(startDate);
      setDeliveryPartnerEndDate(endDate);
    } else if (deliveryPartnerTimePeriod === 'total') {
      setDeliveryPartnerStartDate("");
      setDeliveryPartnerEndDate("");
    }
  }, [deliveryPartnerTimePeriod]);

  const fetchAllRestaurants = async () => {
    try {
      const restaurants = await adminApi.getAllRestaurants();
      setAllRestaurants(restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchAllDeliveryPartners = async () => {
    try {
      const deliveryPartners = await adminApi.getAllDeliveryPartners();
      setAllDeliveryPartners(deliveryPartners);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    }
  };

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const ids = selectedRestaurantIds.length > 0 ? selectedRestaurantIds : undefined;
      
      // Calculate dates based on time period
      let startDate: string | undefined = undefined;
      let endDate: string | undefined = undefined;
      
      if (restaurantTimePeriod === 'custom') {
        startDate = restaurantStartDate || undefined;
        endDate = restaurantEndDate || undefined;
      } else if (restaurantTimePeriod !== 'total') {
        const dateRange = calculateDateRange(restaurantTimePeriod);
        startDate = dateRange.startDate || undefined;
        endDate = dateRange.endDate || undefined;
      }
      // For 'total', both dates remain undefined
      
      const data = await adminApi.getRestaurantFinancialSummary(ids, startDate, endDate);
      setRestaurantData(data);
    } catch (error: any) {
      console.error('Error fetching restaurant financial data:', error);
      toast.error(error.message || 'Failed to fetch restaurant financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPartnerData = async () => {
    try {
      setLoading(true);
      const ids = selectedDeliveryPartnerIds.length > 0 ? selectedDeliveryPartnerIds : undefined;
      
      // Calculate dates based on time period
      let startDate: string | undefined = undefined;
      let endDate: string | undefined = undefined;
      
      if (deliveryPartnerTimePeriod === 'custom') {
        startDate = deliveryPartnerStartDate || undefined;
        endDate = deliveryPartnerEndDate || undefined;
      } else if (deliveryPartnerTimePeriod !== 'total') {
        const dateRange = calculateDateRange(deliveryPartnerTimePeriod);
        startDate = dateRange.startDate || undefined;
        endDate = dateRange.endDate || undefined;
      }
      // For 'total', both dates remain undefined
      
      const data = await adminApi.getDeliveryPartnerFinancialSummary(ids, startDate, endDate);
      setDeliveryPartnerData(data);
    } catch (error: any) {
      console.error('Error fetching delivery partner financial data:', error);
      toast.error(error.message || 'Failed to fetch delivery partner financial data');
    } finally {
      setLoading(false);
    }
  };

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

  const toggleDeliveryPartner = (deliveryPartnerId: string) => {
    setExpandedDeliveryPartners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliveryPartnerId)) {
        newSet.delete(deliveryPartnerId);
      } else {
        newSet.add(deliveryPartnerId);
      }
      return newSet;
    });
  };

  const toggleRestaurantSelection = (restaurantId: string) => {
    if (selectedRestaurantIds.includes(restaurantId)) {
      setSelectedRestaurantIds(selectedRestaurantIds.filter(id => id !== restaurantId));
    } else {
      setSelectedRestaurantIds([...selectedRestaurantIds, restaurantId]);
    }
  };

  const selectAllRestaurants = () => {
    const allIds = allRestaurants.map(r => r.restaurantId || r.id);
    setSelectedRestaurantIds(allIds);
  };

  const clearRestaurantSelection = () => {
    setSelectedRestaurantIds([]);
  };

  const toggleDeliveryPartnerSelection = (deliveryPartnerId: string) => {
    if (selectedDeliveryPartnerIds.includes(deliveryPartnerId)) {
      setSelectedDeliveryPartnerIds(selectedDeliveryPartnerIds.filter(id => id !== deliveryPartnerId));
    } else {
      setSelectedDeliveryPartnerIds([...selectedDeliveryPartnerIds, deliveryPartnerId]);
    }
  };

  const selectAllDeliveryPartners = () => {
    const allIds = allDeliveryPartners.map(dp => dp.id || dp.deliveryPartnerId);
    setSelectedDeliveryPartnerIds(allIds);
  };

  const clearDeliveryPartnerSelection = () => {
    setSelectedDeliveryPartnerIds([]);
  };

  const clearRestaurantFilters = () => {
    setSelectedRestaurantIds([]);
    setRestaurantTimePeriod("total");
    setRestaurantStartDate("");
    setRestaurantEndDate("");
    fetchRestaurantData();
  };

  const clearDeliveryPartnerFilters = () => {
    setSelectedDeliveryPartnerIds([]);
    setDeliveryPartnerTimePeriod("total");
    setDeliveryPartnerStartDate("");
    setDeliveryPartnerEndDate("");
    fetchDeliveryPartnerData();
  };

  // Calculate aggregated totals from restaurant data
  const calculateRestaurantTotals = () => {
    if (!restaurantData || restaurantData.length === 0) {
      return {
        totalRevenue: 0,
        totalDeliveryFee: 0,
        totalPlatformCommission: 0,
        totalOrders: 0,
        totalRestaurantPayout: 0,
        totalPaymentAmount: 0
      };
    }

    const totals = restaurantData.reduce((acc, restaurant) => {
      acc.totalRevenue += Number(restaurant.totalBagAmount || 0);
      acc.totalDeliveryFee += Number(restaurant.totalDeliveryFee || 0);
      acc.totalPlatformCommission += Number(restaurant.totalPlatformCommission || 0);
      acc.totalOrders += Number(restaurant.totalOrders || 0);
      acc.totalRestaurantPayout += Number((restaurant.totalBagAmount || 0) - (restaurant.totalPlatformCommission || 0));
      acc.totalPaymentAmount += Number(restaurant.totalPaymentAmount || 0);
      return acc;
    }, {
      totalRevenue: 0,
      totalDeliveryFee: 0,
      totalPlatformCommission: 0,
      totalOrders: 0,
      totalRestaurantPayout: 0,
      totalPaymentAmount: 0
    });

    return totals;
  };

  const restaurantTotals = calculateRestaurantTotals();

  // Calculate aggregated totals from delivery partner data
  const calculateDeliveryPartnerTotals = () => {
    if (!deliveryPartnerData || deliveryPartnerData.length === 0) {
      return {
        totalEarnings: 0,
        totalOrders: 0,
        totalDeliveredOrders: 0,
        totalOrderValue: 0
      };
    }

    const totals = deliveryPartnerData.reduce((acc, dp) => {
      acc.totalEarnings += Number(dp.totalDeliveryFeeEarned || 0);
      acc.totalOrders += Number(dp.totalOrders || 0);
      acc.totalDeliveredOrders += Number(dp.deliveredOrders || 0);
      acc.totalOrderValue += Number(dp.totalOrderValue || 0);
      return acc;
    }, {
      totalEarnings: 0,
      totalOrders: 0,
      totalDeliveredOrders: 0,
      totalOrderValue: 0
    });

    return totals;
  };

  const deliveryPartnerTotals = calculateDeliveryPartnerTotals();

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="restaurants">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="delivery-partners">
            <Truck className="h-4 w-4 mr-2" />
            Delivery Partners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="flex-1 flex flex-col mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              icon={IndianRupee}
              title="Total Revenue"
              value={`₹${restaurantTotals.totalRevenue.toFixed(2)}`}
            />
            <StatCard
              icon={ShoppingBag}
              title="Total Delivery Fee"
              value={`₹${restaurantTotals.totalDeliveryFee.toFixed(2)}`}
            />
            <StatCard
              icon={Users}
              title="Total Orders"
              value={restaurantTotals.totalOrders}
            />
          </div>

          <Card className="rounded-2xl flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Restaurant Financial Summary</CardTitle>
              <div className="mt-4 space-y-3">
                {/* Time Period and Restaurant Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Period Filter */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Time Period</label>
                    <Select value={restaurantTimePeriod} onValueChange={setRestaurantTimePeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="total">All Time</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Restaurant Selection Dropdown */}
                  <div className="relative restaurant-dropdown-container">
                    <label className="text-sm font-medium mb-1 block">Select Restaurants</label>
                    <div className="relative">
                      <div
                        onClick={() => setRestaurantDropdownOpen(!restaurantDropdownOpen)}
                        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                      >
                        <div className="flex flex-wrap gap-1 items-center flex-1">
                          {selectedRestaurantIds.length === 0 ? (
                            <span className="text-muted-foreground">All Restaurants</span>
                          ) : (
                            <>
                              {allRestaurants
                                .filter(r => selectedRestaurantIds.includes(r.restaurantId || r.id))
                                .slice(0, 2)
                                .map((restaurant) => (
                                  <Badge key={restaurant.restaurantId || restaurant.id} variant="secondary" className="text-xs">
                                    {restaurant.restaurantName}
                                  </Badge>
                                ))}
                              {selectedRestaurantIds.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{selectedRestaurantIds.length - 2} more
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${restaurantDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Dropdown Menu */}
                      {restaurantDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search restaurants..."
                              value={restaurantSearchFilter}
                              onChange={(e) => setRestaurantSearchFilter(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="p-2 border-b flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllRestaurants}
                              className="flex-1 text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearRestaurantSelection}
                              className="flex-1 text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-auto p-1">
                            {allRestaurants
                              .filter(r => 
                                r.restaurantName?.toLowerCase().includes(restaurantSearchFilter.toLowerCase()) ||
                                r.userEmail?.toLowerCase().includes(restaurantSearchFilter.toLowerCase()) ||
                                r.phoneNumber?.includes(restaurantSearchFilter)
                              )
                              .map((restaurant) => {
                                const restaurantId = restaurant.restaurantId || restaurant.id;
                                const isSelected = selectedRestaurantIds.includes(restaurantId);
                                return (
                                  <div
                                    key={restaurantId}
                                    onClick={() => toggleRestaurantSelection(restaurantId)}
                                    className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                                  >
                                    <div
                                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                                        isSelected
                                          ? "bg-primary border-primary"
                                          : "border-input"
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg
                                          className="h-3 w-3 text-primary-foreground"
                                          fill="none"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{restaurant.restaurantName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {restaurant.userEmail || restaurant.phoneNumber}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedRestaurantIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedRestaurantIds.length} restaurant{selectedRestaurantIds.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Custom Date Range (only shown when custom is selected) */}
                {restaurantTimePeriod === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={restaurantStartDate}
                        onChange={(e) => setRestaurantStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={restaurantEndDate}
                        onChange={(e) => setRestaurantEndDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearRestaurantFilters}
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    onClick={fetchRestaurantData}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading ? (
                <div className="text-center py-8">Loading restaurant financial data...</div>
              ) : restaurantData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No restaurant financial data found</div>
              ) : (
                <div className="space-y-2">
                  {restaurantData.map((restaurant) => (
                    <div key={restaurant.restaurantId} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleRestaurant(restaurant.restaurantId)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="p-1 hover:bg-muted rounded">
                            {expandedRestaurants.has(restaurant.restaurantId) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <h3 className="font-semibold text-lg">{restaurant.restaurantName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {restaurant.restaurantPhone} • {restaurant.deliveredOrders || 0} / {restaurant.totalOrders || 0} Delivered
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-2/5">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Revenue</div>
                            <div className="font-semibold">₹{Number(restaurant.totalBagAmount || 0).toFixed(2)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Delivery Fee</div>
                            <div className="font-semibold">₹{Number(restaurant.totalDeliveryFee || 0).toFixed(2)}</div>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {restaurant.totalOrders || 0} Orders
                          </Badge>
                        </div>
                      </div>

                      {expandedRestaurants.has(restaurant.restaurantId) && (
                        <div className="border-t">
                          <div className="p-4 bg-muted/20">
                            <div className="flex flex-wrap justify-between items-center">
                              <div className="border rounded-lg p-2">
                                <div className="text-sm text-muted-foreground">Restaurant Payout</div>
                                <div className="font-semibold text-green-600">
                                  ₹{Number((restaurant.totalBagAmount || 0) - (restaurant.totalPlatformCommission || 0)).toFixed(2)}
                                </div>
                              </div>
                              <div className="border rounded-lg p-2">
                                <div className="text-sm text-muted-foreground">Platform Commission</div>
                                <div className="font-semibold">₹{Number(restaurant.totalPlatformCommission || 0).toFixed(2)}</div>
                              </div>
                              <div className="border rounded-lg p-2">
                                <div className="text-sm text-muted-foreground">Payment Success Rate</div>
                                <div className="font-semibold">
                                  {restaurant.totalOrders > 0 
                                    ? Number((restaurant.paidOrders || 0) / restaurant.totalOrders * 100).toFixed(1) 
                                    : '0.0'}%
                                </div>
                              </div>
                              <div className="border rounded-lg p-2">
                                <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                                <div className="font-semibold text-red-600">
                                  {restaurant.totalOrders > 0 
                                    ? Number((restaurant.cancelledOrders || 0) / restaurant.totalOrders * 100).toFixed(1) 
                                    : '0.0'}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ({restaurant.cancelledOrders || 0} cancelled)
                                </div>
                              </div>
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Status</TableHead>
                                <TableHead>Bag Amount</TableHead>
                                <TableHead>Delivery Fee</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {restaurant.orders && restaurant.orders.length > 0 ? (
                                restaurant.orders.map((order: any) => (
                                  <TableRow key={order.orderId} className="hover:bg-muted/30">
                                    <TableCell>
                                      <div>{order.customerName || 'N/A'}</div>
                                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                                        {getStatusLabel(order.orderStatus as any)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                        {order.paymentStatus}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>₹{Number(order.totalBagAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell>₹{Number(order.deliveryFee || 0).toFixed(2)}</TableCell>
                                    <TableCell>₹{Number(order.totalPaymentAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm">
                                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No orders found
                                  </TableCell>
                                </TableRow>
                              )}
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
        </TabsContent>

        <TabsContent value="delivery-partners" className="flex-1 flex flex-col mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              icon={IndianRupee}
              title="Total Delivery Fee"
              value={`₹${deliveryPartnerTotals.totalEarnings.toFixed(2)}`}
            />
            <StatCard
              icon={ShoppingBag}
              title="Total Orders"
              value={deliveryPartnerTotals.totalOrders}
            />
            <StatCard
              icon={TrendingUp}
              title="Delivered Orders"
              value={deliveryPartnerTotals.totalDeliveredOrders}
            />
          </div>

          <Card className="rounded-2xl flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Delivery Partner Financial Summary</CardTitle>
              <div className="mt-4 space-y-3">
                {/* Time Period and Delivery Partner Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Period Filter */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Time Period</label>
                    <Select value={deliveryPartnerTimePeriod} onValueChange={setDeliveryPartnerTimePeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="total">All Time</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delivery Partner Selection Dropdown */}
                  <div className="relative delivery-partner-dropdown-container">
                    <label className="text-sm font-medium mb-1 block">Select Delivery Partners</label>
                    <div className="relative">
                      <div
                        onClick={() => setDeliveryPartnerDropdownOpen(!deliveryPartnerDropdownOpen)}
                        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                      >
                        <div className="flex flex-wrap gap-1 items-center flex-1">
                          {selectedDeliveryPartnerIds.length === 0 ? (
                            <span className="text-muted-foreground">All Delivery Partners</span>
                          ) : (
                            <>
                              {allDeliveryPartners
                                .filter(dp => selectedDeliveryPartnerIds.includes(dp.id || dp.deliveryPartnerId))
                                .slice(0, 2)
                                .map((dp) => (
                                  <Badge key={dp.id || dp.deliveryPartnerId} variant="secondary" className="text-xs">
                                    {dp.fullName}
                                  </Badge>
                                ))}
                              {selectedDeliveryPartnerIds.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{selectedDeliveryPartnerIds.length - 2} more
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${deliveryPartnerDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Dropdown Menu */}
                      {deliveryPartnerDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search delivery partners..."
                              value={deliveryPartnerSearchFilter}
                              onChange={(e) => setDeliveryPartnerSearchFilter(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="p-2 border-b flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllDeliveryPartners}
                              className="flex-1 text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearDeliveryPartnerSelection}
                              className="flex-1 text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-auto p-1">
                            {allDeliveryPartners
                              .filter(dp => 
                                dp.fullName?.toLowerCase().includes(deliveryPartnerSearchFilter.toLowerCase()) ||
                                dp.email?.toLowerCase().includes(deliveryPartnerSearchFilter.toLowerCase()) ||
                                dp.phoneNumber?.includes(deliveryPartnerSearchFilter) ||
                                dp.vehicleType?.toLowerCase().includes(deliveryPartnerSearchFilter.toLowerCase())
                              )
                              .map((dp) => {
                                const dpId = dp.id || dp.deliveryPartnerId;
                                const isSelected = selectedDeliveryPartnerIds.includes(dpId);
                                return (
                                  <div
                                    key={dpId}
                                    onClick={() => toggleDeliveryPartnerSelection(dpId)}
                                    className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                                  >
                                    <div
                                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                                        isSelected
                                          ? "bg-primary border-primary"
                                          : "border-input"
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg
                                          className="h-3 w-3 text-primary-foreground"
                                          fill="none"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{dp.fullName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {dp.email || dp.phoneNumber} • {dp.vehicleType}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedDeliveryPartnerIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDeliveryPartnerIds.length} delivery partner{selectedDeliveryPartnerIds.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Custom Date Range (only shown when custom is selected) */}
                {deliveryPartnerTimePeriod === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Date</label>
                      <Input
                        type="date"
                        value={deliveryPartnerStartDate}
                        onChange={(e) => setDeliveryPartnerStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">End Date</label>
                      <Input
                        type="date"
                        value={deliveryPartnerEndDate}
                        onChange={(e) => setDeliveryPartnerEndDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearDeliveryPartnerFilters}
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    onClick={fetchDeliveryPartnerData}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loading ? (
                <div className="text-center py-8">Loading delivery partner financial data...</div>
              ) : deliveryPartnerData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No delivery partner financial data found</div>
              ) : (
                <div className="space-y-2">
                  {deliveryPartnerData.map((dp) => (
                    <div key={dp.deliveryPartnerId} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleDeliveryPartner(dp.deliveryPartnerId)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="p-1 hover:bg-muted rounded">
                            {expandedDeliveryPartners.has(dp.deliveryPartnerId) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <h3 className="font-semibold text-lg">{dp.deliveryPartnerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {dp.deliveryPartnerPhone} • {dp.vehicleType} • {dp.totalOrders} order{dp.totalOrders !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Delivery Fee Earned</div>
                            <div className="font-semibold">₹{Number(dp.totalDeliveryFeeEarned || 0).toFixed(2)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Order Value</div>
                            <div className="font-semibold">₹{Number(dp.totalOrderValue || 0).toFixed(2)}</div>
                          </div>
                          <Badge variant={dp.isOnline ? "default" : "secondary"} className="text-sm">
                            {dp.isOnline ? "Online" : "Offline"}
                          </Badge>
                        </div>
                      </div>

                      {expandedDeliveryPartners.has(dp.deliveryPartnerId) && (
                        <div className="border-t">
                          <div className="p-4 bg-muted/20">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Total Delivery Fee</div>
                                <div className="font-semibold text-green-600">
                                  ₹{Number(dp.totalDeliveryFeeEarned || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Delivered Orders</div>
                                <div className="font-semibold text-green-600">{dp.deliveredOrders || 0}</div>
                              </div>
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Delivery Success Rate</div>
                                <div className="font-semibold">
                                  {dp.totalOrders > 0 
                                    ? Number((dp.deliveredOrders || 0) / dp.totalOrders * 100).toFixed(1) 
                                    : '0.0'}%
                                </div>
                              </div>
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                                <div className="font-semibold text-red-600">
                                  {dp.totalOrders > 0 
                                    ? Number((dp.cancelledOrders || 0) / dp.totalOrders * 100).toFixed(1) 
                                    : '0.0'}%
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Average Rating</div>
                                <div className="font-semibold">{Number(dp.averageRating || 0).toFixed(1)} ⭐</div>
                              </div>
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Payment Success Rate</div>
                                <div className="font-semibold">
                                  {dp.totalOrders > 0 
                                    ? Number((dp.paidOrders || 0) / dp.totalOrders * 100).toFixed(1) 
                                    : '0.0'}%
                                </div>
                              </div>
                              <div className="border rounded-lg p-2 text-center">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="font-semibold">
                                  <Badge variant={dp.isOnline ? "default" : "secondary"} className="text-xs">
                                    {dp.isOnline ? "Online" : "Offline"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Status</TableHead>
                                <TableHead>Delivery Fee</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dp.orders && dp.orders.length > 0 ? (
                                dp.orders.map((order: any) => (
                                  <TableRow key={order.orderId} className="hover:bg-muted/30">
                                    <TableCell>
                                      <div>{order.customerName || 'N/A'}</div>
                                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                    </TableCell>
                                    <TableCell>{order.restaurantName || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                                        {getStatusLabel(order.orderStatus as any)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                        {order.paymentStatus}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>₹{Number(order.deliveryFee || 0).toFixed(2)}</TableCell>
                                    <TableCell>₹{Number(order.totalPaymentAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-sm">
                                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No orders found
                                  </TableCell>
                                </TableRow>
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
