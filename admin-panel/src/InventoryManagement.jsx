import React, { useMemo, useState, useEffect } from 'react'
import './InventoryManagement.css'

const CATEGORY_COLORS = {
  Soap: 'cleaning',
  Towels: 'accessories',
  Polish: 'polish',
  Equipment: 'equipment',
  Other: 'other',
}

const INVENTORY_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'lowStock', label: 'Low Stock' },
  { id: 'outOfStock', label: 'Out of Stock' },
  { id: 'expiringSoon', label: 'Expiring Soon' },
]

function formatSku(item) {
  return `SKU-${String(item._id).slice(-6).toUpperCase()}`
}

function getStockStatus(item) {
  if (item.currentStock === 0) return { key: 'out', label: 'Out of Stock' }
  if (item.isLowStock) return { key: 'low', label: 'Low Stock' }
  return { key: 'in', label: 'In Stock' }
}

function relativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function exportInventoryCsv(items) {
  const headers = ['Item Name', 'Category', 'SKU', 'Current Stock', 'Unit', 'Min Stock', 'Status']
  const rows = items.map((item) => {
    const status = getStockStatus(item)
    return [
      item.name,
      item.category,
      formatSku(item),
      item.currentStock,
      item.unit,
      item.lowStockThreshold,
      status.label,
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon, label, value, sub, variant }) {
  return (
    <div className={`im-stat-card im-stat-${variant}`}>
      <div className="im-stat-icon">{icon}</div>
      <div className="im-stat-body">
        <span className="im-stat-label">{label}</span>
        <span className="im-stat-value">{value}</span>
        {sub ? <span className="im-stat-sub">{sub}</span> : null}
      </div>
    </div>
  )
}

function DonutChart({ data, totalLabel }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  let offset = 0
  const segments = data.map((d, i) => {
    const pct = d.value / total
    const dash = `${pct * 100} ${100 - pct * 100}`
    const seg = { ...d, dash, offset, pct }
    offset += pct * 100
    return seg
  })

  return (
    <div className="im-chart-donut-wrap">
      <svg viewBox="0 0 42 42" className="im-chart-donut">
        <circle className="im-donut-bg" cx="21" cy="21" r="15.9" />
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            className={`im-donut-seg im-donut-c${i}`}
            cx="21"
            cy="21"
            r="15.9"
            strokeDasharray={seg.dash}
            strokeDashoffset={25 - seg.offset}
          />
        ))}
      </svg>
      <div className="im-donut-center">
        <span className="im-donut-total">{totalLabel}</span>
        <span className="im-donut-label">Total units</span>
      </div>
      <div className="im-donut-legend">
        {segments.map((seg) => (
          <div key={seg.label} className="im-legend-row">
            <span className="im-legend-dot" style={{ background: seg.color }} />
            <span>{seg.label}</span>
            <span className="im-legend-pct">{Math.round(seg.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemFormModal({
  editingInventoryId,
  inventoryFormData,
  inventoryMessage,
  loadingInventory,
  onClose,
  onChange,
  onSubmit,
}) {
  return (
    <div className="im-modal-overlay" onClick={onClose}>
      <div className="im-modal" onClick={(e) => e.stopPropagation()}>
        <div className="im-modal-header">
          <h2>{editingInventoryId ? 'Edit Inventory Item' : 'Add New Item'}</h2>
          <button type="button" className="im-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit} className="im-form">
          <label className="im-form-field">
            <span>Item Name *</span>
            <input type="text" name="name" value={inventoryFormData.name} onChange={onChange} required placeholder="e.g., Car Shampoo (5L)" />
          </label>
          <div className="im-form-row">
            <label className="im-form-field">
              <span>Category *</span>
              <select name="category" value={inventoryFormData.category} onChange={onChange} required>
                <option value="Soap">Soap</option>
                <option value="Towels">Towels</option>
                <option value="Polish">Polish</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="im-form-field">
              <span>Unit *</span>
              <input type="text" name="unit" value={inventoryFormData.unit} onChange={onChange} required placeholder="Pcs, Liters..." />
            </label>
          </div>
          <div className="im-form-row">
            <label className="im-form-field">
              <span>Current Stock *</span>
              <input type="number" name="currentStock" value={inventoryFormData.currentStock} onChange={onChange} required min="0" step="0.01" />
            </label>
            <label className="im-form-field">
              <span>Max Capacity *</span>
              <input type="number" name="maxCapacity" value={inventoryFormData.maxCapacity} onChange={onChange} required min="0.01" step="0.01" />
            </label>
          </div>
          <label className="im-form-field">
            <span>Low Stock Threshold *</span>
            <input type="number" name="lowStockThreshold" value={inventoryFormData.lowStockThreshold} onChange={onChange} required min="0" step="0.01" />
          </label>
          <label className="im-form-field">
            <span>Supplier</span>
            <input type="text" name="supplier" value={inventoryFormData.supplier} onChange={onChange} placeholder="Supplier name" />
          </label>
          <label className="im-form-field">
            <span>Description</span>
            <textarea name="description" value={inventoryFormData.description} onChange={onChange} rows={3} placeholder="Additional notes" />
          </label>
          {inventoryMessage.text ? (
            <div className={`im-form-message ${inventoryMessage.type}`}>{inventoryMessage.text}</div>
          ) : null}
          <div className="im-form-actions">
            <button type="button" className="im-btn im-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="im-btn im-btn-primary" disabled={loadingInventory}>
              {loadingInventory ? 'Saving…' : editingInventoryId ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockModal({ modal, loadingInventory, onChange, onSubmit, onClose }) {
  if (!modal.open) return null
  return (
    <div className="im-modal-overlay" onClick={onClose}>
      <div className="im-modal im-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="im-modal-header">
          <h2>{modal.operation === 'add' ? 'Add Stock' : 'Remove Stock'}</h2>
          <button type="button" className="im-modal-close" onClick={onClose}>×</button>
        </div>
        <p className="im-modal-meta"><strong>Item:</strong> {modal.item?.name}</p>
        <p className="im-modal-meta"><strong>Current:</strong> {modal.item?.currentStock} {modal.item?.unit}</p>
        <label className="im-form-field">
          <span>Quantity *</span>
          <input
            type="number"
            value={modal.quantity}
            onChange={(e) => onChange({ ...modal, quantity: e.target.value })}
            min="0.01"
            step="0.01"
            required
            placeholder="Enter quantity"
          />
        </label>
        <div className="im-form-actions">
          <button type="button" className="im-btn im-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="im-btn im-btn-primary" onClick={onSubmit} disabled={loadingInventory || !modal.quantity}>
            {loadingInventory ? 'Updating…' : modal.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryManagement({
  inventory,
  loadingInventory,
  refillRequests,
  loadingRefillRequests,
  pendingRefillCount,
  inventoryFormData,
  editingInventoryId,
  inventoryMessage,
  stockUpdateModal,
  employees,
  onInventoryFormChange,
  onInventorySubmit,
  onNewInventory,
  onEditInventory,
  onDeleteInventory,
  onStockUpdate,
  onStockModalChange,
  onReviewRefillRequest,
  onFormClose,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    if (inventoryMessage.type === 'success') {
      setShowItemForm(false)
    }
  }, [inventoryMessage.type, inventoryMessage.text])

  const stats = useMemo(() => {
    const lowStock = inventory.filter((i) => i.isLowStock && i.currentStock > 0)
    const outOfStock = inventory.filter((i) => i.currentStock === 0)
    const stockInHand = inventory.reduce((sum, i) => sum + Number(i.currentStock || 0), 0)
    return {
      totalItems: inventory.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      stockInHand: Math.round(stockInHand),
      pendingRequests: pendingRefillCount,
    }
  }, [inventory, pendingRefillCount])

  const tabCounts = useMemo(() => ({
    all: inventory.length,
    lowStock: inventory.filter((i) => i.isLowStock && i.currentStock > 0).length,
    outOfStock: inventory.filter((i) => i.currentStock === 0).length,
    expiringSoon: 0,
  }), [inventory])

  const filteredItems = useMemo(() => {
    let list = [...inventory]

    if (activeTab === 'lowStock') {
      list = list.filter((i) => i.isLowStock && i.currentStock > 0)
    } else if (activeTab === 'outOfStock') {
      list = list.filter((i) => i.currentStock === 0)
    } else if (activeTab === 'expiringSoon') {
      list = []
    }

    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter)
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((item) => {
        const haystack = [item.name, item.category, formatSku(item), item.supplier].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }

    return list
  }, [inventory, activeTab, categoryFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage)

  const lowStockItems = useMemo(
    () => inventory.filter((i) => i.isLowStock && i.currentStock > 0).slice(0, 6),
    [inventory]
  )
  const outOfStockItems = useMemo(
    () => inventory.filter((i) => i.currentStock === 0).slice(0, 6),
    [inventory]
  )
  const pendingRequests = useMemo(
    () => refillRequests.filter((r) => r.status === 'pending').slice(0, 5),
    [refillRequests]
  )

  const getEmployeeName = (employeeId) => {
    const match = employees.find((e) => e.employeeId === employeeId)
    return match?.name || employeeId || 'Employee'
  }

  const categoryChartData = useMemo(() => {
    const colors = ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#6b7280']
    const totals = {}
    inventory.forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + Number(item.currentStock || 0)
    })
    return Object.entries(totals).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }))
  }, [inventory])

  const topItems = useMemo(() => {
    return [...inventory]
      .sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
      .slice(0, 5)
  }, [inventory])

  const recentActivity = useMemo(() => {
    const events = []
    refillRequests.slice(0, 8).forEach((req) => {
      events.push({
        id: req._id,
        time: req.createdAt,
        label: req.status === 'pending'
          ? `Refill requested — ${req.itemName || 'Item'}`
          : `Request ${req.status} — ${req.itemName || 'Item'}`,
        type: req.status === 'pending' ? 'warning' : req.status === 'fulfilled' ? 'success' : 'info',
      })
    })
    inventory
      .filter((i) => i.lastRestocked)
      .sort((a, b) => new Date(b.lastRestocked) - new Date(a.lastRestocked))
      .slice(0, 4)
      .forEach((item) => {
        events.push({
          id: `restock-${item._id}`,
          time: item.lastRestocked,
          label: `Stock added — ${item.name}`,
          type: 'success',
        })
      })
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6)
  }, [refillRequests, inventory])

  const openCreateForm = () => {
    onNewInventory()
    setShowItemForm(true)
  }

  const openEditForm = (itemId) => {
    onEditInventory(itemId)
    setShowItemForm(true)
  }

  const closeForm = () => {
    setShowItemForm(false)
    onFormClose?.()
  }

  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0

  return (
    <div className="im-page">
      <header className="im-header">
        <div>
          <h1 className="im-title">Inventory Management</h1>
          <p className="im-subtitle">Track, manage and control all inventory &amp; consumable items.</p>
        </div>
        <div className="im-header-actions">
          <select className="im-select im-location-select" defaultValue="all" disabled title="Coming soon">
            <option value="all">All Locations</option>
          </select>
          <button type="button" className="im-date-btn" disabled title="Coming soon">
            <span className="im-icon-calendar" />
            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
          <button type="button" className="im-btn im-btn-ghost" onClick={() => exportInventoryCsv(filteredItems)}>
            <span className="im-icon-export" />
            Export Report
          </button>
          <button type="button" className="im-btn im-btn-primary" onClick={openCreateForm}>
            + Add New Item
          </button>
        </div>
      </header>

      <div className="im-stats-grid">
        <StatCard icon="📦" label="Total Items" value={stats.totalItems.toLocaleString()} sub="All inventory items" variant="total" />
        <StatCard icon="📊" label="Categories" value={new Set(inventory.map((i) => i.category)).size} sub="Active categories" variant="value" />
        <StatCard icon="⚠️" label="Low Stock Items" value={stats.lowStock.toLocaleString()} sub="Reorder required" variant="low" />
        <StatCard icon="✕" label="Out of Stock" value={stats.outOfStock.toLocaleString()} sub="Needs restock" variant="out" />
        <StatCard icon="📥" label="Stock in Hand" value={stats.stockInHand.toLocaleString()} sub="Total quantity" variant="hand" />
        <StatCard icon="📋" label="Pending Requests" value={stats.pendingRequests.toLocaleString()} sub="Awaiting approval" variant="pending" />
      </div>

      <div className="im-body">
        <div className="im-main">
          <nav className="im-tabs">
            {INVENTORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => { setActiveTab(tab.id); setPage(1) }}
              >
                {tab.label}
                <span className="im-tab-count">({tabCounts[tab.id] ?? 0})</span>
              </button>
            ))}
          </nav>

          <div className="im-toolbar">
            <div className="im-search">
              <span className="im-icon-search" />
              <input
                type="search"
                placeholder="Search items by name or SKU..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              />
            </div>
            <button
              type="button"
              className={`im-btn im-btn-ghost ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filter
              {activeFilterCount > 0 ? <span className="im-filter-badge">{activeFilterCount}</span> : null}
            </button>
            <button type="button" className="im-btn im-btn-ghost" onClick={() => exportInventoryCsv(filteredItems)}>
              Export
            </button>
          </div>

          {showFilters ? (
            <div className="im-filters-panel">
              <label className="im-filter-field">
                <span>Category</span>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
                  <option value="all">All Categories</option>
                  <option value="Soap">Soap</option>
                  <option value="Towels">Towels</option>
                  <option value="Polish">Polish</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <button type="button" className="im-btn im-btn-ghost" onClick={() => { setCategoryFilter('all'); setPage(1) }}>
                Clear
              </button>
            </div>
          ) : null}

          <div className="im-table-wrap">
            {loadingInventory ? (
              <div className="im-empty">Loading inventory…</div>
            ) : pagedItems.length === 0 ? (
              <div className="im-empty">No inventory items match your filters.</div>
            ) : (
              <table className="im-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Unit</th>
                    <th>Min. Stock Level</th>
                    <th>Max Capacity</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
                    const status = getStockStatus(item)
                    const catClass = CATEGORY_COLORS[item.category] || 'other'
                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="im-item-cell">
                            <span className="im-item-thumb">{item.name?.[0]?.toUpperCase() || '?'}</span>
                            <div>
                              <strong>{item.name}</strong>
                              {item.supplier ? <span>{item.supplier}</span> : null}
                            </div>
                          </div>
                        </td>
                        <td><span className={`im-cat-pill im-cat-${catClass}`}>{item.category}</span></td>
                        <td className="im-sku">{formatSku(item)}</td>
                        <td className={status.key !== 'in' ? `im-stock-${status.key}` : ''}>
                          {item.currentStock} {item.unit}
                        </td>
                        <td>{item.unit}</td>
                        <td>{item.lowStockThreshold}</td>
                        <td>{item.maxCapacity ?? '—'}</td>
                        <td><span className={`im-status-pill im-status-${status.key}`}>{status.label}</span></td>
                        <td className="im-actions-cell">
                          <div className="im-action-menu-wrap">
                            <button
                              type="button"
                              className="im-kebab"
                              onClick={() => setOpenActionMenu(openActionMenu === item._id ? null : item._id)}
                            >
                              ⋮
                            </button>
                            {openActionMenu === item._id ? (
                              <div className="im-action-menu">
                                <button type="button" onClick={() => { openEditForm(item._id); setOpenActionMenu(null) }}>Edit</button>
                                <button type="button" onClick={() => { onStockModalChange({ open: true, item, quantity: '', operation: 'add' }); setOpenActionMenu(null) }}>Add stock</button>
                                <button type="button" onClick={() => { onStockModalChange({ open: true, item, quantity: '', operation: 'remove' }); setOpenActionMenu(null) }}>Remove stock</button>
                                <button type="button" className="danger" onClick={() => { onDeleteInventory(item._id); setOpenActionMenu(null) }}>Delete</button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="im-pagination">
            <span>
              Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * perPage + 1} to{' '}
              {Math.min(currentPage * perPage, filteredItems.length)} of {filteredItems.length} items
            </span>
            <div className="im-pagination-controls">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={currentPage === n ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        <aside className="im-sidebar">
          <div className="im-sidebar-card">
            <div className="im-alert-columns">
              <div>
                <h4>Low Stock <span className="im-count warn">{stats.lowStock}</span></h4>
                <ul className="im-alert-list">
                  {lowStockItems.length === 0 ? (
                    <li className="im-alert-empty">No low stock items</li>
                  ) : lowStockItems.map((item) => (
                    <li key={item._id}>
                      <span>{item.name}</span>
                      <span className="im-alert-qty">{item.currentStock}/{item.maxCapacity || item.lowStockThreshold}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Out of Stock <span className="im-count danger">{stats.outOfStock}</span></h4>
                <ul className="im-alert-list">
                  {outOfStockItems.length === 0 ? (
                    <li className="im-alert-empty">None</li>
                  ) : outOfStockItems.map((item) => (
                    <li key={item._id}>
                      <span>{item.name}</span>
                      <span className="im-alert-qty danger">0</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="im-sidebar-card">
            <h4>Inventory Requests <span className="im-count">{pendingRequests.length}</span></h4>
            {loadingRefillRequests ? (
              <p className="im-sidebar-muted">Loading…</p>
            ) : pendingRequests.length === 0 ? (
              <p className="im-sidebar-muted">No pending requests</p>
            ) : (
              <ul className="im-request-list">
                {pendingRequests.map((req) => (
                  <li key={req._id} className="im-request-item">
                    <div className="im-request-top">
                      <strong>{getEmployeeName(req.employeeId)}</strong>
                      <span className="im-status-pill im-status-low">Pending</span>
                    </div>
                    <div className="im-request-meta">
                      {req.itemName || 'Item'} · {req.quantity} {req.unit}
                    </div>
                    <div className="im-request-footer">
                      <span>{relativeTime(req.createdAt)}</span>
                      <div className="im-request-actions">
                        <button type="button" className="im-btn-xs approve" onClick={() => onReviewRefillRequest(req._id, 'approve')}>✓</button>
                        <button type="button" className="im-btn-xs reject" onClick={() => onReviewRefillRequest(req._id, 'reject')}>✕</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="im-sidebar-card">
            <h4>Recent Activity</h4>
            <ol className="im-activity-list">
              {recentActivity.length === 0 ? (
                <li className="im-sidebar-muted">No recent activity</li>
              ) : recentActivity.map((event) => (
                <li key={event.id} className={`im-activity-item im-activity-${event.type}`}>
                  <span className="im-activity-dot" />
                  <div>
                    <span className="im-activity-label">{event.label}</span>
                    <span className="im-activity-time">{relativeTime(event.time)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <div className="im-charts-row">
        <div className="im-chart-card">
          <h3>Stock by Category</h3>
          {categoryChartData.length === 0 ? (
            <p className="im-sidebar-muted">No data yet</p>
          ) : (
            <DonutChart data={categoryChartData} totalLabel={stats.stockInHand.toLocaleString()} />
          )}
        </div>
        <div className="im-chart-card">
          <h3>Stock Levels Overview</h3>
          <div className="im-bar-chart">
            {topItems.map((item) => {
              const max = Math.max(...topItems.map((i) => Number(i.currentStock || 0)), 1)
              const pct = (Number(item.currentStock || 0) / max) * 100
              return (
                <div key={item._id} className="im-bar-row">
                  <span className="im-bar-label">{item.name}</span>
                  <div className="im-bar-track">
                    <div className="im-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="im-bar-value">{item.currentStock}</span>
                </div>
              )
            })}
            {topItems.length === 0 ? <p className="im-sidebar-muted">No items yet</p> : null}
          </div>
        </div>
        <div className="im-chart-card">
          <h3>Items Near Capacity</h3>
          <div className="im-bar-chart">
            {[...inventory]
              .filter((i) => i.maxCapacity > 0)
              .sort((a, b) => (a.currentStock / a.maxCapacity) - (b.currentStock / b.maxCapacity))
              .slice(0, 5)
              .map((item) => {
                const pct = Math.round((item.currentStock / item.maxCapacity) * 100)
                return (
                  <div key={item._id} className="im-bar-row">
                    <span className="im-bar-label">{item.name}</span>
                    <div className="im-bar-track">
                      <div className={`im-bar-fill ${pct <= 30 ? 'low' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="im-bar-value">{pct}%</span>
                  </div>
                )
              })}
            {inventory.filter((i) => i.maxCapacity > 0).length === 0 ? (
              <p className="im-sidebar-muted">Set max capacity on items to see this</p>
            ) : null}
          </div>
        </div>
      </div>

      {showItemForm ? (
        <ItemFormModal
          editingInventoryId={editingInventoryId}
          inventoryFormData={inventoryFormData}
          inventoryMessage={inventoryMessage}
          loadingInventory={loadingInventory}
          onClose={closeForm}
          onChange={onInventoryFormChange}
          onSubmit={(e) => {
            onInventorySubmit(e)
          }}
        />
      ) : null}

      <StockModal
        modal={stockUpdateModal}
        loadingInventory={loadingInventory}
        onChange={onStockModalChange}
        onSubmit={onStockUpdate}
        onClose={() => onStockModalChange({ open: false, item: null, quantity: '', operation: 'add' })}
      />
    </div>
  )
}
