import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Users,
  IndianRupee,
  Cog,
  Bell,
  Ticket,
  Store,
  Apple,
} from 'lucide-react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TopBar,
  Sidebar,
  Overview,
  Orders,
  Restaurants,
  DeliveryPartners,
  Customers,
  SurpriseBags,
  Coupons,
  Finance,
  Settings,
  Notifications,
  GroceryStores,
  GroceryItems,
} from '@/components/dashboard';

// const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai"];

export default function Dashboard() {
  const [active, setActive] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className='from-background to-muted/20 text-foreground flex h-screen flex-col bg-gradient-to-b'>
      {/* Top Bar */}
      <TopBar
        onLogoClick={() => setActive('overview')}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side='left' className='flex flex-col gap-2 p-4 md:hidden'>
          <div className='mb-4 flex items-center justify-between'>
            <div
              className='flex cursor-pointer items-center gap-2 text-lg font-semibold'
              onClick={() => {
                setActive('overview');
                setMobileSidebarOpen(false);
              }}
            >
              <LayoutDashboard className='h-5 w-5' />
              <span>Admin</span>
            </div>
          </div>

          <button
            onClick={() => {
              setActive('overview');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'overview' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <LayoutDashboard className='h-4 w-4' />
            Overview
          </button>
          <button
            onClick={() => {
              setActive('orders');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'orders' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <ShoppingBag className='h-4 w-4' />
            Orders
          </button>
          <button
            onClick={() => {
              setActive('restaurants');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'restaurants' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <UtensilsCrossed className='h-4 w-4' />
            Restaurants
          </button>
          <button
            onClick={() => {
              setActive('riders');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'riders' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <Bike className='h-4 w-4' />
            Delivery Partners
          </button>
          <button
            onClick={() => {
              setActive('bags');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'bags' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <ShoppingBag className='h-4 w-4' />
            Surprise Bags
          </button>
          <button
            onClick={() => {
              setActive('coupons');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'coupons' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <Ticket className='h-4 w-4' />
            Coupons
          </button>
          <button
            onClick={() => {
              setActive('customers');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'customers' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <Users className='h-4 w-4' />
            Customers
          </button>
          <button
            onClick={() => {
              setActive('finance');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'finance' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <IndianRupee className='h-4 w-4' />
            Finance
          </button>
          <button
            onClick={() => {
              setActive('grocery-stores');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active === 'grocery-stores' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          >
            <Store className='h-4 w-4' />
            Grossy Stores
          </button>
          <button
            onClick={() => {
              setActive('grocery-items');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active === 'grocery-items' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          >
            <Apple className='h-4 w-4' />
            Grossy Items
          </button>
          <button
            onClick={() => {
              setActive('notifications');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'notifications' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <Bell className='h-4 w-4' />
            Notifications
          </button>
          <button
            onClick={() => {
              setActive('settings');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active === 'settings' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
          >
            <Cog className='h-4 w-4' />
            Settings
          </button>
        </SheetContent>
      </Sheet>

      <div className='grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-0 md:grid-cols-[16rem_1fr]'>
        {/* Sidebar */}
        <Sidebar active={active} setActive={setActive} />

        {/* Main */}
        <main className='flex h-full flex-col p-4 lg:p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h1 className='text-2xl font-bold capitalize lg:text-3xl'>{active}</h1>
            <div className='flex items-center gap-2'>
              {/* <Select defaultValue="Today">
                <SelectTrigger className="w-40"><SelectValue placeholder="Date Range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="All Cities">
                <SelectTrigger className="w-40"><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Cities">All Cities</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select> */}
            </div>
          </div>

          <Tabs value={active} onValueChange={setActive} className='hidden'>
            <TabsList className='hidden'>
              <TabsTrigger value='overview' />
              <TabsTrigger value='orders' />
              <TabsTrigger value='restaurants' />
              <TabsTrigger value='riders' />
              <TabsTrigger value='bags' />
              <TabsTrigger value='coupons' />
              <TabsTrigger value='customers' />
              <TabsTrigger value='finance' />
              <TabsTrigger value='settings' />
              <TabsTrigger value='grocery-stores' />
              <TabsTrigger value='grocery-items' />
            </TabsList>
          </Tabs>

          {/* Views */}
          <div className='flex-1 overflow-auto'>
            {active === 'overview' && <Overview onNavigate={setActive} />}
            {active === 'orders' && <Orders />}
            {active === 'restaurants' && <Restaurants />}
            {active === 'riders' && <DeliveryPartners />}
            {active === 'bags' && <SurpriseBags />}
            {active === 'coupons' && <Coupons />}
            {active === 'customers' && <Customers />}
            {active === 'finance' && <Finance />}
            {active === 'notifications' && <Notifications />}
            {active === 'settings' && <Settings />}
            {active === 'grocery-stores' && <GroceryStores />}
            {active === 'grocery-items' && <GroceryItems />}
          </div>
        </main>
      </div>
    </div>
  );
}
