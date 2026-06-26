import { createContext, useContext } from 'react'

export const AdminPanelContext = createContext(null)

export function useAdminPanelContext() {
  const ctx = useContext(AdminPanelContext)
  if (!ctx) {
    throw new Error('useAdminPanelContext must be used within AdminPanelProvider')
  }
  return ctx
}

export function AdminPanelProvider({ value, children }) {
  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  )
}
