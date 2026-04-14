import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type TopBarProps = {
  onLogoClick?: () => void;
  onMenuClick?: () => void;
};

export function TopBar({ onLogoClick, onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='bg-background/60 flex h-16 items-center justify-between border-b px-4 backdrop-blur lg:px-6'>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={onMenuClick}
        >
          <Menu className='h-5 w-5' />
          <span className='sr-only'>Open menu</span>
        </Button>
        <button
          type='button'
          onClick={onLogoClick}
          className='flex items-center gap-2 text-xl font-semibold transition-opacity hover:opacity-80'
        >
          <span>Fozo Admin</span>
        </button>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={handleLogout}
          className='hidden gap-2 sm:inline-flex'
        >
          <LogOut className='h-4 w-4' />
          Logout
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          onClick={handleLogout}
          className='sm:hidden'
        >
          <LogOut className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
