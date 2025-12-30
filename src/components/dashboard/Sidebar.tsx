import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Users,
  IndianRupee,
  Cog,
} from "lucide-react";

type SidebarProps = { 
  active: string; 
  setActive: (key: string) => void 
};

export function Sidebar({ active, setActive }: SidebarProps) {
  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { key: "riders", label: "Delivery Partners", icon: Bike },
    { key: "bags", label: "Surprise Bags", icon: ShoppingBag },
    { key: "customers", label: "Customers", icon: Users },
    { key: "finance", label: "Finance", icon: IndianRupee },
    { key: "settings", label: "Settings", icon: Cog },
  ];
  
  return (
    <div className="w-64 border-r hidden md:flex md:flex-col p-3 gap-1 bg-background/60">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
            active === key ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

