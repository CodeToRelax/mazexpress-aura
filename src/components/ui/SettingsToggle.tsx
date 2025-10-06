import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { useACL } from '@/hooks/useACL';

export function SettingsToggle() {
  const navigate = useNavigate();
  const { hasFlag } = useACL();
  
  // Only show if user can manage config
  if (!hasFlag('canManageConfig')) {
    return null;
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/settings')}
      className="glass-card hover:shadow-glass-hover transition-all"
    >
      <Settings className="h-5 w-5" />
      <span className="sr-only">System Settings</span>
    </Button>
  );
}
