import React, { useState } from 'react'
import './App.css'
import AdminShell from './components/layout/AdminShell'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuthToken } from './hooks/useAuthToken'
import { useNavBadges } from './hooks/useNavBadges'
import AdminRouter from './pages/AdminRouter'

export default function App() {
  const [activeTab, setActiveTab] = useState('services')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOpen, setNavOpen] = useState({
    revenueAnalytics: false,
    customerManagement: false,
    customer: true,
    orderManagement: true,
    employees: true,
    inventoryManagement: true,
  })

  const { authToken, setAuthToken, getFetchOptions } = useAuthToken()
  const { inventoryNavBadge } = useNavBadges()

  return (
    <div className="app">
      <AdminShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        authToken={authToken}
        setAuthToken={setAuthToken}
        inventoryNavBadge={inventoryNavBadge}
      >
        <ErrorBoundary>
          <AdminRouter activeTab={activeTab} getFetchOptions={getFetchOptions} />
        </ErrorBoundary>
      </AdminShell>
    </div>
  )
}
