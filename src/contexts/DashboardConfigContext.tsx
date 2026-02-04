import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardConfig, WidgetConfig, DEFAULT_WIDGETS } from '@/types/dashboard';

const STORAGE_KEY = 'humanlabel_dashboard_config';

interface DashboardConfigContextType {
  config: DashboardConfig;
  enabledWidgets: WidgetConfig[];
  saveConfig: (newConfig: DashboardConfig) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  toggleWidget: (widgetId: string) => void;
  resetToDefaults: () => void;
}

const DashboardConfigContext = createContext<DashboardConfigContextType | undefined>(undefined);

export function DashboardConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Load from localStorage or use defaults
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all widgets exist
        const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
          const storedWidget = parsed.widgets?.find((w: WidgetConfig) => w.id === defaultWidget.id);
          return storedWidget || defaultWidget;
        });
        return { widgets: mergedWidgets };
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error);
    }
    return { widgets: DEFAULT_WIDGETS };
  });

  // Listen for storage changes (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
            const storedWidget = parsed.widgets?.find((w: WidgetConfig) => w.id === defaultWidget.id);
            return storedWidget || defaultWidget;
          });
          setConfig({ widgets: mergedWidgets });
        } catch (error) {
          console.error('Error syncing dashboard config:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveConfig = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving dashboard config:', error);
    }
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    const newConfig = {
      ...config,
      widgets: config.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
    };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  const toggleWidget = useCallback((widgetId: string) => {
    const widget = config.widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget(widgetId, { enabled: !widget.enabled });
    }
  }, [config, updateWidget]);

  const resetToDefaults = useCallback(() => {
    saveConfig({ widgets: DEFAULT_WIDGETS });
  }, [saveConfig]);

  return (
    <DashboardConfigContext.Provider
      value={{
        config,
        enabledWidgets: config.widgets.filter(w => w.enabled),
        saveConfig,
        updateWidget,
        toggleWidget,
        resetToDefaults,
      }}
    >
      {children}
    </DashboardConfigContext.Provider>
  );
}

export function useDashboardConfig() {
  const context = useContext(DashboardConfigContext);
  if (context === undefined) {
    throw new Error('useDashboardConfig must be used within a DashboardConfigProvider');
  }
  return context;
}

