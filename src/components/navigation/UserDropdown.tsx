import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { logout } from '@/screens/auth/auth.slice';
import { clearACL } from '@/utilities/redux/acl.slice';
import { signOut } from '@/utilities/firebase/authHelpers';
import { appConfig } from '@/app.config';
import { useACL } from '@/hooks/useACL';

export function UserDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { acl, hasFlag, isSuperAdmin } = useACL();

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast.error(t(error));
    } else {
      dispatch(logout());
      dispatch(clearACL());
      toast.success(t('status.success'));
      navigate(appConfig.auth.redirectAfterLogout);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Admin';
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const userType = isSuperAdmin ? t('acl.superAdmin') : t('users.table.role.admin');
  const adminCountry = acl?.adminCountry;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-zinc-900 border shadow-lg">
        {/* User info header */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {userType}
            </Badge>
            {adminCountry && (
              <Badge variant="outline" className="text-xs capitalize">
                {adminCountry}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu items */}
        <DropdownMenuItem 
          onClick={() => navigate('/profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          {t('profile.myAccount')}
        </DropdownMenuItem>

        {hasFlag('canManageConfig') && (
          <DropdownMenuItem 
            onClick={() => navigate('/settings')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('nav.settings')}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('actions.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
