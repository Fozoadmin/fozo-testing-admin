import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Users,
  IndianRupee,
  Cog,
  Ticket,
} from "lucide-react";
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
} from "@/components/dashboard";

// const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai"];

export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-b from-background to-muted/20 text-foreground flex flex-col">
      {/* Top Bar */}
      <TopBar
        onLogoClick={() => setActive("overview")}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-4 flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-2 text-lg font-semibold cursor-pointer"
              onClick={() => {
                setActive("overview");
                setMobileSidebarOpen(false);
              }}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin</span>
            </div>
          </div>

          <button
            onClick={() => {
              setActive("overview");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "overview" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => {
              setActive("orders");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "orders" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => {
              setActive("restaurants");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "restaurants" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Restaurants
          </button>
          <button
            onClick={() => {
              setActive("riders");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "riders" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Bike className="h-4 w-4" />
            Delivery Partners
          </button>
          <button
            onClick={() => {
              setActive("bags");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "bags" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Surprise Bags
          </button>
          <button
            onClick={() => {
              setActive("coupons");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "coupons" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Ticket className="h-4 w-4" />
            Coupons
          </button>
          <button
            onClick={() => {
              setActive("customers");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "customers" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Users className="h-4 w-4" />
            Customers
          </button>
          <button
            onClick={() => {
              setActive("finance");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "finance" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <IndianRupee className="h-4 w-4" />
            Finance
          </button>
          <button
            onClick={() => {
              setActive("settings");
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              active === "settings" ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Cog className="h-4 w-4" />
            Settings
          </button>
        </SheetContent>
      </Sheet>

      <div className="max-w-[1400px] w-full grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-0 flex-1">
        {/* Sidebar */}
        <Sidebar active={active} setActive={setActive} />

        {/* Main */}
        <main className="p-4 lg:p-6 flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-bold capitalize">{active}</h1>
            <div className="flex items-center gap-2">
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

          <Tabs value={active} onValueChange={setActive} className="hidden">
            <TabsList className="hidden">
              <TabsTrigger value="overview" />
              <TabsTrigger value="orders" />
              <TabsTrigger value="restaurants" />
              <TabsTrigger value="riders" />
            <TabsTrigger value="bags" />
            <TabsTrigger value="coupons" />
            <TabsTrigger value="customers" />
            <TabsTrigger value="finance" />
            <TabsTrigger value="settings" />
            </TabsList>
          </Tabs>

          {/* Views */}
          <div className="flex-1 overflow-auto">
            {active === "overview" && <Overview onNavigate={setActive} />}
            {active === "orders" && <Orders />}
            {active === "restaurants" && <Restaurants />}
            {active === "riders" && <DeliveryPartners />}
            {active === "bags" && <SurpriseBags />}
            {active === "coupons" && <Coupons />}
            {active === "customers" && <Customers />}
            {active === "finance" && <Finance />}
            {active === "settings" && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}
