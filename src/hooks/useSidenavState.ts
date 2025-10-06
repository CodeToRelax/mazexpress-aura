import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidenav-collapsed';
const EXPANDED_GROUPS_KEY = 'sidenav-expanded-groups';

export function useSidenavState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(EXPANDED_GROUPS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify([...expandedGroups]));
  }, [expandedGroups]);

  const toggleCollapsed = () => setIsCollapsed(prev => !prev);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return {
    isCollapsed,
    toggleCollapsed,
    expandedGroups,
    toggleGroup,
  };
}
