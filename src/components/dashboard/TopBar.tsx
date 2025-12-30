import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type TopBarProps = {
  onLogoClick?: () => void;
  onMenuClick?: () => void;
};

export function TopBar({ onLogoClick, onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-16 flex items-center justify-between border-b px-4 lg:px-6 bg-background/60 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity"
        >
          <span>Fozo Admin</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          className="gap-2 hidden sm:inline-flex"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleLogout}
          className="sm:hidden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

