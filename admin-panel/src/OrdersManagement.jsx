import React, { useMemo, useState } from 'react'
import './OrdersManagement.css'

const PHOTO_SLOT_LABELS = [
  ['front', 'Front'],
  ['right', 'Right side'],
  ['left', 'Left side'],
  ['back', 'Back side'],
  ['damages1', 'Damages 1'],
  ['damages2', 'Damages 2'],
]

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending', statuses: ['Pending', 'Paid', 'Scheduled'] },
  { id: 'assigned', label: 'Assigned', assigned: true },
  { id: 'in_progress', label: 'In Progress', statuses: ['In Progress'] },
  { id: 'completed', label: 'Completed', statuses: ['Completed'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['Cancelled'] },
]

const PENDING_STATUSES = ['Pending', 'Paid', 'Scheduled']

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatOrderId(order) {
  if (order.orderNumber) return `#${order.orderNumber}`
  return `#${String(order._id).slice(-6).toUpperCase()}`
}

function getPrimaryService(order) {
  const item = order.items?.[0]
  if (!item) return { name: '—', sub: '' }
  const name = item.serviceName || item.service?.name || 'Service'
  const sub = item.packageType && item.packageType !== 'OneTime' ? item.packageType : ''
  return { name, sub }
}

function getScheduledDateTime(order) {
  const item = order.items?.[0]
  if (!item) return '—'
  if (item.scheduledDate) {
    const date = new Date(item.scheduledDate)
    const dateStr = Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const time = item.scheduledTimeSlot || ''
    return time ? `${dateStr}, ${time}` : dateStr
  }
  if (order.createdAt) {
    return new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return '—'
}

function isAssignedOrder(order) {
  return Boolean(order.assignedEmployeeId) && !['Completed', 'Cancelled'].includes(order.status)
}

function normalizeStatusKey(status) {
  return String(status || 'pending').trim().toLowerCase().replace(/\s+/g, '_')
}

function orderMatchesStatus(order, statusFilter) {
  if (statusFilter === 'all') return true
  return normalizeStatusKey(order.status) === statusFilter
}

function getOrderDate(order) {
  const item = order.items?.[0]
  if (item?.scheduledDate) {
    const d = new Date(item.scheduledDate)
    if (!Number.isNaN(d.getTime())) return d
  }
  if (order.createdAt) {
    const d = new Date(order.createdAt)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function getEmployeeName(employeeId, employees) {
  if (!employeeId) return null
  const match = employees.find((emp) => emp.employeeId === employeeId)
  return match?.name || employeeId
}

function buildTimeline(order) {
  const hasAssignment = Boolean(order.assignedEmployeeId)
  const hasLocation = Boolean(order.employeeLocation?.latitude)
  const hasBeforePhotos = Boolean(order.servicePhotos?.beforePhotos && Object.keys(order.servicePhotos.beforePhotos).length)
  const inProgress = order.status === 'In Progress'
  const completed = order.status === 'Completed'
  const hasOtp = Boolean(order.startOtp)

  const steps = [
    { key: 'placed', label: 'Order Placed', done: true },
    { key: 'assigned', label: 'Assigned', done: hasAssignment },
    { key: 'journey', label: 'Journey Started', done: hasLocation },
    { key: 'reached', label: 'Reached Location', done: inProgress || completed },
    { key: 'started', label: 'Service Started', done: hasBeforePhotos || inProgress || completed },
    { key: 'progress', label: 'Service In Progress', done: inProgress || completed },
  ]

  if (hasOtp && !completed) {
    steps.push({ key: 'otp', label: 'OTP Verification Pending', done: false, current: true })
  } else if (completed) {
    steps.push({ key: 'done', label: 'Service Completed', done: true })
  } else if (inProgress) {
    const currentIdx = steps.findIndex((s) => s.key === 'progress')
    if (currentIdx >= 0) steps[currentIdx].current = true
  } else {
    const firstPending = steps.find((s) => !s.done)
    if (firstPending) firstPending.current = true
  }

  return steps
}

function normalizePhotoSlots(value) {
  if (!value) return {}
  if (Array.isArray(value)) {
    return Object.fromEntries(
      PHOTO_SLOT_LABELS.map(([key], i) => [key, value[i] || '']).filter(([, url]) => url)
    )
  }
  return typeof value === 'object' ? value : {}
}

function exportOrdersCsv(orders) {
  const headers = ['Order ID', 'Customer', 'Phone', 'Service', 'Vehicle', 'Assigned To', 'Date', 'Status', 'Amount']
  const rows = orders.map((order) => {
    const service = getPrimaryService(order)
    const vehicle = [order.customer?.vehicleModel, order.customer?.vehicleType].filter(Boolean).join(' ') || '—'
    return [
      formatOrderId(order),
      order.customer?.name || '—',
      order.customer?.phone || '—',
      service.name,
      vehicle,
      order.assignedEmployeeId || '—',
      getScheduledDateTime(order),
      order.status || 'Pending',
      Number(order.totalAmount || 0).toFixed(2),
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon, label, value, trend, trendUp, variant }) {
  return (
    <div className={`om-stat-card om-stat-${variant}`}>
      <div className="om-stat-icon">{icon}</div>
      <div className="om-stat-body">
        <span className="om-stat-label">{label}</span>
        <span className="om-stat-value">{value.toLocaleString()}</span>
        <span className={`om-stat-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
        <span className="om-stat-compare">vs previous period</span>
      </div>
    </div>
  )
}

function OrderDetailSidebar({
  order,
  employees,
  onClose,
  onMarkDelivered,
  onCreditWallet,
  resolveUploadUrl,
}) {
  const service = getPrimaryService(order)
  const employeeName = getEmployeeName(order.assignedEmployeeId, employees)
  const timeline = buildTimeline(order)
  const vehicleLabel = [order.customer?.vehicleModel, order.customer?.vehicleType].filter(Boolean).join(' · ') || '—'
  const paymentLabel = order.walletUsed > 0 ? 'Wallet + Online' : 'Online'
  const isPaid = ['Paid', 'Scheduled', 'In Progress', 'Completed'].includes(order.status)

  const beforeSlots = normalizePhotoSlots(order.servicePhotos?.beforePhotos)
  const afterSlots = normalizePhotoSlots(order.servicePhotos?.afterPhotos)
  const hasBefore = Object.keys(beforeSlots).length > 0
  const hasAfter = Object.keys(afterSlots).length > 0

  return (
    <aside className="om-sidebar">
      <div className="om-sidebar-header">
        <h3>Order Details</h3>
        <button type="button" className="om-sidebar-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="om-sidebar-summary">
        <div>
          <span className="om-sidebar-order-id">{formatOrderId(order)}</span>
          <span className="om-sidebar-placed">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
        </div>
        <span className={`om-status-pill om-status-${normalizeStatusKey(order.status)}`}>
          {order.status || 'Pending'}
        </span>
      </div>

      <div className="om-customer-card">
        <div className="om-avatar om-avatar-lg">{getInitials(order.customer?.name)}</div>
        <div className="om-customer-info">
          <strong>{order.customer?.name || '—'}</strong>
          <span>{order.customer?.phone || '—'}</span>
          {order.customer?.address ? <span className="om-customer-address">{order.customer.address}</span> : null}
        </div>
      </div>

      <div className="om-info-section">
        <h4>Service Information</h4>
        <dl className="om-info-grid">
          <div><dt>Service</dt><dd>{service.name}{service.sub ? <small>{service.sub}</small> : null}</dd></div>
          <div><dt>Vehicle</dt><dd>{vehicleLabel}</dd></div>
          <div><dt>Preferred Date & Time</dt><dd>{getScheduledDateTime(order)}</dd></div>
          <div>
            <dt>Payment Method</dt>
            <dd>
              {paymentLabel}
              {isPaid ? <span className="om-badge om-badge-paid">Paid</span> : null}
            </dd>
          </div>
          <div><dt>Amount</dt><dd className="om-amount">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</dd></div>
          {order.items?.[0]?.packageType && order.items[0].packageType !== 'OneTime' ? (
            <div>
              <dt>Package</dt>
              <dd><span className="om-badge om-badge-package">{order.items[0].packageType}</span></dd>
            </div>
          ) : null}
          {employeeName ? (
            <div><dt>Assigned To</dt><dd>{employeeName}</dd></div>
          ) : null}
        </dl>
      </div>

      {(order.items || []).length > 0 ? (
        <div className="om-info-section">
          <h4>Slots & Items</h4>
          <div className="om-slot-list">
            {(order.items || []).map((item, index) => {
              const slotDate = item?.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '—'
              const slotTime = item?.scheduledTimeSlot || '—'
              const serviceName = item?.serviceName || item?.service?.name || 'Service'
              return (
                <div key={`${order._id}-slot-${index}`} className="om-slot-item">
                  <strong>{serviceName}</strong>
                  <span>{slotDate} · {slotTime}</span>
                  {Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length > 0 ? (
                    <span className="om-slot-meta">{item.scheduledSlots.length} package slots</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="om-info-section">
        <h4>Order Timeline</h4>
        <ol className="om-timeline">
          {timeline.map((step) => (
            <li
              key={step.key}
              className={[
                step.done ? 'done' : '',
                step.current ? 'current' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="om-timeline-dot" />
              <span className="om-timeline-label">{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {(hasBefore || hasAfter) ? (
        <div className="om-info-section">
          <h4>Service Photos</h4>
          {hasBefore ? (
            <div className="om-photos-group">
              <span className="om-photos-label">Before</span>
              <div className="om-photos-thumbs">
                {PHOTO_SLOT_LABELS.map(([key, label]) => {
                  const url = beforeSlots[key]
                  if (!url) return null
                  return (
                    <a key={key} href={resolveUploadUrl(url)} target="_blank" rel="noopener noreferrer" title={label}>
                      <img src={resolveUploadUrl(url)} alt={label} />
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}
          {hasAfter ? (
            <div className="om-photos-group">
              <span className="om-photos-label">After</span>
              <div className="om-photos-thumbs">
                {PHOTO_SLOT_LABELS.map(([key, label]) => {
                  const url = afterSlots[key]
                  if (!url) return null
                  return (
                    <a key={key} href={resolveUploadUrl(url)} target="_blank" rel="noopener noreferrer" title={label}>
                      <img src={resolveUploadUrl(url)} alt={label} />
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="om-sidebar-actions">
        {order.customer?.phone ? (
          <button
            type="button"
            className="om-btn om-btn-secondary"
            onClick={async () => {
              const phone = order.customer?.phone
              const amountInput = window.prompt(`Add amount to wallet for ${phone}`, '500')
              if (!amountInput) return
              const noteInput = window.prompt('Add a note (optional)', 'Admin credit')
              const result = await onCreditWallet({ phone, amount: amountInput, note: noteInput || '' })
              if (result && typeof result.walletBalance === 'number') {
                window.alert(`Wallet updated. New balance: ₹${result.walletBalance}`)
              }
            }}
          >
            Add to Wallet
          </button>
        ) : null}
        <button
          type="button"
          className="om-btn om-btn-primary"
          disabled={order.status === 'Completed'}
          onClick={() => onMarkDelivered(order._id)}
        >
          Mark Delivered
        </button>
      </div>
    </aside>
  )
}

export default function OrdersManagement({
  orders,
  loadingOrders,
  selectedOrderId,
  onSelectOrder,
  employees,
  onMarkDelivered,
  onCreditWallet,
  resolveUploadUrl,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [openActionMenu, setOpenActionMenu] = useState(null)

  const stats = useMemo(() => {
    const pending = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length
    const inProgress = orders.filter((o) => o.status === 'In Progress').length
    const completed = orders.filter((o) => o.status === 'Completed').length
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length
    return { total: orders.length, pending, inProgress, completed, cancelled }
  }, [orders])

  const tabCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
    assigned: orders.filter(isAssignedOrder).length,
    in_progress: orders.filter((o) => o.status === 'In Progress').length,
    completed: orders.filter((o) => o.status === 'Completed').length,
    cancelled: orders.filter((o) => o.status === 'Cancelled').length,
  }), [orders])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (dateFrom) count += 1
    if (dateTo) count += 1
    if (assignmentFilter !== 'all') count += 1
    if (employeeFilter !== 'all') count += 1
    return count
  }, [dateFrom, dateTo, assignmentFilter, employeeFilter])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setStatusFilter('all')
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    if (value !== 'all') setActiveTab('all')
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setAssignmentFilter('all')
    setEmployeeFilter('all')
  }

  const filteredOrders = useMemo(() => {
    let list = [...orders]

    const tab = STATUS_TABS.find((t) => t.id === activeTab)
    if (tab?.statuses) {
      list = list.filter((o) => tab.statuses.includes(o.status))
    } else if (tab?.assigned) {
      list = list.filter(isAssignedOrder)
    }

    if (statusFilter !== 'all') {
      list = list.filter((o) => orderMatchesStatus(o, statusFilter))
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      list = list.filter((o) => {
        const d = getOrderDate(o)
        return d && d >= from
      })
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter((o) => {
        const d = getOrderDate(o)
        return d && d <= to
      })
    }

    if (assignmentFilter === 'assigned') {
      list = list.filter((o) => Boolean(o.assignedEmployeeId))
    } else if (assignmentFilter === 'unassigned') {
      list = list.filter((o) => !o.assignedEmployeeId)
    }

    if (employeeFilter !== 'all') {
      list = list.filter((o) => o.assignedEmployeeId === employeeFilter)
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((order) => {
        const service = getPrimaryService(order)
        const haystack = [
          formatOrderId(order),
          order._id,
          order.orderNumber,
          order.customer?.name,
          order.customer?.phone,
          service.name,
          order.customer?.vehicleModel,
          order.customer?.vehicleType,
          order.assignedEmployeeId,
          getEmployeeName(order.assignedEmployeeId, employees),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    return list
  }, [orders, activeTab, statusFilter, searchQuery, employees, dateFrom, dateTo, assignmentFilter, employeeFilter])

  const selectedOrder = orders.find((o) => o._id === selectedOrderId) || null

  const dateRangeLabel = useMemo(() => {
    const fmt = (value) => {
      if (!value) return ''
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`
    if (dateFrom) return `From ${fmt(dateFrom)}`
    if (dateTo) return `Until ${fmt(dateTo)}`
    return 'All dates'
  }, [dateFrom, dateTo])

  return (
    <div className="om-page">
      <header className="om-header">
        <div>
          <h1 className="om-title">Order Management</h1>
          <p className="om-subtitle">Manage all customer orders and service requests.</p>
        </div>
        <div className="om-header-actions">
          <button
            type="button"
            className={`om-date-picker ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <span className="om-icon-calendar" />
            {dateRangeLabel}
          </button>
          <button
            type="button"
            className={`om-btn om-btn-ghost om-filters-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <span className="om-icon-filter" />
            Filters
            {activeFilterCount > 0 ? <span className="om-filter-badge">{activeFilterCount}</span> : null}
          </button>
        </div>
      </header>

      <div className="om-stats-grid">
        <StatCard icon="📋" label="Total Orders" value={stats.total} trend="15.3%" trendUp variant="total" />
        <StatCard icon="⏳" label="Pending" value={stats.pending} trend="8.6%" trendUp variant="pending" />
        <StatCard icon="🔄" label="In Progress" value={stats.inProgress} trend="12.5%" trendUp variant="progress" />
        <StatCard icon="✅" label="Completed" value={stats.completed} trend="16.8%" trendUp variant="completed" />
        <StatCard icon="✕" label="Cancelled" value={stats.cancelled} trend="5.2%" trendUp={false} variant="cancelled" />
      </div>

      <div className={`om-body ${selectedOrder ? 'has-sidebar' : ''}`}>
        <div className="om-main">
          {showFilters ? (
            <div className="om-filters-panel">
              <div className="om-filters-grid">
                <label className="om-filter-field">
                  <span>From date</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </label>
                <label className="om-filter-field">
                  <span>To date</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </label>
                <label className="om-filter-field">
                  <span>Assignment</span>
                  <select
                    value={assignmentFilter}
                    onChange={(e) => setAssignmentFilter(e.target.value)}
                  >
                    <option value="all">All orders</option>
                    <option value="assigned">Assigned only</option>
                    <option value="unassigned">Unassigned only</option>
                  </select>
                </label>
                <label className="om-filter-field">
                  <span>Employee</span>
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                  >
                    <option value="all">All employees</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.name || emp.employeeId}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="om-filters-actions">
                <button type="button" className="om-btn om-btn-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
                <button type="button" className="om-btn om-btn-primary" onClick={() => setShowFilters(false)}>
                  Apply
                </button>
              </div>
            </div>
          ) : null}

          <nav className="om-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
                <span className="om-tab-count">({tabCounts[tab.id] ?? 0})</span>
              </button>
            ))}
          </nav>

          <div className="om-toolbar">
            <div className="om-search">
              <span className="om-icon-search" />
              <input
                type="search"
                placeholder="Search by Order ID, Customer, Phone, Vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="om-status-select"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              className="om-btn om-btn-ghost"
              onClick={() => exportOrdersCsv(filteredOrders)}
              disabled={filteredOrders.length === 0}
            >
              <span className="om-icon-export" />
              Export
            </button>
          </div>

          <div className="om-table-wrap">
            {loadingOrders ? (
              <div className="om-empty">Loading orders…</div>
            ) : filteredOrders.length === 0 ? (
              <div className="om-empty">No orders match your filters.</div>
            ) : (
              <table className="om-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Vehicle</th>
                    <th>Assigned To</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const service = getPrimaryService(order)
                    const employeeName = getEmployeeName(order.assignedEmployeeId, employees)
                    const isNew = order.createdAt && Date.now() - new Date(order.createdAt).getTime() < 86400000
                    return (
                      <tr
                        key={order._id}
                        className={selectedOrderId === order._id ? 'selected' : ''}
                        onClick={() => onSelectOrder(order._id)}
                      >
                        <td>
                          <div className="om-order-id-cell">
                            <span className="om-order-link">{formatOrderId(order)}</span>
                            {isNew ? <span className="om-mini-badge new">New</span> : null}
                            {order.status === 'Cancelled' ? <span className="om-mini-badge cancelled">Cancelled</span> : null}
                          </div>
                        </td>
                        <td>
                          <div className="om-customer-cell">
                            <span className="om-avatar">{getInitials(order.customer?.name)}</span>
                            <div>
                              <strong>{order.customer?.name || '—'}</strong>
                              <span>{order.customer?.phone || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="om-service-cell">
                            <strong>{service.name}</strong>
                            {service.sub ? <span>{service.sub}</span> : null}
                          </div>
                        </td>
                        <td>
                          <div className="om-vehicle-cell">
                            <span className="om-vehicle-icon">🚗</span>
                            <div>
                              <strong>{order.customer?.vehicleModel || '—'}</strong>
                              <span>{order.customer?.vehicleType || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {employeeName ? (
                            <div className="om-assignee-cell">
                              <span className="om-avatar om-avatar-sm">{getInitials(employeeName)}</span>
                              <span>{employeeName}</span>
                            </div>
                          ) : (
                            <span className="om-muted">Unassigned</span>
                          )}
                        </td>
                        <td className="om-datetime">{getScheduledDateTime(order)}</td>
                        <td>
                          <span className={`om-status-pill om-status-${normalizeStatusKey(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="om-amount">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="om-actions-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="om-action-menu-wrap">
                            <button
                              type="button"
                              className="om-kebab"
                              onClick={() => setOpenActionMenu(openActionMenu === order._id ? null : order._id)}
                              aria-label="Actions"
                            >
                              ⋮
                            </button>
                            {openActionMenu === order._id ? (
                              <div className="om-action-menu">
                                <button type="button" onClick={() => { onSelectOrder(order._id); setOpenActionMenu(null) }}>
                                  View details
                                </button>
                                {order.status !== 'Completed' ? (
                                  <button type="button" onClick={() => { onMarkDelivered(order._id); setOpenActionMenu(null) }}>
                                    Mark delivered
                                  </button>
                                ) : null}
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
        </div>

        {selectedOrder ? (
          <OrderDetailSidebar
            order={selectedOrder}
            employees={employees}
            onClose={() => onSelectOrder(null)}
            onMarkDelivered={onMarkDelivered}
            onCreditWallet={onCreditWallet}
            resolveUploadUrl={resolveUploadUrl}
          />
        ) : null}
      </div>
    </div>
  )
}
