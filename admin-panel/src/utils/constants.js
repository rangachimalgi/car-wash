export const MAX_MEDIA_VIDEO_SIZE_MB = 25
export const MAX_MEDIA_IMAGE_SIZE_MB = 10
export const MAX_MEDIA_VIDEO_SIZE_BYTES = MAX_MEDIA_VIDEO_SIZE_MB * 1024 * 1024
export const MAX_MEDIA_IMAGE_SIZE_BYTES = MAX_MEDIA_IMAGE_SIZE_MB * 1024 * 1024

export const DEFAULT_PACKAGE_CARD = {
  name: '',
  description: '',
  image: '',
  panelImage: '',
  times: 2,
  price: '',
  addOnServiceIds: [],
  coverageIncluded: [],
  coverageNotIncluded: [],
}

export const PAGE_TITLES = {
  services: 'Services',
  addons: 'Add-Ons',
  coverage: 'Coverage',
  slots: 'Time Slots',
  dailyCleaningServices: 'Daily Cleaning Services',
  packages: 'Packages',
  coupons: 'Woosh Coins',
  orders: 'Orders',
  reviews: 'Reviews',
  media: 'Media (Testimonials & Transformations)',
  employees: 'Employees',
  attendance: 'Employee Attendance',
  employeeIncentives: 'Employee earnings (incentives)',
  inventory: 'Inventory',
  revenue: 'Revenue',
  activeWashes: 'Active washes',
  employeeAvailability: 'Employee availability',
  inventoryAlert: 'Inventory alert',
}
