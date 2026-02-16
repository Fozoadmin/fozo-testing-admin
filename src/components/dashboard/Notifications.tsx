import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { motion } from "framer-motion";
import { Plus, Bell, Trash2, Calendar, Clock, ChevronDown, Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";

type OrderNotificationSettingKey =
    | "orderConfirmedNotificationTitle"
    | "orderConfirmedNotificationDescription"
    | "orderOutForDeliveryNotificationTitle"
    | "orderOutForDeliveryNotificationDescription"
    | "orderDeliveredNotificationTitle"
    | "orderDeliveredNotificationDescription"
    | "orderCancelledByAdminNotificationTitle"
    | "orderCancelledByAdminNotificationDescription"
    | "orderCancelledByRestaurantNotificationTitle"
    | "orderCancelledByRestaurantNotificationDescription"
    | "orderRefundedNotificationTitle"
    | "orderRefundedNotificationDescription";

type OrderNotificationSettings = Record<OrderNotificationSettingKey, string>;

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        scheduledAt: "",
    });
    const [targetType, setTargetType] = useState<"all" | "specific" | "all_customers" | "all_restaurants" | "all_delivery_partners">("all_customers");
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [filterType, setFilterType] = useState<"all" | "customer" | "restaurant" | "delivery_partner">("all");
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: "",
        description: "",
        scheduledAt: "",
    });
    const [editTargetType, setEditTargetType] = useState<"all" | "specific" | "all_customers" | "all_restaurants" | "all_delivery_partners">("all");
    const [editSelectedUserIds, setEditSelectedUserIds] = useState<string[]>([]);

    // Order notification template settings (from settings model)
    const [orderNotificationSettings, setOrderNotificationSettings] = useState<OrderNotificationSettings | null>(null);
    const [originalOrderNotificationSettings, setOriginalOrderNotificationSettings] = useState<OrderNotificationSettings | null>(null);
    const [ordersDropdownOpen, setOrdersDropdownOpen] = useState<boolean>(false);

    const fetchUsers = async () => {
        try {
            const data = await adminApi.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        if ((targetType === "specific" || editTargetType === "specific") && users.length === 0) {
            fetchUsers();
        }
    }, [targetType, editTargetType]);

    const orderNotificationFields: {
        keyPrefix: string;
        titleKey: OrderNotificationSettingKey;
        descriptionKey: OrderNotificationSettingKey;
        label: string;
    }[] = [
            {
                keyPrefix: "orderConfirmed",
                titleKey: "orderConfirmedNotificationTitle",
                descriptionKey: "orderConfirmedNotificationDescription",
                label: "Confirmed",
            },
            {
                keyPrefix: "orderOutForDelivery",
                titleKey: "orderOutForDeliveryNotificationTitle",
                descriptionKey: "orderOutForDeliveryNotificationDescription",
                label: "Out for Delivery",
            },
            {
                keyPrefix: "orderDelivered",
                titleKey: "orderDeliveredNotificationTitle",
                descriptionKey: "orderDeliveredNotificationDescription",
                label: "Delivered",
            },
            {
                keyPrefix: "orderCancelledByAdmin",
                titleKey: "orderCancelledByAdminNotificationTitle",
                descriptionKey: "orderCancelledByAdminNotificationDescription",
                label: "Cancelled by Admin",
            },
            {
                keyPrefix: "orderCancelledByRestaurant",
                titleKey: "orderCancelledByRestaurantNotificationTitle",
                descriptionKey: "orderCancelledByRestaurantNotificationDescription",
                label: "Cancelled by Restaurant",
            },
            {
                keyPrefix: "orderRefunded",
                titleKey: "orderRefundedNotificationTitle",
                descriptionKey: "orderRefundedNotificationDescription",
                label: "Refunded",
            },
        ];

    const fetchOrderNotificationSettings = async () => {
        try {
            const allSettings = await adminApi.getSettings();

            const subset: OrderNotificationSettings = {
                orderConfirmedNotificationTitle: allSettings.orderConfirmedNotificationTitle || "",
                orderConfirmedNotificationDescription: allSettings.orderConfirmedNotificationDescription || "",
                orderOutForDeliveryNotificationTitle: allSettings.orderOutForDeliveryNotificationTitle || "",
                orderOutForDeliveryNotificationDescription: allSettings.orderOutForDeliveryNotificationDescription || "",
                orderDeliveredNotificationTitle: allSettings.orderDeliveredNotificationTitle || "",
                orderDeliveredNotificationDescription: allSettings.orderDeliveredNotificationDescription || "",
                orderCancelledByAdminNotificationTitle: allSettings.orderCancelledByAdminNotificationTitle || "",
                orderCancelledByAdminNotificationDescription: allSettings.orderCancelledByAdminNotificationDescription || "",
                orderCancelledByRestaurantNotificationTitle: allSettings.orderCancelledByRestaurantNotificationTitle || "",
                orderCancelledByRestaurantNotificationDescription: allSettings.orderCancelledByRestaurantNotificationDescription || "",
                orderRefundedNotificationTitle: allSettings.orderRefundedNotificationTitle || "",
                orderRefundedNotificationDescription: allSettings.orderRefundedNotificationDescription || "",
            };

            setOrderNotificationSettings(subset);
            setOriginalOrderNotificationSettings({ ...subset });
        } catch (error) {
            console.error("Error fetching order notification settings:", error);
            toast.error("Failed to load order notification templates");
        }
    };

    const handleOrderNotificationChange = (key: OrderNotificationSettingKey, value: string) => {
        if (!orderNotificationSettings) return;
        setOrderNotificationSettings({
            ...orderNotificationSettings,
            [key]: value,
        });
    };

    const handleSaveOrderNotifications = async () => {
        if (!orderNotificationSettings || !originalOrderNotificationSettings) return;

        const changedSettings: Record<string, string> = {};
        (Object.keys(orderNotificationSettings) as OrderNotificationSettingKey[]).forEach((key) => {
            const currentValue = orderNotificationSettings[key] || "";
            const originalValue = originalOrderNotificationSettings[key] || "";
            if (currentValue !== originalValue) {
                changedSettings[key] = currentValue;
            }
        });

        if (Object.keys(changedSettings).length === 0) {
            toast.info("No changes to save for order notifications");
            return;
        }

        try {
            await adminApi.updateSettings(changedSettings);
            toast.success("Order notification templates saved");
            setOriginalOrderNotificationSettings({ ...orderNotificationSettings });
        } catch (error: any) {
            console.error("Error saving order notification settings:", error);
            toast.error(error.message || "Failed to save order notification templates");
        }
    };

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleEditUser = (userId: string) => {
        setEditSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchOrderNotificationSettings();
    }, []);

    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!formData.title || !formData.scheduledAt) {
            toast.error("Title and Scheduled Time are required");
            return;
        }

        try {
            setIsCreating(true);
            const scheduledAtUTC = new Date(formData.scheduledAt).toISOString();
            await adminApi.createNotification({
                ...formData,
                scheduledAt: scheduledAtUTC,
                targetType,
                targetUserIds: targetType === 'specific' ? selectedUserIds : undefined
            });
            toast.success("Notification created successfully");
            setIsDialogOpen(false);
            setFormData({ title: "", description: "", scheduledAt: "" });
            setTargetType("all");
            setSelectedUserIds([]);
            fetchNotifications();
        } catch (error: any) {
            toast.error(error.message || "Failed to create notification");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this notification?")) return;

        try {
            await adminApi.deleteNotification(id);
            toast.success("Notification deleted successfully");
            fetchNotifications();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete notification");
        }
    };

    const handleViewDetails = async (notification: any) => {
        try {
            setIsEditMode(false);
            setIsUserDropdownOpen(false);
            setUserSearch("");
            setFilterType("all");
            setSelectedNotification(notification);
            setIsDetailsOpen(true);

            const fullDetails = await adminApi.getNotificationById(notification.id);
            setSelectedNotification(fullDetails);
        } catch (error) {
            console.error("Error fetching notification details:", error);
            toast.error("Failed to load full details");
        }
    };

    const handleEdit = () => {
        if (!selectedNotification) return;

        setEditFormData({
            title: selectedNotification.title,
            description: selectedNotification.description || "",
            scheduledAt: selectedNotification.scheduled_at ? new Date(selectedNotification.scheduled_at).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : "",
        });
        setEditTargetType(selectedNotification.target_type);

        if (selectedNotification.target_type === 'specific') {
            setEditSelectedUserIds(selectedNotification.targets?.map((t: any) => t.id) || []);
        } else {
            setEditSelectedUserIds([]);
        }

        setIsEditMode(true);
    };

    const handleUpdate = async () => {
        if (!selectedNotification || !editFormData.title || !editFormData.scheduledAt) {
            toast.error("Title and Scheduled Time are required");
            return;
        }

        try {
            const scheduledAtUTC = new Date(editFormData.scheduledAt).toISOString();
            await adminApi.updateNotification(selectedNotification.id, {
                ...editFormData,
                scheduledAt: scheduledAtUTC,
                targetType: editTargetType,
                targetUserIds: editTargetType === 'specific' ? editSelectedUserIds : undefined
            });
            toast.success("Notification updated successfully");
            setIsEditMode(false);
            fetchNotifications();

            const updated = await adminApi.getNotificationById(selectedNotification.id);
            setSelectedNotification(updated);
        } catch (error: any) {
            toast.error(error.message || "Failed to update notification");
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 md:h-6 md:w-6" />
                    Notifications
                </h2>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-primary dark:text-black hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            Add Notification
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Notification</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to schedule a new notification.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="title" className="text-sm font-medium">
                                    Title *
                                </label>
                                <Input
                                    id="title"
                                    placeholder="Notification Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </label>
                                <Textarea
                                    id="description"
                                    placeholder="Enter notification details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="scheduledAt" className="text-sm font-medium">
                                    Scheduled Time *
                                </label>
                                <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Target Audience *</label>
                                <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="all_customers">All Customers</SelectItem>
                                        <SelectItem value="all_restaurants">All Restaurants</SelectItem>
                                        <SelectItem value="all_delivery_partners">All Delivery Partners</SelectItem>
                                        <SelectItem value="specific">Specific Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {targetType === "specific" && (
                                <div className="grid gap-2 relative">
                                    <label className="text-sm font-medium">Select Users ({selectedUserIds.length} selected)</label>
                                    <div
                                        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    >
                                        <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
                                            {selectedUserIds.length === 0 ? "Select users..." :
                                                users.filter(u => selectedUserIds.includes(u.id)).slice(0, 3).map(u => (
                                                    <Badge key={u.id} variant="secondary" className="mr-1">{u.fullName}</Badge>
                                                ))
                                            }
                                            {selectedUserIds.length > 3 && <Badge variant="secondary">+{selectedUserIds.length - 3} more</Badge>}
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </div>

                                    {isUserDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover text-popover-foreground rounded-md border shadow-md">
                                            <div className="p-2 border-b">
                                                <div className="flex items-center px-3 border rounded-md">
                                                    <Search className="h-4 w-4 mr-2 opacity-50" />
                                                    <input
                                                        className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Search by name, email, or phone..."
                                                        value={userSearch}
                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                                                    <Badge
                                                        variant={filterType === 'all' ? "default" : "outline"}
                                                        className="cursor-pointer whitespace-nowrap"
                                                        onClick={() => setFilterType('all')}
                                                    >
                                                        All
                                                    </Badge>
                                                    <Badge
                                                        variant={filterType === 'customer' ? "default" : "outline"}
                                                        className="cursor-pointer whitespace-nowrap"
                                                        onClick={() => setFilterType('customer')}
                                                    >
                                                        Customers
                                                    </Badge>
                                                    <Badge
                                                        variant={filterType === 'restaurant' ? "default" : "outline"}
                                                        className="cursor-pointer whitespace-nowrap"
                                                        onClick={() => setFilterType('restaurant')}
                                                    >
                                                        Restaurants
                                                    </Badge>
                                                    <Badge
                                                        variant={filterType === 'delivery_partner' ? "default" : "outline"}
                                                        className="cursor-pointer whitespace-nowrap"
                                                        onClick={() => setFilterType('delivery_partner')}
                                                    >
                                                        Partners
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="max-h-[200px] overflow-auto p-1">
                                                {users.filter(u => {
                                                    const matchesSearch = u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                        u.phoneNumber?.includes(userSearch);
                                                    const matchesType = filterType === 'all' || u.userType === filterType;
                                                    return matchesSearch && matchesType;
                                                }).map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                        onClick={() => toggleUser(user.id)}
                                                    >
                                                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${selectedUserIds.includes(user.id) ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                                                            {selectedUserIds.includes(user.id) && <Check className="h-3 w-3" />}
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium">{user.fullName}</span>
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{user.userType?.replace('_', ' ')}</Badge>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {user.email && <span>{user.email}</span>}
                                                                {user.email && user.phoneNumber && <span> • </span>}
                                                                {user.phoneNumber && <span>{user.phoneNumber}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {users.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button onClick={handleCreate} disabled={isCreating || (targetType === 'specific' && selectedUserIds.length === 0)}>
                                {isCreating ? "Creating..." : "Create Notification"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>


                <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader className="px-6 border-b pb-4">
                            <SheetTitle>{isEditMode ? "Edit Notification" : "Notification Details"}</SheetTitle>
                            <SheetDescription>
                                {!isEditMode ? (
                                    selectedNotification?.target_type === 'specific'
                                        ? `${selectedNotification?.targets?.length || 0} users selected for this notification`
                                        : `All ${selectedNotification?.target_type?.replace('all_', '').replace('_', ' ')} will receive this notification`
                                ) : (
                                    "Modify the details and target audience of this notification."
                                )}
                            </SheetDescription>
                        </SheetHeader>


                        {selectedNotification && (
                            <>
                                <div className="px-6 py-4 border-b space-y-3">
                                    {!isEditMode ? (
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base mb-1">{selectedNotification.title}</h3>
                                                {selectedNotification.description && (
                                                    <p className="text-sm text-muted-foreground">{selectedNotification.description}</p>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleEdit} className="shrink-0">
                                                Edit
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Title *</label>
                                                <Input
                                                    value={editFormData.title}
                                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                                    placeholder="Notification Title"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Description</label>
                                                <Textarea
                                                    value={editFormData.description}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                    placeholder="Enter notification details..."
                                                    rows={3}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Scheduled Time *</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={editFormData.scheduledAt}
                                                    onChange={(e) => setEditFormData({ ...editFormData, scheduledAt: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Target Audience *</label>
                                                <Select value={editTargetType} onValueChange={(val: any) => setEditTargetType(val)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Users</SelectItem>
                                                        <SelectItem value="all_customers">All Customers</SelectItem>
                                                        <SelectItem value="all_restaurants">All Restaurants</SelectItem>
                                                        <SelectItem value="all_delivery_partners">All Delivery Partners</SelectItem>
                                                        <SelectItem value="specific">Specific Users</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {editTargetType === "specific" && (
                                                <div className="grid gap-2 relative">
                                                    <label className="text-sm font-medium">Select Users ({editSelectedUserIds.length} selected)</label>
                                                    <div
                                                        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-ring flex items-center justify-between"
                                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                                    >
                                                        <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
                                                            {editSelectedUserIds.length === 0 ? "Select users..." :
                                                                users.filter(u => editSelectedUserIds.includes(u.id)).slice(0, 3).map(u => (
                                                                    <Badge key={u.id} variant="secondary" className="mr-1 text-[10px]">{u.fullName}</Badge>
                                                                ))
                                                            }
                                                            {editSelectedUserIds.length > 3 && <Badge variant="secondary" className="text-[10px]">+{editSelectedUserIds.length - 3} more</Badge>}
                                                        </div>
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </div>

                                                    {isUserDropdownOpen && (
                                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[300px] flex flex-col">
                                                            <div className="p-2 border-b">
                                                                <div className="flex items-center px-3 border rounded-md">
                                                                    <Search className="h-4 w-4 mr-2 opacity-50" />
                                                                    <input
                                                                        className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                        placeholder="Search..."
                                                                        value={userSearch}
                                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                                                                    {['all', 'customer', 'restaurant', 'delivery_partner'].map((type) => (
                                                                        <Badge
                                                                            key={type}
                                                                            variant={filterType === type ? "default" : "outline"}
                                                                            className="cursor-pointer whitespace-nowrap capitalize text-[10px]"
                                                                            onClick={() => setFilterType(type as any)}
                                                                        >
                                                                            {type.replace('_', ' ')}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto flex-1 h-[200px]">
                                                                {users
                                                                    .filter(u => {
                                                                        const matchesSearch = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                                            u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                                            u.phoneNumber?.includes(userSearch);
                                                                        const matchesFilter = filterType === 'all' || u.userType === filterType;
                                                                        return matchesSearch && matchesFilter;
                                                                    })
                                                                    .map(user => (
                                                                        <div
                                                                            key={user.id}
                                                                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted"
                                                                            onClick={() => toggleEditUser(user.id)}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-medium">{user.fullName}</span>
                                                                                <span className="text-xs text-muted-foreground capitalize">{user.userType?.replace('_', ' ')}</span>
                                                                            </div>
                                                                            {editSelectedUserIds.includes(user.id) && <Check className="h-4 w-4 text-primary" />}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Button onClick={handleUpdate} className="flex-1">Save Changes</Button>
                                                <Button onClick={handleCancelEdit} variant="outline" className="flex-1">Cancel</Button>
                                            </div>
                                        </div>
                                    )}

                                    {!isEditMode && (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-muted-foreground mb-1">Scheduled For</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                                                    <span className="font-medium">{new Date(selectedNotification.scheduled_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground mb-1">Created By</p>
                                                <span className="font-medium capitalize">{selectedNotification.created_by_name || 'System'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold mb-2">
                                            Targeted Users ({selectedNotification.targets?.length || 0})
                                        </h4>
                                    </div>
                                    <div className="divide-y border rounded-lg">
                                        {selectedNotification.targets?.length > 0 ? (
                                            selectedNotification.targets.map((user: any) => (
                                                <div key={user.id} className="p-3 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm truncate">{user.fullName}</span>
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-2 capitalize shrink-0">
                                                                    {user.userType?.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                                {user.email && (
                                                                    <div className="truncate">{user.email}</div>
                                                                )}
                                                                {user.phoneNumber && (
                                                                    <div>{user.phoneNumber}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground text-sm">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Orders Notifications dropdown using Settings model */}
            <Card className="bg-card border shadow-sm">
                <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer"
                    onClick={() => setOrdersDropdownOpen((prev) => !prev)}
                >
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-base md:text-lg">Orders Notifications</CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Configure default title and description templates for order status notifications
                        </p>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${ordersDropdownOpen ? "rotate-180" : ""}`}
                    />
                </CardHeader>
                {ordersDropdownOpen && (
                    <CardContent className="space-y-4">
                        {orderNotificationSettings ? (
                            <>
                                {orderNotificationFields.map((field, idx) => (
                                    <div key={field.keyPrefix} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">{field.label}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Title
                                                </label>
                                                <Input
                                                    value={orderNotificationSettings[field.titleKey] || ""}
                                                    onChange={(e) =>
                                                        handleOrderNotificationChange(field.titleKey, e.target.value)
                                                    }
                                                    placeholder={`e.g. ${field.label}`}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Description
                                                </label>
                                                <Input
                                                    value={orderNotificationSettings[field.descriptionKey] || ""}
                                                    onChange={(e) =>
                                                        handleOrderNotificationChange(field.descriptionKey, e.target.value)
                                                    }
                                                    placeholder={`Your order is ${field.label.toLowerCase()}...`}
                                                />
                                            </div>
                                        </div>
                                        {idx !== orderNotificationFields.length - 1 && (
                                            <Separator className="mt-2" />
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end pt-2">
                                    <Button size="sm" onClick={handleSaveOrderNotifications}>
                                        Save Order Notification Templates
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">Loading order notification templates...</div>
                        )}
                    </CardContent>
                )}
            </Card>

            <div className="flex-1 overflow-auto bg-card rounded-xl border shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Bell className="h-12 w-12 opacity-20" />
                        <p>No notifications scheduled</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 hover:bg-muted/50 transition-colors flex items-start justify-between group cursor-pointer"
                                onClick={() => handleViewDetails(notification)}
                            >
                                <div className="space-y-1">
                                    <h3 className="font-semibold">{notification.title}</h3>
                                    {notification.description && (
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(notification.scheduled_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(notification.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {notification.created_by_name && (
                                            <span>Created by: {notification.created_by_name}</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
