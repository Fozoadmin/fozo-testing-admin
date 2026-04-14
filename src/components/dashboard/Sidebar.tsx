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

type SidebarProps = {
  active: string;
  setActive: (key: string) => void;
};

export function Sidebar({ active, setActive }: SidebarProps) {
  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { key: 'riders', label: 'Delivery Partners', icon: Bike },
    { key: 'bags', label: 'Surprise Bags', icon: ShoppingBag },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'finance', label: 'Finance', icon: IndianRupee },
    { key: 'grocery-stores', label: 'Grossy Stores', icon: Store },
    { key: 'grocery-items', label: 'Grossy Items', icon: Apple },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'settings', label: 'Settings', icon: Cog },
  ];

  return (
    <div className='bg-background/60 hidden w-64 gap-1 border-r p-3 md:flex md:flex-col'>
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            active === key ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
          }`}
        >
          <Icon className='h-4 w-4' />
          {label}
        </button>
      ))}
    </div>
  );
}
