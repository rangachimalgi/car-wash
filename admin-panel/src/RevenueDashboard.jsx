import React, { useMemo, useState } from 'react'
import './RevenueDashboard.css'

const COMPLETED_STATUSES = new Set(['completed', 'delivered', 'done'])
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled', 'rejected', 'failed'])
const DONUT_COLORS = ['#2563eb', '#60a5fa', '#22c55e', '#a855f7', '#f97316', '#64748b']

function formatCurrency(value) {
  return `₹ ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatCompact(value) {
  const n = Number(value || 0)
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(Math.round(n))
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatRangeLabel(start, end) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

function getOrderDate(order) {
  const raw = order.createdAt || order.updatedAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function getOrderAmount(order) {
  return Number(order.totalAmount || order.total || 0)
}

function isCountableOrder(order) {
  const status = String(order?.status || '').toLowerCase()
  return !CANCELLED_STATUSES.has(status)
}

function isCompletedOrder(order) {
  const status = String(order?.status || '').toLowerCase()
  return COMPLETED_STATUSES.has(status) || status === 'completed'
}

function getServiceName(order) {
  const item = order.items?.[0]
  return item?.serviceName || item?.service?.name || 'Other'
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function formatOrderId(order) {
  if (order.orderNumber) return `#${order.orderNumber}`
  return `#${String(order._id).slice(-6).toUpperCase()}`
}

function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} mins ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function filterOrdersByRange(orders, start, end) {
  return orders.filter((order) => {
    const date = getOrderDate(order)
    if (!date || !isCountableOrder(order)) return false
    return date >= startOfDay(start) && date <= endOfDay(end)
  })
}

function sumRevenue(orders) {
  return orders.reduce((sum, order) => sum + getOrderAmount(order), 0)
}

function buildDailySeries(orders, start, end) {
  const days = []
  let cursor = startOfDay(start)
  const last = startOfDay(end)
  while (cursor <= last) {
    days.push(new Date(cursor))
    cursor = addDays(cursor, 1)
  }
  return days.map((day) => {
    const next = addDays(day, 1)
    const dayOrders = orders.filter((order) => {
      const date = getOrderDate(order)
      return date && date >= day && date < next && isCountableOrder(order)
    })
    return {
      date: day,
      label: day.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: sumRevenue(dayOrders),
      orders: dayOrders.length,
    }
  })
}

function buildDonutSegments(orders) {
  const totals = {}
  orders.forEach((order) => {
    if (!isCountableOrder(order)) return
    const name = getServiceName(order)
    totals[name] = (totals[name] || 0) + getOrderAmount(order)
  })
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const grand = entries.reduce((s, [, v]) => s + v, 0) || 1
  return entries.map(([name, value], index) => ({
    name,
    value,
    pct: (value / grand) * 100,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }))
}

function buildCustomerRows(orders) {
  const map = new Map()
  orders.forEach((order) => {
    if (!isCountableOrder(order)) return
    const phone = order.customer?.phone || order.user?.phone
    if (!phone) return
    const existing = map.get(phone) || {
      id: phone,
      name: order.customer?.name || order.user?.name || 'Customer',
      phone,
      city: order.customer?.address?.split(',')[0]?.trim() || order.customer?.city || '—',
      orders: 0,
      lastOrder: null,
    }
    existing.orders += 1
    const date = getOrderDate(order)
    if (date && (!existing.lastOrder || date > existing.lastOrder)) {
      existing.lastOrder = date
    }
    map.set(phone, existing)
  })
  return [...map.values()]
    .sort((a, b) => b.orders - a.orders)
    .map((row) => ({
      ...row,
      engagement: Math.min(100, row.orders * 18),
      active: row.lastOrder && Date.now() - row.lastOrder.getTime() < 30 * 86400000,
    }))
}

function buildTopServices(orders) {
  const totals = {}
  orders.forEach((order) => {
    if (!isCountableOrder(order)) return
    const name = getServiceName(order)
    totals[name] = (totals[name] || 0) + getOrderAmount(order)
  })
  const max = Math.max(...Object.values(totals), 1)
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value, pct: (value / max) * 100 }))
}

function buildNotifications(orders, refillRequests, inventory) {
  const items = []
  orders.slice(0, 8).forEach((order) => {
    const date = getOrderDate(order)
    items.push({
      id: `order-${order._id}`,
      type: 'order',
      title: 'New order received',
      sub: `${formatOrderId(order)} · ${getServiceName(order)}`,
      time: date,
    })
  })
  refillRequests
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .slice(0, 4)
    .forEach((req) => {
      items.push({
        id: `refill-${req._id}`,
        type: 'refill',
        title: req.status === 'approved' ? 'Replenishment approved' : 'Refill request pending',
        sub: req.inventoryItem?.name || req.itemName || 'Inventory item',
        time: req.createdAt || req.updatedAt,
      })
    })
  inventory
    .filter((i) => i.isLowStock || i.currentStock === 0)
    .slice(0, 4)
    .forEach((item) => {
      items.push({
        id: `stock-${item._id}`,
        type: 'stock',
        title: item.currentStock === 0 ? 'Out of stock alert' : 'Low stock alert',
        sub: `${item.name} · ${item.currentStock} ${item.unit || 'units'} left`,
        time: item.updatedAt || item.createdAt,
      })
    })
  return items
    .filter((i) => i.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6)
}

function exportDashboardCsv({ kpis, rangeLabel, customers, recentOrders, inventory }) {
  const lines = [
    ['Woosh Admin Dashboard Report', rangeLabel],
    [],
    ['Metric', 'Value'],
    ['Total Revenue', kpis.revenue],
    ['Total Orders', kpis.orders],
    ['Active Customers', kpis.customers],
    ['Active Employees', kpis.employees],
    ['Completed Orders', kpis.completed],
    ['Average Rating', kpis.rating],
    [],
    ['Top Customers', 'Phone', 'Orders'],
    ...customers.slice(0, 10).map((c) => [c.name, c.phone, c.orders]),
    [],
    ['Recent Orders', 'Customer', 'Service', 'Status', 'Amount'],
    ...recentOrders.slice(0, 15).map((o) => [
      formatOrderId(o),
      o.customer?.name || '—',
      getServiceName(o),
      o.status || '—',
      getOrderAmount(o),
    ]),
    [],
    ['Inventory', 'Stock', 'Status'],
    ...inventory.slice(0, 15).map((i) => [
      i.name,
      i.currentStock,
      i.currentStock === 0 ? 'Out of Stock' : i.isLowStock ? 'Low Stock' : 'In Stock',
    ]),
  ]
  const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `woosh-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon, label, value, change, loading }) {
  const up = change >= 0
  return (
    <div className="db-stat-card">
      <div className={`db-stat-icon db-stat-icon-${icon}`} aria-hidden="true" />
      <div className="db-stat-body">
        <span className="db-stat-label">{label}</span>
        <span className="db-stat-value">{loading ? '…' : value}</span>
        {!loading && change !== null && change !== undefined ? (
          <span className={`db-stat-change ${up ? 'up' : 'down'}`}>
            {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs previous period
          </span>
        ) : null}
      </div>
    </div>
  )
}

function LineChart({ series }) {
  const maxRevenue = Math.max(...series.map((d) => d.revenue), 1)
  const maxOrders = Math.max(...series.map((d) => d.orders), 1)
  const width = 100
  const height = 100
  const pad = 8

  const revenuePoints = series.map((d, i) => {
    const x = pad + (i / Math.max(series.length - 1, 1)) * (width - pad * 2)
    const y = height - pad - (d.revenue / maxRevenue) * (height - pad * 2)
    return { x, y, ...d }
  })

  const orderPoints = series.map((d, i) => {
    const x = pad + (i / Math.max(series.length - 1, 1)) * (width - pad * 2)
    const y = height - pad - (d.orders / maxOrders) * (height - pad * 2)
    return { x, y }
  })

  const revenuePath = revenuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const orderPath = orderPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="db-line-chart-wrap">
      <div className="db-line-y db-line-y-left">
        {[maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0].map((v, i) => (
          <span key={i}>{formatCompact(v)}</span>
        ))}
      </div>
      <div className="db-line-y db-line-y-right">
        {[maxOrders, Math.round(maxOrders * 0.75), Math.round(maxOrders * 0.5), Math.round(maxOrders * 0.25), 0].map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="db-line-chart">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={width - pad} y1={height - pad - f * (height - pad * 2)} y2={height - pad - f * (height - pad * 2)} className="db-grid-line" />
        ))}
        <path d={orderPath} className="db-line-orders" fill="none" />
        <path d={revenuePath} className="db-line-revenue" fill="none" />
      </svg>
      <div className="db-line-x">
        {series.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <div className="db-line-legend">
        <span><i className="db-legend-dot revenue" /> Revenue (₹)</span>
        <span><i className="db-legend-dot orders" /> Orders</span>
      </div>
    </div>
  )
}

function DonutChart({ segments, total }) {
  let offset = 0
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const slices = segments.map((seg) => {
    const dash = (seg.pct / 100) * circumference
    const slice = { ...seg, dash, gap: circumference - dash, offset }
    offset += dash
    return slice
  })

  return (
    <div className="db-donut-wrap">
      <div className="db-donut-chart">
        <svg viewBox="0 0 120 120" className="db-donut">
          <circle cx="60" cy="60" r={radius} className="db-donut-bg" />
          {slices.map((seg) => (
            <circle
              key={seg.name}
              cx="60"
              cy="60"
              r={radius}
              className="db-donut-slice"
              stroke={seg.color}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <div className="db-donut-center">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>
      <ul className="db-donut-legend">
        {segments.map((seg) => (
          <li key={seg.name}>
            <i style={{ background: seg.color }} />
            <span>{seg.name}</span>
            <em>{seg.pct.toFixed(0)}%</em>
            <b>{formatCurrency(seg.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MiniSparkline({ value }) {
  const bars = [0.35, 0.55, 0.4, 0.7, 0.5, 0.85, value / 100].map((h) => Math.max(0.15, Math.min(1, h)))
  return (
    <div className="db-sparkline" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${h * 100}%` }} />
      ))}
    </div>
  )
}

function PanelTable({ title, actionLabel, children, search, onSearch, footer }) {
  return (
    <div className="db-panel">
      <div className="db-panel-head">
        <h3>{title}</h3>
        {actionLabel ? <button type="button" className="db-link-btn">{actionLabel}</button> : null}
      </div>
      {onSearch ? (
        <div className="db-panel-toolbar">
          <div className="db-search">
            <span className="db-search-icon" aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search…" value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
          <button type="button" className="db-icon-btn" aria-label="Filter">☰</button>
        </div>
      ) : null}
      <div className="db-panel-body">{children}</div>
      {footer ? <div className="db-panel-foot">{footer}</div> : null}
    </div>
  )
}

export default function RevenueDashboard({
  orders = [],
  employees = [],
  inventory = [],
  reviews = [],
  refillRequests = [],
  pendingRefillCount = 0,
  loadingOrders,
  loadingEmployees,
  loadingInventory,
  loadingReviews,
  loadingRefillRequests,
}) {
  const today = useMemo(() => new Date(), [])
  const defaultEnd = useMemo(() => startOfDay(today), [today])
  const defaultStart = useMemo(() => addDays(defaultEnd, -6), [defaultEnd])

  const [rangeStart, setRangeStart] = useState(() => defaultStart.toISOString().slice(0, 10))
  const [rangeEnd, setRangeEnd] = useState(() => defaultEnd.toISOString().slice(0, 10))
  const [chartPreset, setChartPreset] = useState('week')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')

  const start = useMemo(() => startOfDay(new Date(rangeStart)), [rangeStart])
  const end = useMemo(() => startOfDay(new Date(rangeEnd)), [rangeEnd])
  const rangeDays = Math.max(1, Math.round((end - start) / 86400000) + 1)
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(rangeDays - 1))

  const rangeOrders = useMemo(() => filterOrdersByRange(orders, start, end), [orders, start, end])
  const prevRangeOrders = useMemo(() => filterOrdersByRange(orders, prevStart, prevEnd), [orders, prevStart, prevEnd])

  const loading = loadingOrders || loadingEmployees || loadingInventory

  const kpis = useMemo(() => {
    const revenue = sumRevenue(rangeOrders)
    const prevRevenue = sumRevenue(prevRangeOrders)
    const orderCount = rangeOrders.length
    const prevOrderCount = prevRangeOrders.length
    const customers = buildCustomerRows(rangeOrders).length
    const prevCustomers = buildCustomerRows(prevRangeOrders).length
    const completed = rangeOrders.filter(isCompletedOrder).length
    const prevCompleted = prevRangeOrders.filter(isCompletedOrder).length
    const ratings = reviews.filter((r) => r.rating).map((r) => Number(r.rating))
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    const employeeCount = employees.length

    return {
      revenue,
      orders: orderCount,
      customers,
      employees: employeeCount,
      completed,
      rating: avgRating ? avgRating.toFixed(1) : '—',
      changes: {
        revenue: pctChange(revenue, prevRevenue),
        orders: pctChange(orderCount, prevOrderCount),
        customers: pctChange(customers, prevCustomers),
        employees: 0,
        completed: pctChange(completed, prevCompleted),
        rating: 0,
      },
    }
  }, [rangeOrders, prevRangeOrders, reviews, employees.length])

  const chartSeries = useMemo(() => buildDailySeries(orders, start, end), [orders, start, end])
  const donutSegments = useMemo(() => buildDonutSegments(rangeOrders), [rangeOrders])
  const donutTotal = useMemo(() => donutSegments.reduce((s, d) => s + d.value, 0), [donutSegments])

  const summary = useMemo(() => {
    const todayStart = startOfDay(today)
    const weekStart = addDays(todayStart, -6)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const todayRev = sumRevenue(filterOrdersByRange(orders, todayStart, today))
    const weekRev = sumRevenue(filterOrdersByRange(orders, weekStart, today))
    const monthRev = sumRevenue(filterOrdersByRange(orders, monthStart, today))
    const lastMonthRev = sumRevenue(filterOrdersByRange(orders, lastMonthStart, lastMonthEnd))
    const growth = pctChange(monthRev, lastMonthRev)

    return { todayRev, weekRev, monthRev, lastMonthRev, growth }
  }, [orders, today])

  const customers = useMemo(() => {
    const rows = buildCustomerRows(orders)
    if (!customerSearch.trim()) return rows.slice(0, 5)
    const q = customerSearch.toLowerCase()
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.phone.includes(q)).slice(0, 5)
  }, [orders, customerSearch])

  const recentOrders = useMemo(() => {
    let list = [...orders].sort((a, b) => {
      const da = getOrderDate(a)?.getTime() || 0
      const db = getOrderDate(b)?.getTime() || 0
      return db - da
    })
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase()
      list = list.filter((o) =>
        formatOrderId(o).toLowerCase().includes(q) ||
        (o.customer?.name || '').toLowerCase().includes(q) ||
        getServiceName(o).toLowerCase().includes(q)
      )
    }
    return list.slice(0, 5)
  }, [orders, orderSearch])

  const inventoryRows = useMemo(() => {
    let list = [...inventory]
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
    }
    return list.slice(0, 5)
  }, [inventory, inventorySearch])

  const lowStock = useMemo(
    () => inventory.filter((i) => i.isLowStock && i.currentStock > 0).slice(0, 4),
    [inventory]
  )

  const upcomingReplenishment = useMemo(
    () =>
      refillRequests
        .filter((r) => r.status === 'pending' || r.status === 'approved')
        .slice(0, 4),
    [refillRequests]
  )

  const topServices = useMemo(() => buildTopServices(rangeOrders), [rangeOrders])
  const notifications = useMemo(
    () => buildNotifications(orders, refillRequests, inventory),
    [orders, refillRequests, inventory]
  )

  const rangeLabel = formatRangeLabel(start, end)
  const prevRangeLabel = formatRangeLabel(prevStart, prevEnd)

  const applyPreset = (preset) => {
    setChartPreset(preset)
    const endDate = startOfDay(today)
    if (preset === 'week') {
      setRangeStart(addDays(endDate, -6).toISOString().slice(0, 10))
      setRangeEnd(endDate.toISOString().slice(0, 10))
    } else if (preset === 'month') {
      setRangeStart(new Date(endDate.getFullYear(), endDate.getMonth(), 1).toISOString().slice(0, 10))
      setRangeEnd(endDate.toISOString().slice(0, 10))
    }
  }

  const statusClass = (status) => {
    const key = String(status || 'pending').toLowerCase().replace(/\s+/g, '_')
    return `db-status db-status-${key}`
  }

  return (
    <div className="db-page">
      <header className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">Welcome back, Admin! Here&apos;s what&apos;s happening with Woosh today.</p>
        </div>
        <div className="db-header-actions">
          <label className="db-date-range">
            <span aria-hidden="true">📅</span>
            <input type="date" value={rangeStart} onChange={(e) => { setRangeStart(e.target.value); setChartPreset('custom') }} />
            <span>–</span>
            <input type="date" value={rangeEnd} onChange={(e) => { setRangeEnd(e.target.value); setChartPreset('custom') }} />
          </label>
          <button
            type="button"
            className="db-btn db-btn-primary"
            onClick={() => exportDashboardCsv({ kpis, rangeLabel, customers: buildCustomerRows(orders), recentOrders: orders, inventory })}
          >
            ⬇ Download Report
          </button>
          <button type="button" className="db-icon-btn db-bell" aria-label="Notifications">
            🔔
            {pendingRefillCount > 0 ? <span className="db-badge">{pendingRefillCount}</span> : null}
          </button>
          <div className="db-profile">
            <span className="db-avatar">A</span>
            <div>
              <strong>Admin</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="db-stats-grid">
        <StatCard icon="revenue" label="Total Revenue" value={formatCurrency(kpis.revenue)} change={kpis.changes.revenue} loading={loading} />
        <StatCard icon="orders" label="Total Orders" value={kpis.orders.toLocaleString('en-IN')} change={kpis.changes.orders} loading={loading} />
        <StatCard icon="customers" label="Active Customers" value={kpis.customers.toLocaleString('en-IN')} change={kpis.changes.customers} loading={loading} />
        <StatCard icon="employees" label="Active Employees" value={kpis.employees.toLocaleString('en-IN')} change={kpis.changes.employees} loading={loadingEmployees} />
        <StatCard icon="completed" label="Completed Orders" value={kpis.completed.toLocaleString('en-IN')} change={kpis.changes.completed} loading={loading} />
        <StatCard icon="rating" label="Avg. Rating" value={loadingReviews ? '…' : `${kpis.rating}${kpis.rating !== '—' ? ' ★' : ''}`} change={kpis.changes.rating} loading={loadingReviews} />
      </div>

      <div className="db-charts-row">
        <div className="db-card db-chart-card">
          <div className="db-card-head">
            <h3>Revenue Overview</h3>
            <select value={chartPreset} onChange={(e) => applyPreset(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {loadingOrders ? <div className="db-loading">Loading chart…</div> : <LineChart series={chartSeries} />}
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h3>Revenue by Service Type</h3>
          </div>
          {donutSegments.length === 0 ? (
            <div className="db-empty">No revenue data for this period.</div>
          ) : (
            <DonutChart segments={donutSegments} total={donutTotal} />
          )}
        </div>

        <div className="db-card db-summary-card">
          <div className="db-card-head">
            <h3>Revenue Summary</h3>
          </div>
          <ul className="db-summary-list">
            <li><span>Today&apos;s Revenue</span><strong>{formatCurrency(summary.todayRev)}</strong></li>
            <li><span>This Week</span><strong>{formatCurrency(summary.weekRev)}</strong></li>
            <li><span>This Month</span><strong>{formatCurrency(summary.monthRev)}</strong></li>
            <li><span>Last Month</span><strong>{formatCurrency(summary.lastMonthRev)}</strong></li>
            <li className="growth"><span>Growth</span><strong className={summary.growth >= 0 ? 'up' : 'down'}>↑ {summary.growth.toFixed(1)}%</strong></li>
          </ul>
          <p className="db-range-note">Selected: {rangeLabel}</p>
          <p className="db-range-note muted">Compared to {prevRangeLabel}</p>
        </div>
      </div>

      <div className="db-tables-row">
        <PanelTable title="Customer Management" actionLabel="View All" search={customerSearch} onSearch={setCustomerSearch}>
          <table className="db-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Engagement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={5} className="db-empty-cell">No customers yet.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="db-user-cell">
                      <span className="db-avatar sm">{getInitials(c.name)}</span>
                      <div><strong>{c.name}</strong><span>{c.city}</span></div>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.orders}</td>
                  <td><MiniSparkline value={c.engagement} /></td>
                  <td><span className={`db-pill ${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelTable>

        <PanelTable title="Order Management" actionLabel="View All" search={orderSearch} onSearch={setOrderSearch}>
          <table className="db-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="db-empty-cell">No orders yet.</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>{formatOrderId(order)}</td>
                  <td>{order.customer?.name || '—'}</td>
                  <td>{getServiceName(order)}</td>
                  <td><span className={statusClass(order.status)}>{order.status || 'Pending'}</span></td>
                  <td>{formatRelativeTime(getOrderDate(order))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelTable>

        <PanelTable
          title="Inventory Management"
          search={inventorySearch}
          onSearch={setInventorySearch}
          footer={<button type="button" className="db-btn db-btn-ghost full">View All Inventory</button>}
        >
          <table className="db-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              {loadingInventory ? (
                <tr><td colSpan={4} className="db-empty-cell">Loading inventory…</td></tr>
              ) : inventoryRows.length === 0 ? (
                <tr><td colSpan={4} className="db-empty-cell">No inventory items.</td></tr>
              ) : inventoryRows.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="db-user-cell">
                      <span className="db-item-icon">📦</span>
                      <strong>{item.name}</strong>
                    </div>
                  </td>
                  <td>{item.currentStock}</td>
                  <td>
                    <span className={`db-pill ${item.currentStock === 0 ? 'danger' : item.isLowStock ? 'warn' : 'success'}`}>
                      {item.currentStock === 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td>{item.lowStockThreshold ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelTable>
      </div>

      <div className="db-bottom-row">
        <div className="db-card">
          <div className="db-card-head"><h3>Low Stock Alerts</h3></div>
          <ul className="db-alert-list">
            {lowStock.length === 0 ? <li className="db-empty-inline">All stock levels look good.</li> : lowStock.map((item) => (
              <li key={item._id}>
                <span className="db-alert-icon warn">⚠</span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.currentStock} {item.unit || 'units'} remaining</span>
                </div>
                <button type="button" className="db-link-btn">Reorder soon</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="db-card">
          <div className="db-card-head"><h3>Upcoming Replenishment</h3></div>
          <ul className="db-alert-list">
            {loadingRefillRequests ? (
              <li className="db-empty-inline">Loading requests…</li>
            ) : upcomingReplenishment.length === 0 ? (
              <li className="db-empty-inline">No pending replenishment.</li>
            ) : upcomingReplenishment.map((req) => (
              <li key={req._id}>
                <span className="db-alert-icon info">📦</span>
                <div>
                  <strong>{req.inventoryItem?.name || req.itemName || 'Item'}</strong>
                  <span>{req.requestedQuantity || req.quantity || '—'} {req.inventoryItem?.unit || 'pcs'} · {req.status}</span>
                </div>
                <em>{formatRelativeTime(req.createdAt)}</em>
              </li>
            ))}
          </ul>
        </div>

        <div className="db-card">
          <div className="db-card-head"><h3>Top Performing Services</h3></div>
          <ul className="db-service-list">
            {topServices.length === 0 ? (
              <li className="db-empty-inline">No service data yet.</li>
            ) : topServices.map((svc) => (
              <li key={svc.name}>
                <div className="db-service-head">
                  <strong>{svc.name}</strong>
                  <span>{formatCurrency(svc.value)}</span>
                </div>
                <div className="db-progress"><span style={{ width: `${svc.pct}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="db-card">
          <div className="db-card-head"><h3>Recent Notifications</h3></div>
          <ul className="db-notify-list">
            {notifications.length === 0 ? (
              <li className="db-empty-inline">No recent activity.</li>
            ) : notifications.map((n) => (
              <li key={n.id}>
                <span className={`db-notify-icon ${n.type}`}>
                  {n.type === 'order' ? '🛒' : n.type === 'refill' ? '📦' : '⚠'}
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <span>{n.sub}</span>
                </div>
                <em>{formatRelativeTime(n.time)}</em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
