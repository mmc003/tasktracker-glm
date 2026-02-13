// Feature flags configuration
// Toggle features on/off by changing these values

export type AppMode = 'business' | 'personal';

export const config = {
  mode: 'personal' as AppMode, // 'business' for team use, 'personal' for single user
} as const;

// Derived features based on mode
export const features = {
  get assignees() {
    return config.mode === 'business';
  },
} as const;
