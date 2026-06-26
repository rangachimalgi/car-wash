import React from 'react'
import { AdminPanelProvider } from '../context/AdminPanelContext'
import { useAdminPanel } from '../hooks/useAdminPanel'
import RevenueTab from './tabs/RevenueTab'
import ServicesTab from './tabs/ServicesTab'
import DailyCleaningServicesTab from './tabs/DailyCleaningServicesTab'
import PackagesTab from './tabs/PackagesTab'
import CouponsTab from './tabs/CouponsTab'
import AddonsTab from './tabs/AddonsTab'
import CoverageTab from './tabs/CoverageTab'
import SlotsTab from './tabs/SlotsTab'
import ReviewsTab from './tabs/ReviewsTab'
import MediaTab from './tabs/MediaTab'
import ActiveWashesTab from './tabs/ActiveWashesTab'
import OrdersTab from './tabs/OrdersTab'
import EmployeesTab from './tabs/EmployeesTab'
import AttendanceTab from './tabs/AttendanceTab'
import EmployeeIncentivesTab from './tabs/EmployeeIncentivesTab'
import InventoryTab from './tabs/InventoryTab'
import PlaceholderTab from './tabs/PlaceholderTab'

const TAB_COMPONENTS = {
  revenue: RevenueTab,
  services: ServicesTab,
  dailyCleaningServices: DailyCleaningServicesTab,
  packages: PackagesTab,
  coupons: CouponsTab,
  addons: AddonsTab,
  coverage: CoverageTab,
  slots: SlotsTab,
  reviews: ReviewsTab,
  media: MediaTab,
  activeWashes: ActiveWashesTab,
  orders: OrdersTab,
  employees: EmployeesTab,
  attendance: AttendanceTab,
  employeeIncentives: EmployeeIncentivesTab,
  inventory: InventoryTab,
  employeeAvailability: PlaceholderTab,
  inventoryAlert: PlaceholderTab,
}

export default function AdminRouter({ activeTab, getFetchOptions }) {
  const admin = useAdminPanel({ getFetchOptions, activeTab })
  const Tab = TAB_COMPONENTS[activeTab] || PlaceholderTab

  return (
    <AdminPanelProvider value={admin}>
      <Tab activeTab={activeTab} />
    </AdminPanelProvider>
  )
}
