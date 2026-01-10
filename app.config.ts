export default defineAppConfig({
  // App branding
  app: {
    name: 'KosMan',
    description: 'Kos Management System',
    version: '1.0.0'
  },

  // UI theme configuration
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'slate'
    },
    button: {
      defaultVariants: {
        color: 'primary'
      }
    }
  },

  // Navigation configuration
  navigation: {
    // Main sidebar navigation
    // sidebar: [
    //   {
    //     label: 'Properties',
    //     icon: 'i-heroicons-building-office',
    //     to: '/properties', 
    //   },
    //   {
    //     label: 'Tenants',
    //     icon: 'i-heroicons-users',
    //     to: '/tenants',
    //   },
    // ]
  }
})
