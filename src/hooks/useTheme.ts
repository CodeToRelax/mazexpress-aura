import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { setTheme, toggleTheme } from '@/utilities/redux/ui.slice';

/**
 * Hook for theme management
 */
export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  
  const changeTheme = (newTheme: 'light' | 'dark') => {
    dispatch(setTheme(newTheme));
  };
  
  const toggle = () => {
    dispatch(toggleTheme());
  };
  
  return {
    theme,
    setTheme: changeTheme,
    toggleTheme: toggle,
    isDark: theme === 'dark',
  };
}
