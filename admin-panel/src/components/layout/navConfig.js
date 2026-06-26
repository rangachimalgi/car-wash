export function buildNavStructure(inventoryNavBadge) {
  return [
    {
      type: 'group',
      id: 'revenueAnalytics',
      label: 'Revenue & Analytic Dashboard',
      icon: 'cash',
      items: [
        { id: 'revenue', label: 'Revenue', icon: 'cash' },
        { id: 'activeWashes', label: 'Active washes', icon: 'orders' },
        { id: 'employeeAvailability', label: 'Employee availability', icon: 'employees' },
        { id: 'inventoryAlert', label: 'Inventory alert', icon: 'inventory' },
      ],
    },
    {
      type: 'group',
      id: 'customerManagement',
      label: 'Customer Management',
      icon: 'customer',
      items: [],
    },
    {
      type: 'group',
      id: 'customer',
      label: 'Backend app',
      icon: 'customer',
      items: [
        { id: 'services', label: 'Services', icon: 'services' },
        { id: 'addons', label: 'Add ons', icon: 'addons' },
        { id: 'coverage', label: 'Coverage', icon: 'coverage' },
        { id: 'slots', label: 'Time slots', icon: 'slots' },
        { id: 'dailyCleaningServices', label: 'Daily Cleaning Services', icon: 'packages' },
        { id: 'packages', label: 'Packages', icon: 'packages' },
        { id: 'coupons', label: 'Woosh Coins', icon: 'coverage' },
      ],
    },
    {
      type: 'group',
      id: 'orderManagement',
      label: 'Order management',
      icon: 'orders',
      items: [{ id: 'orders', label: 'Orders', icon: 'orders' }],
    },
    { type: 'item', id: 'reviews', label: 'Reviews', icon: 'reviews' },
    { type: 'item', id: 'media', label: 'Media', icon: 'media' },
    {
      type: 'group',
      id: 'employees',
      label: 'Employee management',
      icon: 'employeesGroup',
      items: [
        { id: 'employees', label: 'Employee', icon: 'employees' },
        { id: 'attendance', label: 'Attendance', icon: 'attendance' },
        { id: 'employeeIncentives', label: 'Earnings targets', icon: 'cash' },
      ],
    },
    {
      type: 'group',
      id: 'inventoryManagement',
      label: 'Inventory management',
      icon: 'inventory',
      items: [{ id: 'inventory', label: 'Inventory', icon: 'inventory', badge: inventoryNavBadge }],
    },
  ]
}
