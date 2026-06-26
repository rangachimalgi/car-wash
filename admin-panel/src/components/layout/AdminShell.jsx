import React from 'react'
import NavIcon from './NavIcon'
import { buildNavStructure } from './navConfig'

export default function AdminShell({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  navOpen,
  setNavOpen,
  authToken,
  setAuthToken,
  inventoryNavBadge,
  children,
}) {
  const navStructure = buildNavStructure(inventoryNavBadge)

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ×
          </button>
          <div className="sidebar-brand">
            <span className="sidebar-logo">Woosh</span>
            <span className="sidebar-tagline">Admin Panel</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navStructure.map((node) => {
            if (node.type === 'item') {
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`nav-item ${activeTab === node.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(node.id)
                    setSidebarOpen(false)
                  }}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <NavIcon name={node.icon} />
                  </span>
                  <span className="nav-label">{node.label}</span>
                </button>
              )
            }

            const open = !!navOpen[node.id]
            return (
              <div key={node.id} className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-group-toggle ${open ? 'open' : ''}`}
                  onClick={() => setNavOpen((s) => ({ ...s, [node.id]: !s[node.id] }))}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <NavIcon name={node.icon} />
                  </span>
                  <span className="nav-label">{node.label}</span>
                  <span className="nav-chevron" aria-hidden="true">
                    <NavIcon name="chevronDown" />
                  </span>
                </button>
                <div className={`nav-group-items ${open ? 'open' : ''}`}>
                  {node.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`nav-item nav-subitem ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab(item.id)
                        setSidebarOpen(false)
                      }}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        <NavIcon name={item.icon} />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <details className="auth-details">
            <summary>Auth Token</summary>
            <div className="auth-token-fields">
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="JWT token"
              />
              <button type="button" className="auth-clear" onClick={() => setAuthToken('')}>
                Clear
              </button>
            </div>
          </details>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
        </header>
        <div className="container">{children}</div>
      </main>
    </>
  )
}
