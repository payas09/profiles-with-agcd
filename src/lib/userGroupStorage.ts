import type { UserGroup } from './userGroupTypes';
import { MOCK_USER_GROUPS } from './userGroupMockData';

const STORAGE_KEY = 'user-groups';

export function getUserGroups(): UserGroup[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const groups = JSON.parse(stored) as UserGroup[];
      // Migrate groups without a type field (default to 'dynamic' for backward compatibility)
      let needsUpdate = false;
      const migratedGroups = groups.map(group => {
        if (!group.type) {
          needsUpdate = true;
          return { ...group, type: 'dynamic' as const };
        }
        return group;
      });
      if (needsUpdate) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedGroups));
      }
      return migratedGroups;
    }
    // Initialize with mock data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER_GROUPS));
    return MOCK_USER_GROUPS;
  } catch {
    return MOCK_USER_GROUPS;
  }
}

export function saveUserGroup(group: UserGroup): void {
  const groups = getUserGroups();
  const existingIndex = groups.findIndex(g => g.id === group.id);

  if (existingIndex >= 0) {
    groups[existingIndex] = group;
  } else {
    groups.push(group);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function deleteUserGroup(id: string): void {
  const groups = getUserGroups();
  const filtered = groups.filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getUserGroupById(id: string): UserGroup | undefined {
  const groups = getUserGroups();
  return groups.find(g => g.id === id);
}
