/**
 * Static Portfolio Generator Plugin for TeamIDE
 *
 * Entry point - exports ModuleDefinition
 */

import { defineComponent, h } from 'vue';
import PluginNav from './PluginNav.vue';
import PluginContext from './PluginContext.vue';

// Define ModuleDefinition interface locally (to avoid external imports)
interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  version: string;
  order?: number;
  navigationComponent?: ReturnType<typeof defineComponent> | any;
  mainComponent?: ReturnType<typeof defineComponent> | any;
  contextComponent?: ReturnType<typeof defineComponent> | any;
  requiresRepository?: boolean;
  onRegister?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

const plugin: ModuleDefinition = {
  id: 'spg',
  name: 'Portfolio Generator',
  icon: 'web',
  version: '1.0.0',
  order: 100, // Show after built-in modules

  // Minimal nav component - just shows status and settings
  navigationComponent: PluginNav,

  // No main component - we use TeamIDE's code editor
  // mainComponent: undefined,

  // Rich context component - Site Structure, Commit Curation, Quick Actions
  contextComponent: PluginContext,

  // Plugin works with any repo (user selects in settings)
  requiresRepository: false,

  onRegister: () => {
    console.log('[SPG Plugin] Registered');
  },

  onActivate: () => {
    console.log('[SPG Plugin] Activated');
  },

  onDeactivate: () => {
    console.log('[SPG Plugin] Deactivated');
  }
};

export default plugin;
