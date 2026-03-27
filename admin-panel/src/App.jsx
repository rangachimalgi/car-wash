import React, { useState, useEffect } from 'react'
import './App.css'

// API configuration for dev and prod
// - Set VITE_API_URL at build time to override (e.g. in .env: VITE_API_URL=https://your-api.com/api)
// - Or inject at runtime: window.__API_BASE_URL__ = 'https://your-api.com/api' in index.html before app loads
// - Production build (npm run build) without either uses the same backend as the customer app (Render)
const API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://car-wash-vbry.onrender.com/api' : 'http://localhost:8000/api')
const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '')
const DEFAULT_PACKAGE_CARD = {
  name: '',
  description: '',
  image: '',
  times: 2,
  price: '',
  addOnServiceIds: [],
  coverageIncluded: [],
  coverageNotIncluded: [],
}

function App() {
  const [activeTab, setActiveTab] = useState('services') // 'services', 'addons', 'coverage', 'orders', 'reviews', 'attendance', 'inventory', 'media'
  
  // Services form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CarWash',
    basePrice: '',
    duration: '30 mins',
    image: '',
    images: '',
    rating: '0',
    totalReviews: '0',
    isActive: true,
    packages: {
      monthly: [],
      quarterly: [],
      yearly: [],
    },
  })

  // Add-On form data
  const [addOnFormData, setAddOnFormData] = useState({
    name: '',
    basePrice: '',
    isActive: true,
    applicableFor: [], // Array for CarWash, BikeWash, or both
  })

  // Coverage form data
  const [coverageFormData, setCoverageFormData] = useState({
    name: '',
    isActive: true,
    applicableFor: [], // Array for CarWash, BikeWash, or both
  })

  const [availableAddOns, setAvailableAddOns] = useState([])
  const [allAddOns, setAllAddOns] = useState([]) // All add-ons for listing
  const [addOnFilter, setAddOnFilter] = useState('all') // 'all', 'car', 'bike'
  const [availableCoverage, setAvailableCoverage] = useState([])
  const [allCoverage, setAllCoverage] = useState([]) // All coverage items for listing
  const [coverageFilter, setCoverageFilter] = useState('all') // 'all', 'car', 'bike'
  const [selectedCoverage, setSelectedCoverage] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingAddOn, setLoadingAddOn] = useState(false)
  const [loadingAddOns, setLoadingAddOns] = useState(false)
  const [loadingAllAddOns, setLoadingAllAddOns] = useState(false)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [loadingAllCoverage, setLoadingAllCoverage] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingAllServices, setLoadingAllServices] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [addOnMessage, setAddOnMessage] = useState({ type: '', text: '' })
  const [coverageMessage, setCoverageMessage] = useState({ type: '', text: '' })
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [allServices, setAllServices] = useState([])
  const [serviceFilter, setServiceFilter] = useState('car') // 'all', 'car', 'bike'
  const [serviceSearch, setServiceSearch] = useState('') // Search query
  const [editingServiceId, setEditingServiceId] = useState(null) // Track which service is being edited
  const [servicesError, setServicesError] = useState('')
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('adminAuthToken') || '')
  
  // Time Slots state
  const [timeSlots, setTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [timeSlotsError, setTimeSlotsError] = useState('')
  const [editingTimeSlotId, setEditingTimeSlotId] = useState(null)
  const [timeSlotFormData, setTimeSlotFormData] = useState({
    time: '',
    startTime: '',
    endTime: '',
    order: '',
    isActive: true,
  })
  const [timeSlotMessage, setTimeSlotMessage] = useState({ type: '', text: '' })
  
  // Daily slot override state
  const [selectedOverrideDate, setSelectedOverrideDate] = useState('')
  const [dailyOverrideSlots, setDailyOverrideSlots] = useState([])
  const [loadingDailyOverride, setLoadingDailyOverride] = useState(false)
  const [dailyOverrideMessage, setDailyOverrideMessage] = useState({ type: '', text: '' })
  const [defaultSlotsCount, setDefaultSlotsCount] = useState(10)
  const [defaultStartHour, setDefaultStartHour] = useState(9)
  
  // Attendance state
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all')
  const [documentViewEmployee, setDocumentViewEmployee] = useState(null)
  const [documentViewUrls, setDocumentViewUrls] = useState(null)
  const [loadingDocumentView, setLoadingDocumentView] = useState(false)

  // Inventory state
  const [inventory, setInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState('all') // 'all', 'lowStock', or category
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all')
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    category: 'Soap',
    currentStock: '',
    unit: 'units',
    lowStockThreshold: '',
    description: '',
    supplier: '',
  })
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [inventoryMessage, setInventoryMessage] = useState({ type: '', text: '' })
  const [stockUpdateModal, setStockUpdateModal] = useState({ open: false, item: null, quantity: '', operation: 'add' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOpen, setNavOpen] = useState({ customer: true, employees: true })

  // Media (testimonials, transformations, see the difference)
  const [mediaList, setMediaList] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [mediaMessage, setMediaMessage] = useState({ type: '', text: '' })
  const [mediaForm, setMediaForm] = useState({ type: 'testimonials', name: '', file: null })
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [seeDiffFiles, setSeeDiffFiles] = useState({ image1: null, image2: null, image3: null })
  const [uploadingSeeDiff, setUploadingSeeDiff] = useState(false)

  // Coupons
  const [coupons, setCoupons] = useState([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' })
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountValue: '',
    perUserLimit: '1',
  })

  // Monthly package pricing config (customer app)
  const [packagePricingForm, setPackagePricingForm] = useState({
    app: 'customer',
    vehicleType: 'car',
    durationDays: 30,
    timeSlots: ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'],
    pricingMatrix: {
      i1_e1_daily: '',
      i1_e1_alternate: '',
      i1_e2_daily: '',
      i1_e2_alternate: '',
      i2_e1_daily: '',
      i2_e1_alternate: '',
      i2_e2_daily: '',
      i2_e2_alternate: '',
    },
    packageCards: [],
  })
  const [loadingPackagePricing, setLoadingPackagePricing] = useState(false)
  const [packagePricingMessage, setPackagePricingMessage] = useState({ type: '', text: '' })

  // Helper function to create fetch options with auth headers
  const getFetchOptions = (options = {}) => {
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...(options.headers || {}),
      },
    }
  }

  // Fetch available add-ons when component mounts
  useEffect(() => {
    fetchAddOns()
    fetchAllAddOns()
    fetchCoverage()
    fetchAllCoverage()
    fetchOrders()
    fetchAllServices()
    fetchEmployees()
    fetchTimeSlots()
  }, [])

  // Fetch time slots when slots tab is active
  useEffect(() => {
    if (activeTab === 'slots') {
      fetchTimeSlots()
    }
  }, [activeTab])

  // Fetch attendance when attendance tab is active or date/employee filter changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance()
    }
  }, [activeTab, attendanceDate, selectedEmployeeId])

  // Fetch inventory when inventory tab is active or filters change
  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory()
    }
  }, [activeTab, inventoryCategoryFilter, inventoryFilter, inventorySearch])

  // Fetch all add-ons for listing
  const fetchAllAddOns = async () => {
    setLoadingAllAddOns(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=AddOn`)
      const data = await response.json()
      if (data.success) {
        setAllAddOns(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching all add-ons:', error)
    } finally {
      setLoadingAllAddOns(false)
    }
  }

  // Fetch all coverage items for listing
  const fetchAllCoverage = async () => {
    setLoadingAllCoverage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=Coverage`)
      const data = await response.json()
      if (data.success) {
        setAllCoverage(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching coverage items:', error)
    } finally {
      setLoadingAllCoverage(false)
    }
  }

  // Filter add-ons based on selected filter
  const filteredAddOns = allAddOns.filter(addOn => {
    if (addOnFilter === 'all') return true
    if (addOnFilter === 'car') {
      // Show add-ons that have CarWash in applicableFor, or if applicableFor is empty/missing (legacy)
      return (addOn.applicableFor && addOn.applicableFor.includes('CarWash')) ||
             (!addOn.applicableFor || addOn.applicableFor.length === 0)
    }
    if (addOnFilter === 'bike') {
      // Show add-ons that have BikeWash in applicableFor, or if applicableFor is empty/missing (legacy)
      return (addOn.applicableFor && addOn.applicableFor.includes('BikeWash')) ||
             (!addOn.applicableFor || addOn.applicableFor.length === 0)
    }
    return true
  })

  // Filter coverage based on selected filter
  const filteredCoverage = allCoverage.filter(item => {
    if (coverageFilter === 'all') return true
    if (coverageFilter === 'car') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('CarWash')
    }
    if (coverageFilter === 'bike') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('BikeWash')
    }
    return true
  })

  // For package creation: only CarWash applicable items
  const packageCarWashAddOns = allAddOns.filter((addOn) =>
    Array.isArray(addOn.applicableFor) && addOn.applicableFor.includes('CarWash')
  )
  const packageCarWashCoverage = allCoverage.filter((item) =>
    Array.isArray(item.applicableFor) && item.applicableFor.includes('CarWash')
  )

  useEffect(() => {
    // Refetch add-ons filtered by category
    fetchAddOns()
    setSelectedCoverage([])
    fetchCoverage()
  }, [formData.category])

  // Refresh add-ons list when add-on is created
  useEffect(() => {
    if (activeTab === 'addons') {
      fetchAllAddOns()
    }
  }, [addOnMessage.text, activeTab])

  useEffect(() => {
    if (activeTab === 'coverage') {
      fetchAllCoverage()
    }
  }, [coverageMessage.text, activeTab])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    }
    if (activeTab === 'reviews') {
      fetchReviews()
    }
    if (activeTab === 'services') {
      fetchAllServices()
    }
    if (activeTab === 'coupons') {
      fetchCoupons()
    }
    if (activeTab === 'media') {
      fetchMedia()
    }
    if (activeTab === 'dailyCleaningServices' || activeTab === 'packages') {
      fetchPackagePricing()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'services' && serviceFilter === 'all') {
      setServiceFilter('car')
    }
  }, [activeTab, serviceFilter])

  const fetchAddOns = async () => {
    setLoadingAddOns(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=AddOn`)
      const data = await response.json()
      if (data.success) {
        let addOns = data.data || []
        
        // Filter add-ons based on selected service category (only if creating a service)
        if (activeTab === 'services' && formData.category) {
          addOns = addOns.filter(addOn => {
            // Show add-on if it's applicable for the selected category
            // Also show add-ons without applicableFor (legacy data) - they'll appear for both
            if (!addOn.applicableFor || addOn.applicableFor.length === 0) {
              return true // Show legacy add-ons for all categories
            }
            return addOn.applicableFor.includes(formData.category)
          })
        }
        
        setAvailableAddOns(addOns)
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error)
    } finally {
      setLoadingAddOns(false)
    }
  }

  const fetchCoverage = async () => {
    setLoadingCoverage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=Coverage`)
      const data = await response.json()
      if (data.success) {
        let items = data.data || []
        if (activeTab === 'services' && formData.category) {
          items = items.filter(item =>
            Array.isArray(item.applicableFor) && item.applicableFor.includes(formData.category)
          )
        }
        setAvailableCoverage(items)
      }
    } catch (error) {
      console.error('Error fetching coverage items:', error)
    } finally {
      setLoadingCoverage(false)
    }
  }

  const fetchPackagePricing = async () => {
    setLoadingPackagePricing(true)
    setPackagePricingMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_BASE_URL}/package-pricing?app=customer&vehicleType=car`)
      const data = await response.json()
      if (data.success && data.data) {
        const cfg = data.data
        setPackagePricingForm({
          app: cfg.app || 'customer',
          vehicleType: cfg.vehicleType || 'car',
          durationDays: Number(cfg.durationDays || 30),
          timeSlots: Array.isArray(cfg.timeSlots) && cfg.timeSlots.length > 0
            ? cfg.timeSlots
            : ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'],
          pricingMatrix: {
            i1_e1_daily: cfg.pricingMatrix?.i1_e1_daily ?? '',
            i1_e1_alternate: cfg.pricingMatrix?.i1_e1_alternate ?? '',
            i1_e2_daily: cfg.pricingMatrix?.i1_e2_daily ?? '',
            i1_e2_alternate: cfg.pricingMatrix?.i1_e2_alternate ?? '',
            i2_e1_daily: cfg.pricingMatrix?.i2_e1_daily ?? '',
            i2_e1_alternate: cfg.pricingMatrix?.i2_e1_alternate ?? '',
            i2_e2_daily: cfg.pricingMatrix?.i2_e2_daily ?? '',
            i2_e2_alternate: cfg.pricingMatrix?.i2_e2_alternate ?? '',
          },
          packageCards: Array.isArray(cfg.packageCards)
            ? cfg.packageCards.map((card, index) => ({
              name: card?.name ?? '',
              description: card?.description ?? '',
              image: card?.image ?? '',
              times: Number(card?.times || 0) || index + 1,
              price: card?.price ?? '',
              addOnServiceIds: Array.isArray(card?.addOnServiceIds) ? card.addOnServiceIds : [],
              coverageIncluded: Array.isArray(card?.coverageIncluded) ? card.coverageIncluded : [],
              coverageNotIncluded: Array.isArray(card?.coverageNotIncluded) ? card.coverageNotIncluded : [],
            }))
            : [],
        })
      } else {
        setPackagePricingMessage({ type: 'error', text: data.message || 'Failed to load package pricing.' })
      }
    } catch (error) {
      console.error('Error fetching package pricing:', error)
      setPackagePricingMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingPackagePricing(false)
    }
  }

  const handlePackagePricingSubmit = async (e) => {
    e.preventDefault()
    setLoadingPackagePricing(true)
    setPackagePricingMessage({ type: '', text: '' })

    try {
      const payload = {
        app: packagePricingForm.app,
        vehicleType: packagePricingForm.vehicleType,
        durationDays: Number(packagePricingForm.durationDays || 30),
        timeSlots: (packagePricingForm.timeSlots || []).map((slot) => String(slot || '').trim()).filter(Boolean),
        pricingMatrix: Object.entries(packagePricingForm.pricingMatrix || {}).reduce((acc, [key, value]) => {
          acc[key] = Number(value || 0)
          return acc
        }, {}),
        packageCards: (packagePricingForm.packageCards || []).map((card, index) => ({
          name: String(card.name || '').trim(),
          description: String(card.description || '').trim(),
          image: String(card.image || '').trim(),
          times: Number(card.times || index + 1),
          price: Number(card.price || 0),
          addOnServiceIds: Array.isArray(card.addOnServiceIds) ? card.addOnServiceIds : [],
          coverageIncluded: Array.isArray(card.coverageIncluded) ? card.coverageIncluded : [],
          coverageNotIncluded: Array.isArray(card.coverageNotIncluded) ? card.coverageNotIncluded : [],
        })),
      }

      const response = await fetch(`${API_BASE_URL}/package-pricing`, getFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      }))
      const data = await response.json()
      if (data.success) {
        setPackagePricingMessage({ type: 'success', text: 'Package pricing saved successfully.' })
        fetchPackagePricing()
      } else {
        setPackagePricingMessage({ type: 'error', text: data.message || 'Failed to save package pricing.' })
      }
    } catch (error) {
      console.error('Error saving package pricing:', error)
      setPackagePricingMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingPackagePricing(false)
    }
  }

  const addPackageCardRow = () => {
    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: [
        ...(prev.packageCards || []),
        { ...DEFAULT_PACKAGE_CARD, times: (prev.packageCards?.length || 1) + 1 },
      ],
    }))
  }

  const updatePackageCardRow = (index, field, value) => {
    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: (prev.packageCards || []).map((card, idx) =>
        idx === index ? { ...card, [field]: value } : card
      ),
    }))
  }

  const removePackageCardRow = (index) => {
    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: (prev.packageCards || []).filter((_, idx) => idx !== index),
    }))
  }

  const clearAllPackageCards = () => {
    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: [],
    }))
  }

  const clearAllPackageCardsAndSave = async () => {
    setLoadingPackagePricing(true)
    setPackagePricingMessage({ type: '', text: '' })
    try {
      const payload = {
        app: packagePricingForm.app,
        vehicleType: packagePricingForm.vehicleType,
        durationDays: Number(packagePricingForm.durationDays || 30),
        timeSlots: (packagePricingForm.timeSlots || []).map((slot) => String(slot || '').trim()).filter(Boolean),
        pricingMatrix: Object.entries(packagePricingForm.pricingMatrix || {}).reduce((acc, [key, value]) => {
          acc[key] = Number(value || 0)
          return acc
        }, {}),
        packageCards: [],
      }

      const response = await fetch(`${API_BASE_URL}/package-pricing`, getFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      }))
      const data = await response.json()
      if (data.success) {
        setPackagePricingForm((prev) => ({ ...prev, packageCards: [] }))
        setPackagePricingMessage({ type: 'success', text: 'All packages cleared successfully.' })
      } else {
        setPackagePricingMessage({ type: 'error', text: data.message || 'Failed to clear packages.' })
      }
    } catch (error) {
      setPackagePricingMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingPackagePricing(false)
    }
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      // Use admin route that doesn't require authentication
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
      } else {
        console.error('Error fetching orders:', data.message || 'Unknown error')
        setMessage({ type: 'error', text: data.message || 'Error fetching orders' })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setMessage({ type: 'error', text: `Network error: ${error.message}. Check if server is running on ${API_BASE_URL}` })
    } finally {
      setLoadingOrders(false)
    }
  }

  // Credit customer wallet from admin panel
  const creditCustomerWallet = async ({ phone, amount, note }) => {
    const numericAmount = Number(amount)
    if (!phone || !numericAmount || numericAmount <= 0) {
      window.alert('Phone and a positive amount are required.')
      return null
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(phone)}/wallet/credit`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          amount: numericAmount,
          note: note || '',
        }),
      }))

      const data = await res.json()
      if (!data.success) {
        console.error('Error crediting wallet:', data.message || data.error)
        window.alert(data.message || 'Failed to credit wallet.')
        return null
      }

      return data.data || {}
    } catch (error) {
      console.error('Network error crediting wallet:', error)
      window.alert(`Network error: ${error.message}`)
      return null
    }
  }

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/reviews`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.data || [])
      } else {
        setMessage({ type: 'error', text: data.message || 'Error fetching reviews' })
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingReviews(false)
    }
  }

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch(`${API_BASE_URL}/employees`)
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Get employee info by employeeId
  const getEmployeeInfo = (employeeId) => {
    return employees.find(emp => emp.employeeId === employeeId) || null
  }

  const openEmployeeDocuments = async (employee) => {
    setDocumentViewEmployee(employee)
    setDocumentViewUrls(null)
    setLoadingDocumentView(true)
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employee.employeeId}/documents`)
      const data = await res.json()
      if (data.success && data.data) {
        setDocumentViewUrls(data.data)
      } else {
        setDocumentViewUrls({ aadharUrl: null, panUrl: null })
      }
    } catch (e) {
      console.error(e)
      setDocumentViewUrls({ aadharUrl: null, panUrl: null })
    } finally {
      setLoadingDocumentView(false)
    }
  }

  const closeDocumentView = () => {
    setDocumentViewEmployee(null)
    setDocumentViewUrls(null)
  }

  // Fetch attendance data
  const fetchAttendance = async () => {
    setLoadingAttendance(true)
    try {
      // Fetch employees first if not already loaded
      if (employees.length === 0) {
        await fetchEmployees()
      }

      let url = `${API_BASE_URL}/attendance/admin/all?date=${attendanceDate}`
      if (selectedEmployeeId !== 'all') {
        url += `&employeeId=${selectedEmployeeId}`
      }
      
      console.log('Fetching attendance from:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('Attendance response:', data)
      if (data.success) {
        setAttendance(data.data || [])
      } else {
        console.error('Error fetching attendance:', data.message || 'Unknown error')
        setAttendance([])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendance([])
    } finally {
      setLoadingAttendance(false)
    }
  }

  // Calculate attendance summary
  const getAttendanceSummary = () => {
    const totalEmployees = employees.length
    const present = attendance.filter(a => a.checkIn).length
    const absent = totalEmployees - present
    
    return { total: totalEmployees, present, absent }
  }

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Fetch inventory items
  const fetchInventory = async () => {
    setLoadingInventory(true)
    try {
      let url = `${API_BASE_URL}/inventory`
      const params = []
      
      if (inventoryCategoryFilter !== 'all') {
        params.push(`category=${inventoryCategoryFilter}`)
      }
      if (inventoryFilter === 'lowStock') {
        params.push('lowStock=true')
      }
      if (inventorySearch) {
        params.push(`search=${encodeURIComponent(inventorySearch)}`)
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&')
      }
      
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setInventory(data.data || [])
      } else {
        console.error('Error fetching inventory:', data.message)
        setInventoryMessage({ type: 'error', text: data.message || 'Error fetching inventory' })
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventoryMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle inventory form change
  const handleInventoryChange = (e) => {
    const { name, value } = e.target
    setInventoryFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle inventory form submit
  const handleInventorySubmit = async (e) => {
    e.preventDefault()
    setLoadingInventory(true)
    setInventoryMessage({ type: '', text: '' })

    try {
      const inventoryData = {
        name: inventoryFormData.name.trim(),
        category: inventoryFormData.category,
        currentStock: Number(inventoryFormData.currentStock),
        unit: inventoryFormData.unit.trim(),
        lowStockThreshold: Number(inventoryFormData.lowStockThreshold),
        description: inventoryFormData.description.trim(),
        supplier: inventoryFormData.supplier.trim(),
      }

      const url = editingInventoryId 
        ? `${API_BASE_URL}/inventory/${editingInventoryId}`
        : `${API_BASE_URL}/inventory`
      const method = editingInventoryId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ 
          type: 'success', 
          text: editingInventoryId ? 'Inventory item updated successfully!' : 'Inventory item created successfully!' 
        })
        // Reset form
        setInventoryFormData({
          name: '',
          category: 'Soap',
          currentStock: '',
          unit: 'units',
          lowStockThreshold: '',
          description: '',
          supplier: '',
        })
        setEditingInventoryId(null)
        // Refresh inventory list
        fetchInventory()
      } else {
        setInventoryMessage({ 
          type: 'error', 
          text: data.message || (editingInventoryId ? 'Failed to update item' : 'Failed to create item')
        })
      }
    } catch (error) {
      console.error('Error saving inventory item:', error)
      setInventoryMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle edit inventory item
  const handleEditInventory = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const item = data.data
        setEditingInventoryId(itemId)
        setInventoryFormData({
          name: item.name || '',
          category: item.category || 'Soap',
          currentStock: String(item.currentStock || ''),
          unit: item.unit || 'units',
          lowStockThreshold: String(item.lowStockThreshold || ''),
          description: item.description || '',
          supplier: item.supplier || '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error loading inventory item for edit:', error)
      setInventoryMessage({ type: 'error', text: 'Failed to load item data' })
    }
  }

  // Handle new inventory item
  const handleNewInventory = () => {
    setEditingInventoryId(null)
    setInventoryFormData({
      name: '',
      category: 'Soap',
      currentStock: '',
      unit: 'units',
      lowStockThreshold: '',
      description: '',
      supplier: '',
    })
  }

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!stockUpdateModal.item || !stockUpdateModal.quantity || Number(stockUpdateModal.quantity) <= 0) {
      setInventoryMessage({ type: 'error', text: 'Please enter a valid quantity' })
      return
    }

    setLoadingInventory(true)
    setInventoryMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${stockUpdateModal.item._id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: Number(stockUpdateModal.quantity),
          operation: stockUpdateModal.operation,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ type: 'success', text: data.message || 'Stock updated successfully!' })
        setStockUpdateModal({ open: false, item: null, quantity: '', operation: 'add' })
        fetchInventory()
      } else {
        setInventoryMessage({ type: 'error', text: data.message || 'Failed to update stock' })
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      setInventoryMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle delete inventory item
  const handleDeleteInventory = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    setLoadingInventory(true)
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ type: 'success', text: 'Inventory item deleted successfully!' })
        fetchInventory()
      } else {
        setInventoryMessage({ type: 'error', text: data.message || 'Failed to delete item' })
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      setInventoryMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Filter inventory items
  const filteredInventory = inventory.filter(item => {
    if (inventoryCategoryFilter !== 'all' && item.category !== inventoryCategoryFilter) {
      return false
    }
    if (inventoryFilter === 'lowStock' && !item.isLowStock) {
      return false
    }
    if (inventorySearch && !item.name.toLowerCase().includes(inventorySearch.toLowerCase())) {
      return false
    }
    return true
  })

  // Get inventory summary
  const getInventorySummary = () => {
    const totalItems = inventory.length
    const lowStockItems = inventory.filter(item => item.isLowStock).length
    const totalStockValue = inventory.reduce((sum, item) => sum + item.currentStock, 0)
    
    return { totalItems, lowStockItems, totalStockValue }
  }

  // Fetch all time slots
  const fetchTimeSlots = async () => {
    setLoadingTimeSlots(true)
    setTimeSlotsError('')
    try {
      const response = await fetch(`${API_BASE_URL}/slots/times/all`)
      const data = await response.json()
      if (data.success) {
        setTimeSlots(data.data || [])
      } else {
        setTimeSlotsError(data.message || 'Failed to load time slots')
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setTimeSlotsError(`Cannot reach backend: ${error.message}`)
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  // Handle time slot form change
  const handleTimeSlotChange = (e) => {
    const { name, value, type, checked } = e.target
    setTimeSlotFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle time slot submit
  const handleTimeSlotSubmit = async (e) => {
    e.preventDefault()
    setTimeSlotMessage({ type: '', text: '' })

    try {
      const slotData = {
        time: timeSlotFormData.time.trim(),
        startTime: timeSlotFormData.startTime.trim(),
        endTime: timeSlotFormData.endTime.trim(),
        order: timeSlotFormData.order ? parseInt(timeSlotFormData.order) : undefined,
        isActive: timeSlotFormData.isActive,
      }

      const url = editingTimeSlotId 
        ? `${API_BASE_URL}/slots/times/${editingTimeSlotId}`
        : `${API_BASE_URL}/slots/times`
      const method = editingTimeSlotId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTimeSlotMessage({ 
          type: 'success', 
          text: editingTimeSlotId ? 'Time slot updated successfully!' : 'Time slot created successfully!' 
        })
        // Reset form
        setTimeSlotFormData({
          time: '',
          startTime: '',
          endTime: '',
          order: '',
          isActive: true,
        })
        setEditingTimeSlotId(null)
        // Refresh slots list
        fetchTimeSlots()
      } else {
        setTimeSlotMessage({ 
          type: 'error', 
          text: data.message || (editingTimeSlotId ? 'Failed to update slot' : 'Failed to create slot')
        })
      }
    } catch (error) {
      console.error('Error saving time slot:', error)
      setTimeSlotMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    }
  }

  // Handle edit time slot
  const handleEditTimeSlot = (slotId) => {
    const slot = timeSlots.find(s => s._id === slotId)
    if (slot) {
      setEditingTimeSlotId(slotId)
      setTimeSlotFormData({
        time: slot.time || '',
        startTime: slot.startTime || '',
        endTime: slot.endTime || '',
        order: String(slot.order || ''),
        isActive: slot.isActive !== undefined ? slot.isActive : true,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle new time slot
  const handleNewTimeSlot = () => {
    setEditingTimeSlotId(null)
    setTimeSlotFormData({
      time: '',
      startTime: '',
      endTime: '',
      order: '',
      isActive: true,
    })
  }

  // Handle delete time slot
  const handleDeleteTimeSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot? This cannot be undone if there are active orders using it.')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/slots/times/${slotId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTimeSlotMessage({ type: 'success', text: 'Time slot deleted successfully!' })
        fetchTimeSlots()
      } else {
        setTimeSlotMessage({ type: 'error', text: data.message || 'Failed to delete time slot' })
      }
    } catch (error) {
      console.error('Error deleting time slot:', error)
      setTimeSlotMessage({ type: 'error', text: error.message || 'Network error' })
    }
  }

  // Generate default slots (10 slots, 1 hour each)
  const generateDefaultSlots = (count, startHour) => {
    const slots = []
    for (let i = 0; i < count; i++) {
      const hour = startHour + i
      const nextHour = hour + 1
      const start12h = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`
      const end12h = nextHour > 12 ? `${nextHour - 12}:00 PM` : nextHour === 12 ? '12:00 PM' : `${nextHour}:00 AM`
      const start24h = String(hour).padStart(2, '0') + ':00'
      const end24h = String(nextHour).padStart(2, '0') + ':00'
      
      slots.push({
        time: `${start12h} - ${end12h}`,
        startTime: start24h,
        endTime: end24h,
        order: i + 1,
      })
    }
    return slots
  }

  // Reset to default slots
  const handleResetToDefaults = async () => {
    if (!window.confirm(`This will delete all existing slots and create ${defaultSlotsCount} default slots starting from ${defaultStartHour}:00. Continue?`)) {
      return
    }

    setLoadingTimeSlots(true)
    setTimeSlotMessage({ type: '', text: '' })

    try {
      // Get all existing slots
      const existingResponse = await fetch(`${API_BASE_URL}/slots/times/all`)
      const existingData = await existingResponse.json()
      
      if (existingData.success) {
        // Delete all existing slots
        for (const slot of existingData.data) {
          try {
            await fetch(`${API_BASE_URL}/slots/times/${slot._id}`, { method: 'DELETE' })
          } catch (e) {
            console.warn('Error deleting slot:', e)
          }
        }
      }

      // Create new default slots
      const defaultSlots = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
      let successCount = 0

      for (const slot of defaultSlots) {
        try {
          const response = await fetch(`${API_BASE_URL}/slots/times`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...slot,
              isActive: true,
            }),
          })
          if (response.ok) successCount++
        } catch (e) {
          console.error('Error creating slot:', e)
        }
      }

      setTimeSlotMessage({ 
        type: 'success', 
        text: `Successfully created ${successCount} default slots!` 
      })
      fetchTimeSlots()
    } catch (error) {
      console.error('Error resetting slots:', error)
      setTimeSlotMessage({ type: 'error', text: error.message || 'Failed to reset slots' })
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  // Load daily override for a date
  const loadDailyOverride = async (date) => {
    if (!date) {
      setDailyOverrideSlots([])
      return
    }

    setLoadingDailyOverride(true)
    setDailyOverrideMessage({ type: '', text: '' })

    try {
      const dateStr = new Date(date).toISOString().split('T')[0]
      const response = await fetch(`${API_BASE_URL}/slots/daily/${dateStr}`)
      const data = await response.json()

      if (data.success) {
        if (data.data && data.data.slots && data.data.slots.length > 0) {
          // Override exists, use it
          setDailyOverrideSlots(data.data.slots.map(s => ({
            time: s.time,
            startTime: s.startTime,
            endTime: s.endTime,
            order: s.order || 0,
          })))
        } else {
          // No override, load default slots
          const slotsResponse = await fetch(`${API_BASE_URL}/slots/times`)
          const slotsData = await slotsResponse.json()
          if (slotsData.success && slotsData.data) {
            setDailyOverrideSlots(slotsData.data.map(s => ({
              time: s.time,
              startTime: s.startTime,
              endTime: s.endTime,
              order: s.order || 0,
            })))
          } else {
            // Fallback to generated defaults
            const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
            setDailyOverrideSlots(defaults)
          }
        }
      }
    } catch (error) {
      console.error('Error loading daily override:', error)
      setDailyOverrideMessage({ type: 'error', text: error.message || 'Failed to load daily override' })
      // On error, use generated defaults
      const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
      setDailyOverrideSlots(defaults)
    } finally {
      setLoadingDailyOverride(false)
    }
  }

  // Get time slots from API
  const getTimeSlotsFromDB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/slots/times`)
      const data = await response.json()
      return data.success ? data.data : []
    } catch (error) {
      return []
    }
  }

  // Save daily override
  const handleSaveDailyOverride = async (e) => {
    e.preventDefault()
    if (!selectedOverrideDate) {
      setDailyOverrideMessage({ type: 'error', text: 'Please select a date' })
      return
    }

    setLoadingDailyOverride(true)
    setDailyOverrideMessage({ type: '', text: '' })

    try {
      const dateStr = new Date(selectedOverrideDate).toISOString().split('T')[0]
      const response = await fetch(`${API_BASE_URL}/slots/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          slots: dailyOverrideSlots,
          isActive: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDailyOverrideMessage({ type: 'success', text: 'Daily slot override saved successfully!' })
      } else {
        setDailyOverrideMessage({ type: 'error', text: data.message || 'Failed to save override' })
      }
    } catch (error) {
      console.error('Error saving daily override:', error)
      setDailyOverrideMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingDailyOverride(false)
    }
  }

  // Delete daily override
  const handleDeleteDailyOverride = async () => {
    if (!selectedOverrideDate) return
    if (!window.confirm('Delete override for this date? It will revert to default slots.')) return

    setLoadingDailyOverride(true)
    try {
      const dateStr = new Date(selectedOverrideDate).toISOString().split('T')[0]
      const response = await fetch(`${API_BASE_URL}/slots/daily/${dateStr}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDailyOverrideMessage({ type: 'success', text: 'Override deleted! Using default slots.' })
        setDailyOverrideSlots([])
        setSelectedOverrideDate('')
      } else {
        setDailyOverrideMessage({ type: 'error', text: data.message || 'Failed to delete override' })
      }
    } catch (error) {
      console.error('Error deleting override:', error)
      setDailyOverrideMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingDailyOverride(false)
    }
  }

  // Add/remove slots for daily override
  const addSlotToOverride = () => {
    const hour = dailyOverrideSlots.length > 0 
      ? parseInt(dailyOverrideSlots[dailyOverrideSlots.length - 1].endTime.split(':')[0])
      : defaultStartHour
    const nextHour = hour + 1
    const start12h = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`
    const end12h = nextHour > 12 ? `${nextHour - 12}:00 PM` : nextHour === 12 ? '12:00 PM' : `${nextHour}:00 AM`
    const start24h = String(hour).padStart(2, '0') + ':00'
    const end24h = String(nextHour).padStart(2, '0') + ':00'

    setDailyOverrideSlots([...dailyOverrideSlots, {
      time: `${start12h} - ${end12h}`,
      startTime: start24h,
      endTime: end24h,
      order: dailyOverrideSlots.length + 1,
    }])
  }

  const removeSlotFromOverride = (index) => {
    setDailyOverrideSlots(dailyOverrideSlots.filter((_, i) => i !== index).map((slot, idx) => ({
      ...slot,
      order: idx + 1,
    })))
  }

  // Fetch all services for listing
  const fetchAllServices = async () => {
    setLoadingAllServices(true)
    setServicesError('')
    try {
      const response = await fetch(`${API_BASE_URL}/services?isActive=true`)
      const data = await response.json()
      if (data.success) {
        // Filter to only CarWash and BikeWash services
        const services = (data.data || []).filter(s => s.category === 'CarWash' || s.category === 'BikeWash')
        setAllServices(services)
      } else {
        setServicesError(data.message || 'Failed to load services')
      }
    } catch (error) {
      console.error('Error fetching all services:', error)
      setServicesError(
        `Cannot reach backend at ${API_BASE_URL}. Is the server running? (${error.message})`
      )
    } finally {
      setLoadingAllServices(false)
    }
  }

  // Filter services based on selected filter and search
  const filteredServices = allServices.filter(service => {
    // Category filter
    if (serviceFilter === 'car' && service.category !== 'CarWash') return false
    if (serviceFilter === 'bike' && service.category !== 'BikeWash') return false
    
    // Search filter
    if (serviceSearch) {
      const searchLower = serviceSearch.toLowerCase()
      const matchesName = service.name?.toLowerCase().includes(searchLower)
      const matchesDescription = service.description?.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesDescription) return false
    }
    
    return true
  })

  const markOrderDelivered = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, getFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' }),
      }))
      const data = await response.json()
      if (data.success) {
        setOrders(prev => prev.map(order => (
          order._id === orderId ? data.data : order
        )))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleAddOnChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Handle applicableFor checkboxes separately
    if (name === 'applicableFor') {
      setAddOnFormData(prev => {
        const current = prev.applicableFor || []
        if (checked) {
          return { ...prev, applicableFor: [...current, value] }
        } else {
          return { ...prev, applicableFor: current.filter(cat => cat !== value) }
        }
      })
    } else {
      setAddOnFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleCoverageChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'applicableFor') {
      setCoverageFormData(prev => {
        const current = prev.applicableFor || []
        if (checked) {
          return { ...prev, applicableFor: [...current, value] }
        } else {
          return { ...prev, applicableFor: current.filter(cat => cat !== value) }
        }
      })
    } else {
      setCoverageFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const toggleCoverage = (coverageName) => {
    setSelectedCoverage(prev => {
      if (prev.includes(coverageName)) {
        return prev.filter(name => name !== coverageName)
      }
      return [...prev, coverageName]
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addPackageRow = (packageType) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageType]: [
          ...(prev.packages?.[packageType] || []),
          { times: '', price: '' }
        ],
      },
    }))
  }

  const updatePackageRow = (packageType, index, field, value) => {
    setFormData(prev => {
      const rows = [...(prev.packages?.[packageType] || [])]
      rows[index] = { ...rows[index], [field]: value }
      return {
        ...prev,
        packages: {
          ...prev.packages,
          [packageType]: rows,
        },
      }
    })
  }

  const removePackageRow = (packageType, index) => {
    setFormData(prev => {
      const rows = [...(prev.packages?.[packageType] || [])]
      rows.splice(index, 1)
      return {
        ...prev,
        packages: {
          ...prev.packages,
          [packageType]: rows,
        },
      }
    })
  }

  const calculatePackageValues = (timesValue, priceValue) => {
    const times = parseInt(timesValue)
    const price = parseFloat(priceValue)
    if (!times || Number.isNaN(price)) {
      return { perWash: '', discount: '' }
    }

    const perWash = price / times
    const basePrice = parseFloat(formData.basePrice)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return { perWash, discount: '' }
    }

    const originalTotal = basePrice * times
    const discount = Math.max(0, ((originalTotal - price) / originalTotal) * 100)
    return { perWash, discount }
  }

  const renderPackageSection = (title, packageType) => {
    const rows = formData.packages?.[packageType] || []
    return (
      <div className="form-group">
        <div className="section-header">
          <h3 className="section-title">{title}</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => addPackageRow(packageType)}
          >
            Add Row
          </button>
        </div>
        {rows.length === 0 ? (
          <div className="info-text">No packages added yet.</div>
        ) : (
          <div className="packages-grid">
            {rows.map((row, index) => (
              <div key={`${packageType}-${index}`} className="package-row">
                <input
                  type="number"
                  min="1"
                  placeholder="Times"
                  value={row.times}
                  onChange={(e) => updatePackageRow(packageType, index, 'times', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Total Price"
                  value={row.price}
                  onChange={(e) => updatePackageRow(packageType, index, 'price', e.target.value)}
                />
                {(() => {
                  const { perWash, discount } = calculatePackageValues(row.times, row.price)
                  const perWashDisplay = perWash === '' ? '' : perWash.toFixed(2)
                  const discountDisplay = discount === '' ? '' : discount.toFixed(1)
                  return (
                    <>
                      <input
                        type="text"
                        placeholder="Discount %"
                        value={discountDisplay}
                        readOnly
                        disabled
                      />
                      <input
                        type="text"
                        placeholder="Per Wash"
                        value={perWashDisplay}
                        readOnly
                        disabled
                      />
                    </>
                  )
                })()}
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => removePackageRow(packageType, index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <small className="help-text">Times = washes per period. Price = total for the package.</small>
      </div>
    )
  }

  // Load service data into form for editing
  const handleEditService = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const service = data.data
        setEditingServiceId(serviceId)
        
        // Format packages: convert from API format (with perWash, discount) to form format (times, price)
        const formatPackagesForForm = (pkg) => {
          if (!pkg) return { monthly: [], quarterly: [], yearly: [] }
          
          return {
            monthly: (pkg.monthly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
            quarterly: (pkg.quarterly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
            yearly: (pkg.yearly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
          }
        }
        
        // Populate form with service data
        setFormData({
          name: service.name || '',
          description: service.description || '',
          category: service.category || 'CarWash',
          basePrice: String(service.basePrice || ''),
          duration: service.duration || '30 mins',
          image: service.image || '',
          images: (service.images || []).join(', '),
          rating: String(service.rating || 0),
          totalReviews: String(service.totalReviews || 0),
          isActive: service.isActive !== undefined ? service.isActive : true,
          packages: formatPackagesForForm(service.packages),
        })
        
        // Set selected coverage
        if (service.specifications?.coverage) {
          setSelectedCoverage(service.specifications.coverage)
        }
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error loading service for edit:', error)
      setMessage({ type: 'error', text: 'Failed to load service data' })
    }
  }

  // Reset form to create new service
  const handleNewService = () => {
    setEditingServiceId(null)
    setFormData({
      name: '',
      description: '',
      category: 'CarWash',
      basePrice: '',
      duration: '30 mins',
      image: '',
      images: '',
      rating: '0',
      totalReviews: '0',
      isActive: true,
      packages: {
        monthly: [],
        quarterly: [],
        yearly: [],
      },
    })
    setSelectedCoverage([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Parse arrays from comma-separated strings
      const images = formData.images 
        ? formData.images.split(',').map(img => img.trim()).filter(img => img)
        : []

      const coverage = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? selectedCoverage
        : []

      const notIncluded = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? availableCoverage
            .map(item => item.name)
            .filter(name => !selectedCoverage.includes(name))
        : []

      const applicableAddOnIds = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? availableAddOns.map(addOn => addOn._id)
        : []

      const formatPackages = (pkg) => {
        const normalizeRow = (row) => {
          const times = parseInt(row.times)
          const price = parseFloat(row.price)
          const { perWash, discount } = calculatePackageValues(row.times, row.price)

          return {
            times,
            discount: discount === '' ? 0 : Number(discount.toFixed(2)),
            price,
            perWash: perWash === '' ? 0 : Number(perWash.toFixed(2)),
          }
        }

        return {
          monthly: (pkg?.monthly || []).filter(row => row.times && row.price).map(normalizeRow),
          quarterly: (pkg?.quarterly || []).filter(row => row.times && row.price).map(normalizeRow),
          yearly: (pkg?.yearly || []).filter(row => row.times && row.price).map(normalizeRow),
        }
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        basePrice: parseFloat(formData.basePrice),
        duration: formData.duration,
        image: formData.image,
        images: images,
        rating: parseFloat(formData.rating) || 0,
        totalReviews: parseInt(formData.totalReviews) || 0,
        isActive: formData.isActive,
        specifications: {
          coverage: coverage,
          notIncluded: notIncluded,
        },
        addOnServices: applicableAddOnIds, // Auto-attach all applicable add-ons
        packages: formatPackages(formData.packages),
      }

      const url = editingServiceId 
        ? `${API_BASE_URL}/services/${editingServiceId}`
        : `${API_BASE_URL}/services`
      const method = editingServiceId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: editingServiceId ? 'Service updated successfully!' : 'Service created successfully!' 
        })
        // Reset form
        handleNewService()
        // Refresh services list
        fetchAllServices()
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || (editingServiceId ? 'Failed to update service' : 'Failed to create service')
        })
      }
    } catch (error) {
      console.error('Error creating service:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddOnSubmit = async (e) => {
    e.preventDefault()
    setLoadingAddOn(true)
    setAddOnMessage({ type: '', text: '' })

    // Validate applicableFor
    if (!addOnFormData.applicableFor || addOnFormData.applicableFor.length === 0) {
      setAddOnMessage({ 
        type: 'error', 
        text: 'Please select at least one service type (Car Wash or Bike Wash)' 
      })
      setLoadingAddOn(false)
      return
    }

    try {
      const addOnData = {
        name: addOnFormData.name,
        category: 'AddOn', // Always AddOn for add-ons
        basePrice: parseFloat(addOnFormData.basePrice),
        isActive: addOnFormData.isActive,
        applicableFor: addOnFormData.applicableFor || [], // CarWash, BikeWash, or both
        addOnServices: [],
        packages: {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addOnData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAddOnMessage({ type: 'success', text: 'Add-On created successfully!' })
        // Reset form
        setAddOnFormData({
          name: '',
          basePrice: '',
          isActive: true,
          applicableFor: [],
        })
        // Refresh add-ons list
        fetchAddOns()
      } else {
        setAddOnMessage({ 
          type: 'error', 
          text: data.message || 'Failed to create add-on' 
        })
      }
    } catch (error) {
      console.error('Error creating add-on:', error)
      setAddOnMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoadingAddOn(false)
    }
  }

  const handleCoverageSubmit = async (e) => {
    e.preventDefault()
    setLoadingCoverage(true)
    setCoverageMessage({ type: '', text: '' })

    if (!coverageFormData.applicableFor || coverageFormData.applicableFor.length === 0) {
      setCoverageMessage({
        type: 'error',
        text: 'Please select at least one service type (Car Wash or Bike Wash)'
      })
      setLoadingCoverage(false)
      return
    }

    try {
      const coverageData = {
        name: coverageFormData.name,
        category: 'Coverage',
        basePrice: 0,
        isActive: coverageFormData.isActive,
        applicableFor: coverageFormData.applicableFor || [],
        addOnServices: [],
        packages: {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coverageData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCoverageMessage({ type: 'success', text: 'Coverage item created successfully!' })
        setCoverageFormData({
          name: '',
          isActive: true,
          applicableFor: [],
        })
        fetchCoverage()
      } else {
        setCoverageMessage({
          type: 'error',
          text: data.message || 'Failed to create coverage item'
        })
      }
    } catch (error) {
      console.error('Error creating coverage item:', error)
      setCoverageMessage({
        type: 'error',
        text: error.message || 'Network error. Please check if backend is running.'
      })
    } finally {
      setLoadingCoverage(false)
    }
  }

  const fetchMedia = async () => {
    setLoadingMedia(true)
    setMediaMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/media`, getFetchOptions())
      const data = await res.json()
      if (data.success) setMediaList(data.data || [])
      else setMediaMessage({ type: 'error', text: data.message || 'Failed to load media' })
    } catch (e) {
      setMediaMessage({ type: 'error', text: e.message || 'Failed to load media' })
    } finally {
      setLoadingMedia(false)
    }
  }

  const uploadMediaFile = async () => {
    if (!mediaForm.file) {
      setMediaMessage({ type: 'error', text: 'Please select a video file' })
      return
    }
    setUploadingMedia(true)
    setMediaMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('type', mediaForm.type)
      formData.append('name', mediaForm.name)
      formData.append('file', mediaForm.file)
      const opts = getFetchOptions()
      const headers = { ...opts.headers }
      delete headers['Content-Type']
      const res = await fetch(`${API_BASE_URL}/media`, { ...opts, method: 'POST', headers, body: formData })
      const data = await res.json()
      if (data.success) {
        setMediaMessage({ type: 'success', text: 'Uploaded successfully' })
        setMediaForm({ type: mediaForm.type, name: '', file: null })
        fetchMedia()
      } else {
        setMediaMessage({ type: 'error', text: data.message || 'Upload failed' })
      }
    } catch (e) {
      setMediaMessage({ type: 'error', text: e.message || 'Upload failed' })
    } finally {
      setUploadingMedia(false)
    }
  }

  const uploadSeeTheDifference = async () => {
    if (!seeDiffFiles.image1 || !seeDiffFiles.image2 || !seeDiffFiles.image3) {
      setMediaMessage({ type: 'error', text: 'Please select all 3 images' })
      return
    }
    setUploadingSeeDiff(true)
    setMediaMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('image1', seeDiffFiles.image1)
      formData.append('image2', seeDiffFiles.image2)
      formData.append('image3', seeDiffFiles.image3)
      const opts = getFetchOptions()
      const headers = { ...opts.headers }
      delete headers['Content-Type']
      const res = await fetch(`${API_BASE_URL}/media/see-the-difference`, { ...opts, method: 'POST', headers, body: formData })
      const data = await res.json()
      if (data.success) {
        setMediaMessage({ type: 'success', text: 'See The Difference images updated' })
        setSeeDiffFiles({ image1: null, image2: null, image3: null })
        fetchMedia()
      } else {
        setMediaMessage({ type: 'error', text: data.message || 'Upload failed' })
      }
    } catch (e) {
      setMediaMessage({ type: 'error', text: e.message || 'Upload failed' })
    } finally {
      setUploadingSeeDiff(false)
    }
  }

  const deleteMediaItem = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/media/${id}`, { ...getFetchOptions(), method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setMediaMessage({ type: 'success', text: 'Deleted' })
        fetchMedia()
      } else setMediaMessage({ type: 'error', text: data.message || 'Delete failed' })
    } catch (e) {
      setMediaMessage({ type: 'error', text: e.message || 'Delete failed' })
    }
  }

  const fetchCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const res = await fetch(`${API_BASE_URL}/coupons`, getFetchOptions())
      const data = await res.json()
      if (data.success) {
        setCoupons(data.data || [])
      } else {
        setCouponMessage({ type: 'error', text: data.message || 'Failed to load coupons' })
      }
    } catch (e) {
      setCouponMessage({ type: 'error', text: e.message || 'Failed to load coupons' })
    } finally {
      setLoadingCoupons(false)
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    setCouponMessage({ type: '', text: '' })
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: 'FLAT',
        discountValue: Number(couponForm.discountValue || 0),
        perUserLimit: Number(couponForm.perUserLimit || 1),
      }

      if (!payload.code || payload.discountValue <= 0) {
        setCouponMessage({ type: 'error', text: 'Code and discount value are required' })
        return
      }

      const res = await fetch(`${API_BASE_URL}/coupons`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload),
      }))
      const data = await res.json()
      if (data.success) {
        setCouponMessage({ type: 'success', text: 'Coupon created successfully' })
        setCouponForm({
          code: '',
          discountValue: '',
          perUserLimit: '1',
        })
        fetchCoupons()
      } else {
        setCouponMessage({ type: 'error', text: data.message || 'Failed to create coupon' })
      }
    } catch (e) {
      setCouponMessage({ type: 'error', text: e.message || 'Failed to create coupon' })
    }
  }

  const inventoryLowStockCount = inventory.filter(item => item.isLowStock).length

  const iconStroke = 'currentColor'
  const Icon = ({ name }) => {
    const common = {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }

    switch (name) {
      case 'chevronDown':
        return (
          <svg {...common}>
            <path d="M6 9l6 6 6-6" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'customer':
        return (
          <svg {...common}>
            <path d="M4 6h16M4 12h10M4 18h16" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'services':
        return (
          <svg {...common}>
            <path d="M4 7h16M7 7v10M17 7v10M6 17h12" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'addons':
        return (
          <svg {...common}>
            <path d="M12 5v14M5 12h14" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'coverage':
        return (
          <svg {...common}>
            <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )
      case 'slots':
        return (
          <svg {...common}>
            <path d="M8 3v3M16 3v3M4.5 8h15" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )
      case 'packages':
      case 'dailyCleaningServices':
        return (
          <svg {...common}>
            <path d="M5 7h14v12H5z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 7V5h6v2M8 12h8M8 16h5" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'orders':
        return (
          <svg {...common}>
            <path d="M6 7h12l-1 14H7L6 7z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 7a3 3 0 016 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'reviews':
        return (
          <svg {...common}>
            <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20.8l1-6.1-4.4-4.3 6.1-.9L12 3z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )
      case 'media':
        return (
          <svg {...common}>
            <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={iconStroke} strokeWidth="2" />
            <path d="M10 9l6 3-6 3V9z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )
      case 'employeesGroup':
        return (
          <svg {...common}>
            <path d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" stroke={iconStroke} strokeWidth="2" />
            <path d="M4 21a8 8 0 0116 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'employees':
        return (
          <svg {...common}>
            <path d="M16 8a4 4 0 10-8 0 4 4 0 008 0z" stroke={iconStroke} strokeWidth="2" />
            <path d="M6 21a6 6 0 0112 0" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'attendance':
        return (
          <svg {...common}>
            <path d="M8 3v3M16 3v3M4.5 8h15" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 13l2 2 4-4" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'inventory':
        return (
          <svg {...common}>
            <path d="M4 7l8-4 8 4-8 4-8-4z" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M4 7v10l8 4 8-4V7" stroke={iconStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 11v10" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      default:
        return (
          <svg {...common}>
            <path d="M12 2v20M2 12h20" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
    }
  }

  const navStructure = [
    {
      type: 'group',
      id: 'customer',
      label: 'Customer app',
      icon: 'customer',
      items: [
        { id: 'services', label: 'Services', icon: 'services' },
        { id: 'addons', label: 'Add ons', icon: 'addons' },
        { id: 'coverage', label: 'Coverage', icon: 'coverage' },
        { id: 'slots', label: 'Time slots', icon: 'slots' },
        { id: 'dailyCleaningServices', label: 'Daily Cleaning Services', icon: 'packages' },
        { id: 'packages', label: 'Packages', icon: 'packages' },
        { id: 'coupons', label: 'Coupons', icon: 'coverage' },
      ],
    },
    { type: 'item', id: 'orders', label: 'Orders', icon: 'orders' },
    { type: 'item', id: 'reviews', label: 'Reviews', icon: 'reviews' },
    { type: 'item', id: 'media', label: 'Media', icon: 'media' },
    {
      type: 'group',
      id: 'employees',
      label: 'Employees',
      icon: 'employeesGroup',
      items: [
        { id: 'employees', label: 'Employee', icon: 'employees' },
        { id: 'attendance', label: 'Attendance', icon: 'attendance' },
        { id: 'inventory', label: 'Inventory', icon: 'inventory', badge: inventoryLowStockCount },
      ],
    },
  ]

  const pageTitles = {
    services: 'Services',
    addons: 'Add-Ons',
    coverage: 'Coverage',
    slots: 'Time Slots',
    dailyCleaningServices: 'Daily Cleaning Services',
    packages: 'Packages',
    coupons: 'Coupons',
    orders: 'Orders',
    reviews: 'Reviews',
    media: 'Media (Testimonials & Transformations)',
    employees: 'Employees',
    attendance: 'Employee Attendance',
    inventory: 'Inventory',
  }

  return (
    <div className="app">
      {/* Sidebar overlay for mobile */}
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
                    <Icon name={node.icon} />
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
                    <Icon name={node.icon} />
                  </span>
                  <span className="nav-label">{node.label}</span>
                  <span className="nav-chevron" aria-hidden="true">
                    <Icon name="chevronDown" />
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
                        <Icon name={item.icon} />
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
                onChange={(e) => {
                  const token = e.target.value
                  setAuthToken(token)
                  localStorage.setItem('adminAuthToken', token)
                }}
                placeholder="JWT token"
              />
              <button type="button" className="auth-clear" onClick={() => { setAuthToken(''); localStorage.removeItem('adminAuthToken') }}>
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
          <h1 className="page-title">{pageTitles[activeTab]}</h1>
        </header>

        <div className="container">
        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {/* Services List Section */}
            <div className="services-section">
              <div className="section-header">
              </div>

              {/* Search and Filters */}
              <div className="services-controls">
                <div className="search-box">
                  <span className="search-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16.5 16.5 21 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search services by name or description..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="search-input"
                  />
                  {serviceSearch && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => setServiceSearch('')}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${serviceFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setServiceFilter('car')}
                  >
                    Car wash ({allServices.filter(s => s.category === 'CarWash').length})
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${serviceFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setServiceFilter('bike')}
                  >
                    Bike wash ({allServices.filter(s => s.category === 'BikeWash').length})
                  </button>
                </div>
              </div>

              {servicesError ? (
                <div className="message error">
                  {servicesError}
                  <button type="button" className="secondary-button" style={{ marginTop: '10px' }} onClick={fetchAllServices}>
                    Retry
                  </button>
                </div>
              ) : loadingAllServices ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3>No services found</h3>
                  <p>{serviceSearch ? `No services match "${serviceSearch}"` : 'No services match the selected filter'}</p>
                  {serviceSearch && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setServiceSearch('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="services-mini-grid">
                    {filteredServices.map(service => (
                      <div key={service._id} className="service-mini-card">
                        <div className="service-mini-top">
                          <h3 className="service-mini-name" title={service.name}>{service.name}</h3>
                          <div className="service-mini-price">₹{service.basePrice}</div>
                        </div>
                        {service.description ? (
                          <p className="service-mini-desc" title={service.description}>
                            {service.description}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="bw-button"
                          onClick={() => handleEditService(service._id)}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Create/Edit Service Form */}
            <div className="form-section form-section-flat">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    {editingServiceId ? '✏️ Edit Service' : 'Create New Service'}
                  </h2>
                  {editingServiceId && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Editing: {formData.name || 'Service'}
                    </p>
                  )}
                </div>
                {editingServiceId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleNewService}
                  >
                    + Create New
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="name">Service Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Basic Routine Cleaning"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Enter service description"
                />
              </div>

              <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="CarWash">Car Wash</option>
                <option value="BikeWash">Bike Wash</option>
                <option value="AddOn">Add-On</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="basePrice">Base Price (₹) *</label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="299"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration *</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                placeholder="30 mins"
              />
            </div>
          </div>

              <div className="form-group">
                <label htmlFor="image">Main Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="images">Additional Images (comma-separated URLs)</label>
                <input
                  type="text"
                  id="images"
                  name="images"
                  value={formData.images}
                  onChange={handleChange}
                  placeholder="https://img1.com, https://img2.com"
                />
              </div>

              <div className="form-row">
            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalReviews">Total Reviews</label>
              <input
                type="number"
                id="totalReviews"
                name="totalReviews"
                value={formData.totalReviews}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Service
              </label>
            </div>
          </div>

              {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
                <div className="form-group">
                  <label>Coverage (Included)</label>
              {loadingCoverage ? (
                <div className="loading-text">Loading coverage...</div>
              ) : availableCoverage.length === 0 ? (
                <div className="info-text">No coverage items available. Create coverage items first.</div>
              ) : (
                <div className="coverage-container">
                  {availableCoverage.map(item => (
                    <label key={item._id} className="coverage-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedCoverage.includes(item.name)}
                        onChange={() => toggleCoverage(item.name)}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              )}
                  <small className="help-text">Selected items go to Included. Others go to Not Included automatically.</small>
                </div>
              )}

              {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
                <div className="form-group">
                  <label>Not Included (auto)</label>
              {availableCoverage.length === 0 ? (
                <div className="info-text">No coverage items available.</div>
              ) : (
                <div className="not-included-list">
                  {availableCoverage
                    .map(item => item.name)
                    .filter(name => !selectedCoverage.includes(name))
                    .map(name => (
                      <span key={name} className="not-included-item">{name}</span>
                    ))}
                </div>
                  )}
                </div>
              )}

              {/* Add-Ons are auto-attached based on service category */}
              {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
                <div className="form-group auto-addons-section">
                  <label>Auto Add-Ons</label>
              {loadingAddOns ? (
                <div className="loading-text">Loading add-ons...</div>
              ) : availableAddOns.length === 0 ? (
                <div className="info-text">No add-ons available. Create add-ons first with category "Add-On".</div>
              ) : (
                <div className="addons-container">
                  {availableAddOns.map(addOn => (
                    <div key={addOn._id} className="addon-info">
                      <span className="addon-name">{addOn.name}</span>
                      <span className="addon-price">₹{addOn.basePrice}</span>
                    </div>
                  ))}
                </div>
              )}
                  <small className="help-text">All applicable add-ons are attached automatically.</small>
                </div>
              )}

              {/* Pricing Packages */}
              {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
                <>
                  {renderPackageSection('Monthly Packages', 'monthly')}
                  {renderPackageSection('Quarterly Packages', 'quarterly')}
                  {renderPackageSection('Yearly Packages', 'yearly')}
                </>
              )}

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

                <div className="form-actions">
                  <button
                    type="submit"
                    className={`submit-button ${editingServiceId ? '' : 'submit-button-create'}`.trim()}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        {editingServiceId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingServiceId ? 'Update Service' : 'Create Service'}
                      </>
                    )}
                  </button>
                  {editingServiceId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleNewService}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {activeTab === 'dailyCleaningServices' && (
          <>
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Customer App Monthly Package Pricing</h2>
                <button type="button" className="refresh-button" onClick={fetchPackagePricing} disabled={loadingPackagePricing}>
                  {loadingPackagePricing ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <form onSubmit={handlePackagePricingSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="packageDurationDays">Package Duration (days)</label>
                    <input
                      id="packageDurationDays"
                      type="number"
                      min="1"
                      value={packagePricingForm.durationDays}
                      onChange={(e) =>
                        setPackagePricingForm((prev) => ({ ...prev, durationDays: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Time Slots</label>
                  <div className="form-row">
                    {packagePricingForm.timeSlots.map((slot, idx) => (
                      <div key={`slot-${idx}`} className="form-group">
                        <input
                          type="text"
                          value={slot}
                          onChange={(e) => {
                            const next = [...packagePricingForm.timeSlots]
                            next[idx] = e.target.value
                            setPackagePricingForm((prev) => ({ ...prev, timeSlots: next }))
                          }}
                          placeholder={`Slot ${idx + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Pricing Matrix</label>
                  <div className="form-row">
                    {[
                      { key: 'i1_e1_daily', label: 'I1 + E1 + Daily' },
                      { key: 'i1_e1_alternate', label: 'I1 + E1 + Alternate' },
                      { key: 'i1_e2_daily', label: 'I1 + E2 + Daily' },
                      { key: 'i1_e2_alternate', label: 'I1 + E2 + Alternate' },
                      { key: 'i2_e1_daily', label: 'I2 + E1 + Daily' },
                      { key: 'i2_e1_alternate', label: 'I2 + E1 + Alternate' },
                      { key: 'i2_e2_daily', label: 'I2 + E2 + Daily' },
                      { key: 'i2_e2_alternate', label: 'I2 + E2 + Alternate' },
                    ].map((item) => (
                      <div key={item.key} className="form-group">
                        <label htmlFor={item.key}>{item.label}</label>
                        <input
                          id={item.key}
                          type="number"
                          min="0"
                          step="1"
                          value={packagePricingForm.pricingMatrix[item.key]}
                          onChange={(e) =>
                            setPackagePricingForm((prev) => ({
                              ...prev,
                              pricingMatrix: { ...prev.pricingMatrix, [item.key]: e.target.value },
                            }))
                          }
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {packagePricingMessage.text ? (
                  <div className={`message ${packagePricingMessage.type}`}>{packagePricingMessage.text}</div>
                ) : null}

                <div className="form-actions">
                  <button type="submit" className="submit-button" disabled={loadingPackagePricing}>
                    {loadingPackagePricing ? 'Saving...' : 'Save Package Pricing'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {activeTab === 'packages' && (
          <>
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Customer App Packages</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="secondary-button" onClick={addPackageCardRow}>
                    + Add Package
                  </button>
                  <button type="button" className="danger-button" onClick={clearAllPackageCards}>
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={clearAllPackageCardsAndSave}
                    disabled={loadingPackagePricing}
                  >
                    {loadingPackagePricing ? 'Clearing...' : 'Clear All & Save'}
                  </button>
                  <button type="button" className="refresh-button" onClick={fetchPackagePricing} disabled={loadingPackagePricing}>
                    {loadingPackagePricing ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <form onSubmit={handlePackagePricingSubmit} className="form">
                {(packagePricingForm.packageCards || []).length === 0 ? (
                  <div className="info-text">No package cards configured. Click "Add Package".</div>
                ) : (
                  (packagePricingForm.packageCards || []).map((card, index) => (
                    <div key={`card-${index}`} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Package Name</label>
                          <input
                            type="text"
                            value={card.name ?? ''}
                            onChange={(e) => updatePackageCardRow(index, 'name', e.target.value)}
                            placeholder="Premium Monthly"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Description</label>
                          <input
                            type="text"
                            value={card.description ?? ''}
                            onChange={(e) => updatePackageCardRow(index, 'description', e.target.value)}
                            placeholder="Short package description"
                          />
                        </div>
                        <div className="form-group">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={card.image ?? ''}
                            onChange={(e) => updatePackageCardRow(index, 'image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Washes / Month</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={card.times ?? ''}
                            onChange={(e) => updatePackageCardRow(index, 'times', e.target.value)}
                            placeholder="2"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Price</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={card.price ?? ''}
                            onChange={(e) => updatePackageCardRow(index, 'price', e.target.value)}
                            placeholder="1499"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Add-Ons</label>
                          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: 8 }}>
                            {(packageCarWashAddOns || []).length === 0 ? (
                              <small className="help-text">No add-ons available.</small>
                            ) : (
                              (packageCarWashAddOns || []).map((addOn) => {
                                const checked = (card.addOnServiceIds || []).includes(addOn._id)
                                return (
                                  <label key={addOn._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = card.addOnServiceIds || []
                                        const next = e.target.checked
                                          ? [...current, addOn._id]
                                          : current.filter((id) => id !== addOn._id)
                                        updatePackageCardRow(index, 'addOnServiceIds', next)
                                      }}
                                    />
                                    <span>{addOn.name} (₹{addOn.basePrice})</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Coverage Included</label>
                          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: 8 }}>
                            {(packageCarWashCoverage || []).length === 0 ? (
                              <small className="help-text">No coverage items available.</small>
                            ) : (
                              (packageCarWashCoverage || []).map((coverage) => {
                                const checked = (card.coverageIncluded || []).includes(coverage.name)
                                return (
                                  <label key={`inc-${coverage._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = card.coverageIncluded || []
                                        const next = e.target.checked
                                          ? [...current, coverage.name]
                                          : current.filter((name) => name !== coverage.name)
                                        updatePackageCardRow(index, 'coverageIncluded', next)
                                      }}
                                    />
                                    <span>{coverage.name}</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Coverage Not Included</label>
                          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: 8 }}>
                            {(packageCarWashCoverage || []).length === 0 ? (
                              <small className="help-text">No coverage items available.</small>
                            ) : (
                              (packageCarWashCoverage || []).map((coverage) => {
                                const checked = (card.coverageNotIncluded || []).includes(coverage.name)
                                return (
                                  <label key={`not-inc-${coverage._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = card.coverageNotIncluded || []
                                        const next = e.target.checked
                                          ? [...current, coverage.name]
                                          : current.filter((name) => name !== coverage.name)
                                        updatePackageCardRow(index, 'coverageNotIncluded', next)
                                      }}
                                    />
                                    <span>{coverage.name}</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" className="danger-button" onClick={() => removePackageCardRow(index)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {packagePricingMessage.text ? (
                  <div className={`message ${packagePricingMessage.type}`}>{packagePricingMessage.text}</div>
                ) : null}

                <div className="form-actions">
                  <button type="submit" className="submit-button" disabled={loadingPackagePricing}>
                    {loadingPackagePricing ? 'Saving...' : 'Save Packages'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {activeTab === 'coupons' && (
          <>
            <div className="form-section">
              <div className="section-header">
                <h2 className="section-title">Create Coupon</h2>
              </div>
              <form onSubmit={handleCreateCoupon} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="couponCode">Code *</label>
                    <input
                      id="couponCode"
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="SAVE50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="couponValue">Discount Value *</label>
                    <input
                      id="couponValue"
                      type="number"
                      min="1"
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))}
                      placeholder="50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="couponPerUserLimit">Per User Limit</label>
                    <input
                      id="couponPerUserLimit"
                      type="number"
                      min="0"
                      value={couponForm.perUserLimit}
                      onChange={(e) => setCouponForm((p) => ({ ...p, perUserLimit: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                {couponMessage.text && (
                  <div className={`message ${couponMessage.type}`}>
                    {couponMessage.text}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-button">Create Coupon</button>
                </div>
              </form>
            </div>

            <div className="services-section" style={{ marginTop: '1.5rem' }}>
              <div className="section-header">
                <h2 className="section-title">All Coupons</h2>
                <button type="button" className="refresh-button" onClick={fetchCoupons} disabled={loadingCoupons}>
                  {loadingCoupons ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingCoupons ? (
                <div className="loading-text">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="info-text">No coupons created yet.</div>
              ) : (
                <div className="addons-grid">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{coupon.code}</h3>
                        <span className={`addon-status ${coupon.isActive ? 'active' : 'inactive'}`}>
                          {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Discount</span>
                          <span className="detail-value">
                            {coupon.discountType === 'FLAT' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Min order</span>
                          <span className="detail-value">₹{coupon.minOrderAmount || 0}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Used</span>
                          <span className="detail-value">
                            {coupon.usedCount || 0}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Expiry</span>
                          <span className="detail-value">
                            {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Add-Ons Form */}
        {activeTab === 'addons' && (
          <>
            {/* Add-Ons List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Existing Add-Ons</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('car')}
                  >
                    Car Wash
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('bike')}
                  >
                    Bike Wash
                  </button>
                </div>
              </div>

              {loadingAllAddOns ? (
                <div className="loading-text">Loading add-ons...</div>
              ) : filteredAddOns.length === 0 ? (
                <div className="info-text">No add-ons found for this filter.</div>
              ) : (
                <div className="addons-grid">
                  {filteredAddOns.map(addOn => (
                    <div key={addOn._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{addOn.name}</h3>
                        <span className={`addon-status ${addOn.isActive ? 'active' : 'inactive'}`}>
                          {addOn.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value">₹{addOn.basePrice}</span>
                        </div>
                      </div>
                      <div className="addon-card-footer">
                        <span className="applicable-for">
                          For: {addOn.applicableFor && addOn.applicableFor.length > 0 
                            ? addOn.applicableFor.map(cat => cat === 'CarWash' ? 'Car Wash' : 'Bike Wash').join(', ')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Add-On Form */}
            <div className="form-section-divider"></div>
            <h2 className="section-title">Create New Add-On</h2>
            <form onSubmit={handleAddOnSubmit} className="form">
            <div className="form-group">
              <label htmlFor="addon-name">Add-On Name *</label>
              <input
                type="text"
                id="addon-name"
                name="name"
                value={addOnFormData.name}
                onChange={handleAddOnChange}
                required
                placeholder="e.g., Interior Vacuum"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="addon-price">Price (₹) *</label>
                <input
                  type="number"
                  id="addon-price"
                  name="basePrice"
                  value={addOnFormData.basePrice}
                  onChange={handleAddOnChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="99"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={addOnFormData.isActive}
                    onChange={handleAddOnChange}
                  />
                  Active
                </label>
              </div>
            </div>


            <div className="form-group">
              <label>Applicable For *</label>
              <div className="checkbox-group-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="applicableFor"
                    value="CarWash"
                    checked={addOnFormData.applicableFor.includes('CarWash')}
                    onChange={handleAddOnChange}
                  />
                  Car Wash
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="applicableFor"
                    value="BikeWash"
                    checked={addOnFormData.applicableFor.includes('BikeWash')}
                    onChange={handleAddOnChange}
                  />
                  Bike Wash
                </label>
              </div>
              <small className="help-text">Select which service types can use this add-on</small>
            </div>

            {addOnMessage.text && (
              <div className={`message ${addOnMessage.type}`}>
                {addOnMessage.text}
              </div>
            )}

            <button type="submit" className="submit-button" disabled={loadingAddOn}>
              {loadingAddOn ? 'Creating...' : 'Create Add-On'}
            </button>
          </form>
          </>
        )}

        {/* Coverage Form */}
        {activeTab === 'coverage' && (
          <>
            {/* Coverage List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Coverage Items</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('car')}
                  >
                    Car Wash
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('bike')}
                  >
                    Bike Wash
                  </button>
                </div>
              </div>

              {loadingAllCoverage ? (
                <div className="loading-text">Loading coverage items...</div>
              ) : filteredCoverage.length === 0 ? (
                <div className="info-text">No coverage items found for this filter.</div>
              ) : (
                <div className="addons-grid">
                  {filteredCoverage.map(item => (
                    <div key={item._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{item.name}</h3>
                        <span className={`addon-status ${item.isActive ? 'active' : 'inactive'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="addon-card-footer">
                        <span className="applicable-for">
                          For: {item.applicableFor && item.applicableFor.length > 0
                            ? item.applicableFor.map(cat => cat === 'CarWash' ? 'Car Wash' : 'Bike Wash').join(', ')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Coverage Form */}
            <div className="form-section-divider"></div>
            <h2 className="section-title">Create Coverage Item</h2>
            <form onSubmit={handleCoverageSubmit} className="form">
              <div className="form-group">
                <label htmlFor="coverage-name">Coverage Name *</label>
                <input
                  type="text"
                  id="coverage-name"
                  name="name"
                  value={coverageFormData.name}
                  onChange={handleCoverageChange}
                  required
                  placeholder="e.g., Exterior Wash"
                />
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={coverageFormData.isActive}
                      onChange={handleCoverageChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Applicable For *</label>
                <div className="checkbox-group-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="applicableFor"
                      value="CarWash"
                      checked={coverageFormData.applicableFor.includes('CarWash')}
                      onChange={handleCoverageChange}
                    />
                    Car Wash
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="applicableFor"
                      value="BikeWash"
                      checked={coverageFormData.applicableFor.includes('BikeWash')}
                      onChange={handleCoverageChange}
                    />
                    Bike Wash
                  </label>
                </div>
                <small className="help-text">Select which service types use this coverage</small>
              </div>

              {coverageMessage.text && (
                <div className={`message ${coverageMessage.type}`}>
                  {coverageMessage.text}
                </div>
              )}

              <button type="submit" className="submit-button" disabled={loadingCoverage}>
                {loadingCoverage ? 'Creating...' : 'Create Coverage'}
              </button>
            </form>
          </>
        )}

        {/* Time Slots Tab */}
        {activeTab === 'slots' && (
          <>
            {/* Default Slots Configuration */}
            <div className="services-section">
              <div className="section-header">
                <h2 className="section-title">Default Time Slots</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Slots:</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={defaultSlotsCount}
                      onChange={(e) => setDefaultSlotsCount(parseInt(e.target.value) || 10)}
                      style={{
                        width: '60px',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Start:</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={defaultStartHour}
                      onChange={(e) => setDefaultStartHour(parseInt(e.target.value) || 9)}
                      style={{
                        width: '60px',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>AM</span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleResetToDefaults}
                    disabled={loadingTimeSlots}
                    title="Reset to default slots"
                  >
                    🔄 Reset to Defaults
                  </button>
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={fetchTimeSlots}
                    disabled={loadingTimeSlots}
                    title="Refresh slots list"
                  >
                    <span className="refresh-icon">↻</span>
                    {loadingTimeSlots ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {timeSlotsError ? (
                <div className="message error">
                  {timeSlotsError}
                  <button type="button" className="secondary-button" style={{ marginTop: '10px' }} onClick={fetchTimeSlots}>
                    Retry
                  </button>
                </div>
              ) : loadingTimeSlots ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading time slots...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <h3>No time slots configured</h3>
                  <p>Create your first time slot below to get started.</p>
                </div>
              ) : (
                <>
                  <div className="services-stats">
                    {timeSlots.filter(s => s.isActive).length} active, {timeSlots.filter(s => !s.isActive).length} inactive
                  </div>
                  <div className="services-grid">
                    {timeSlots.map(slot => (
                      <div key={slot._id} className="service-card">
                        <div className="service-card-content">
                          <div className="service-card-header">
                            <div className="service-card-title-row">
                              <span className="service-category-icon">⏰</span>
                              <h3 className="service-card-title">{slot.time}</h3>
                            </div>
                            <span className={`service-status ${slot.isActive ? 'active' : 'inactive'}`}>
                              {slot.isActive ? '✓ Active' : '✗ Inactive'}
                            </span>
                          </div>
                          
                          <div className="service-card-details">
                            <div className="service-detail">
                              <span className="service-detail-icon">🕐</span>
                              <div>
                                <span className="service-detail-label">Start</span>
                                <span className="service-detail-value">{slot.startTime}</span>
                              </div>
                            </div>
                            <div className="service-detail">
                              <span className="service-detail-icon">🕑</span>
                              <div>
                                <span className="service-detail-label">End</span>
                                <span className="service-detail-value">{slot.endTime}</span>
                              </div>
                            </div>
                            <div className="service-detail">
                              <span className="service-detail-icon">#</span>
                              <div>
                                <span className="service-detail-label">Order</span>
                                <span className="service-detail-value">{slot.order}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="service-card-actions">
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => handleEditTimeSlot(slot._id)}
                            >
                              ✏️ Edit Slot
                            </button>
                            <button
                              type="button"
                              className="danger-button"
                              style={{ marginTop: '0.5rem', width: '100%' }}
                              onClick={() => handleDeleteTimeSlot(slot._id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Create/Edit Time Slot Form */}
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    {editingTimeSlotId ? '✏️ Edit Time Slot' : '➕ Create New Time Slot'}
                  </h2>
                  {editingTimeSlotId && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Editing slot
                    </p>
                  )}
                </div>
                {editingTimeSlotId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleNewTimeSlot}
                  >
                    + Create New
                  </button>
                )}
              </div>
              <form onSubmit={handleTimeSlotSubmit} className="form">
                <div className="form-group">
                  <label htmlFor="time">Time Slot Display *</label>
                  <input
                    type="text"
                    id="time"
                    name="time"
                    value={timeSlotFormData.time}
                    onChange={handleTimeSlotChange}
                    required
                    placeholder="e.g., 9:00 AM - 10:00 AM"
                  />
                  <small className="help-text">This is what customers will see</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startTime">Start Time (24h) *</label>
                    <input
                      type="text"
                      id="startTime"
                      name="startTime"
                      value={timeSlotFormData.startTime}
                      onChange={handleTimeSlotChange}
                      required
                      placeholder="09:00"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    />
                    <small className="help-text">Format: HH:MM (24-hour)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="endTime">End Time (24h) *</label>
                    <input
                      type="text"
                      id="endTime"
                      name="endTime"
                      value={timeSlotFormData.endTime}
                      onChange={handleTimeSlotChange}
                      required
                      placeholder="10:00"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    />
                    <small className="help-text">Format: HH:MM (24-hour)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="order">Display Order</label>
                    <input
                      type="number"
                      id="order"
                      name="order"
                      value={timeSlotFormData.order}
                      onChange={handleTimeSlotChange}
                      min="1"
                      placeholder="Auto"
                    />
                    <small className="help-text">Lower numbers appear first (auto if empty)</small>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={timeSlotFormData.isActive}
                      onChange={handleTimeSlotChange}
                    />
                    Active (visible to customers)
                  </label>
                </div>

                {timeSlotMessage.text && (
                  <div className={`message ${timeSlotMessage.type}`}>
                    {timeSlotMessage.text}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-button" disabled={loadingTimeSlots}>
                    {loadingTimeSlots 
                      ? (editingTimeSlotId ? 'Updating...' : 'Creating...') 
                      : (editingTimeSlotId ? '💾 Update Slot' : '✨ Create Slot')}
                  </button>
                  {editingTimeSlotId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleNewTimeSlot}
                      disabled={loadingTimeSlots}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Daily Slot Overrides */}
            <div className="form-section" style={{ marginTop: '2rem' }}>
              <div className="section-header">
                <div>
                  <h2 className="section-title">📅 Daily Slot Overrides</h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Override slots for specific dates (e.g., holidays, special events)
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveDailyOverride} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="override-date">Select Date *</label>
                    <input
                      type="date"
                      id="override-date"
                      value={selectedOverrideDate}
                      onChange={(e) => {
                        setSelectedOverrideDate(e.target.value)
                        if (e.target.value) {
                          loadDailyOverride(e.target.value)
                        } else {
                          setDailyOverrideSlots([])
                        }
                      }}
                      required={false}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {selectedOverrideDate && (
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={async () => {
                          try {
                            const slotsResponse = await fetch(`${API_BASE_URL}/slots/times`)
                            const slotsData = await slotsResponse.json()
                            if (slotsData.success && slotsData.data) {
                              setDailyOverrideSlots(slotsData.data.map(s => ({
                                time: s.time,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                order: s.order || 0,
                              })))
                            } else {
                              const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
                              setDailyOverrideSlots(defaults)
                            }
                          } catch (error) {
                            const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
                            setDailyOverrideSlots(defaults)
                          }
                        }}
                      >
                        Use Defaults
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={handleDeleteDailyOverride}
                        disabled={loadingDailyOverride}
                      >
                        Remove Override
                      </button>
                    </div>
                  )}
                </div>

                {selectedOverrideDate && (
                  <>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label>Slots for {new Date(selectedOverrideDate).toLocaleDateString()}</label>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={addSlotToOverride}
                        >
                          + Add Slot
                        </button>
                      </div>
                      {dailyOverrideSlots.length === 0 ? (
                        <div className="info-text" style={{ padding: '1rem', textAlign: 'center' }}>
                          No slots configured. Click "Use Defaults" or "Add Slot" to configure.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {dailyOverrideSlots.map((slot, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: '#f8f9fa',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}>
                              <span style={{ flex: 1, fontWeight: '600' }}>{slot.time}</span>
                              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <button
                                type="button"
                                className="danger-button"
                                onClick={() => removeSlotFromOverride(index)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {dailyOverrideMessage.text && (
                      <div className={`message ${dailyOverrideMessage.type}`}>
                        {dailyOverrideMessage.text}
                      </div>
                    )}

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={loadingDailyOverride || dailyOverrideSlots.length === 0}
                      >
                        {loadingDailyOverride ? 'Saving...' : '💾 Save Override'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="orders-section">
            <div className="section-header">
              <h2 className="section-title">Customer Reviews</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchReviews}
                disabled={loadingReviews}
              >
                {loadingReviews ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loadingReviews ? (
              <div className="loading-text">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="info-text">No reviews yet.</div>
            ) : (
              <div className="reviews-table-wrap">
                <table className="reviews-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Service</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((order) => {
                      const serviceName = order.items?.[0]?.serviceName || order.items?.[0]?.service?.name || '—'
                      const customerName = order.customer?.name || order.user?.name || '—'
                      const customerPhone = order.customer?.phone || order.user?.phone || '—'
                      return (
                        <tr key={order._id}>
                          <td>{customerName}</td>
                          <td>{customerPhone}</td>
                          <td>{serviceName}</td>
                          <td>
                            <span className="review-rating">
                              {'★'.repeat(order.rating || 0)}{'☆'.repeat(5 - (order.rating || 0))} {order.rating}/5
                            </span>
                          </td>
                          <td className="review-text">{order.review || '—'}</td>
                          <td>{order.ratedAt ? new Date(order.ratedAt).toLocaleString() : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Media: Testimonials, Transformations, See The Difference */}
        {activeTab === 'media' && (
          <div className="orders-section">
            <div className="section-header">
              <h2 className="section-title">Media</h2>
              <button type="button" className="secondary-button" onClick={fetchMedia} disabled={loadingMedia}>
                {loadingMedia ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {mediaMessage.text && (
              <div className={mediaMessage.type === 'error' ? 'error-message' : 'success-message'} style={{ marginBottom: 12 }}>
                {mediaMessage.text}
              </div>
            )}

            {/* Testimonials: video upload */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>Customer Testimonials (videos)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
                <select
                  value={mediaForm.type}
                  onChange={(e) => setMediaForm((f) => ({ ...f, type: e.target.value }))}
                  style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
                >
                  <option value="testimonials">Testimonials</option>
                  <option value="transformations">Transformations</option>
                </select>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={mediaForm.name}
                  onChange={(e) => setMediaForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, minWidth: 160 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>Video:</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setMediaForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                  />
                </label>
                <button type="button" className="primary-button" onClick={uploadMediaFile} disabled={uploadingMedia || !mediaForm.file}>
                  {uploadingMedia ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(mediaList.filter((m) => m.type === 'testimonials') || []).map((m) => (
                  <div key={m._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={UPLOADS_BASE + m.url} controls style={{ width: 120, height: 68, objectFit: 'cover' }} />
                    ) : (
                      <img src={UPLOADS_BASE + m.url} alt="" style={{ width: 120, height: 68, objectFit: 'cover' }} />
                    )}
                    <span>{m.name || 'Video'}</span>
                    <button type="button" className="secondary-button" style={{ padding: '4px 8px' }} onClick={() => deleteMediaItem(m._id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transformations: video upload (same form, type=transformations) - list below */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>See The Transformations (videos)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(mediaList.filter((m) => m.type === 'transformations') || []).map((m) => (
                  <div key={m._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={UPLOADS_BASE + m.url} controls style={{ width: 120, height: 68, objectFit: 'cover' }} />
                    ) : (
                      <img src={UPLOADS_BASE + m.url} alt="" style={{ width: 120, height: 68, objectFit: 'cover' }} />
                    )}
                    <span>{m.name || 'Video'}</span>
                    <button type="button" className="secondary-button" style={{ padding: '4px 8px' }} onClick={() => deleteMediaItem(m._id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* See The Difference: 3 images */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>See The Difference (3 images)</h3>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Upload exactly 3 images. They will replace the current set.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
                <label>Image 1: <input type="file" accept="image/*" onChange={(e) => setSeeDiffFiles((f) => ({ ...f, image1: e.target.files?.[0] || null }))} /></label>
                <label>Image 2: <input type="file" accept="image/*" onChange={(e) => setSeeDiffFiles((f) => ({ ...f, image2: e.target.files?.[0] || null }))} /></label>
                <label>Image 3: <input type="file" accept="image/*" onChange={(e) => setSeeDiffFiles((f) => ({ ...f, image3: e.target.files?.[0] || null }))} /></label>
                <button type="button" className="primary-button" onClick={uploadSeeTheDifference} disabled={uploadingSeeDiff}> {uploadingSeeDiff ? 'Uploading...' : 'Upload 3 images'} </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(mediaList.filter((m) => m.type === 'seeTheDifference') || []).sort((a, b) => a.order - b.order).map((m) => (
                  <div key={m._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
                    <img src={UPLOADS_BASE + m.url} alt={m.name} style={{ width: 160, height: 100, objectFit: 'cover', display: 'block' }} />
                    <span style={{ fontSize: 13 }}>{m.name || `Slide ${m.order + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2 className="section-title">Orders</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchOrders}
              >
                Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div className="loading-text">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="info-text">No orders yet.</div>
            ) : (
              <div className="orders-grid">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-card-header">
                      <h3 className="order-card-title">Order #{order._id.slice(-6)}</h3>
                      <span className={`order-status ${order.status?.toLowerCase()}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value">₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Items:</span>
                        <span className="detail-value">{order.items?.length || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{order.customer?.name || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{order.customer?.phone || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">{order.customer?.address || '—'}</span>
                      </div>
                    </div>
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Assigned Emp:</span>
                        <span className="detail-value">{order.assignedEmployeeId || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Assign Status:</span>
                        <span className="detail-value">{order.assignmentStatus || '—'}</span>
                      </div>
                    </div>
                    <div className="order-slot-list">
                      <span className="detail-label">Slots:</span>
                      {(order.items || []).map((item, index) => {
                        const slotDate = item?.scheduledDate
                          ? new Date(item.scheduledDate).toLocaleDateString()
                          : '—';
                        const slotTime = item?.scheduledTimeSlot || '—';
                        const serviceName = item?.serviceName || item?.service?.name || 'Service';
                        const custom = item?.customPackage || null;
                        const formatDate = (value) => {
                          if (!value) return '—'
                          const d = new Date(value)
                          if (Number.isNaN(d.getTime())) return '—'
                          return d.toLocaleDateString()
                        }
                        const interiorDatesText = Array.isArray(custom?.interiorDates) && custom.interiorDates.length > 0
                          ? custom.interiorDates.map(formatDate).join(', ')
                          : '—'
                        const exteriorDatesText = Array.isArray(custom?.exteriorDates) && custom.exteriorDates.length > 0
                          ? custom.exteriorDates.map(formatDate).join(', ')
                          : '—'
                        return (
                          <div key={`${order._id}-slot-${index}`} className="order-slot-item">
                            <span className="order-slot-service">{serviceName}</span>
                            <span className="order-slot-separator">•</span>
                            <span className="order-slot-datetime">{slotDate} • {slotTime}</span>
                            {Array.isArray(item?.scheduledSlots) && item.scheduledSlots.length > 0 ? (
                              <div style={{ width: '100%', marginTop: 6, fontSize: 12, color: '#4B5563' }}>
                                Package slots: {item.scheduledSlots.length}
                              </div>
                            ) : null}
                            {custom ? (
                              <div style={{ width: '100%', marginTop: 8, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                                <div><strong>Custom package</strong></div>
                                <div>Start: {formatDate(custom.packageStartDate)} | Duration: {custom.packageDurationDays || '—'} days</div>
                                <div>Slot: {custom.packageTimeSlot || '—'} | Daily mode: {custom.dailyMode || '—'}</div>
                                <div>Interior dates: {interiorDatesText}</div>
                                <div>Exterior dates: {exteriorDatesText}</div>
                                <div>Pricing: {custom.pricingKey || '—'} | ₹{Number(custom.packagePrice || 0).toFixed(2)}</div>
                                <div>Pricing version: {custom.pricingVersion ? formatDate(custom.pricingVersion) : '—'}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {order.customer?.phone && (
                      <div className="order-card-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={async () => {
                            const phone = order.customer?.phone
                            const amountInput = window.prompt(`Add amount to wallet for ${phone}`, '500')
                            if (!amountInput) return
                            const noteInput = window.prompt('Add a note (optional)', 'Admin credit')
                            const result = await creditCustomerWallet({
                              phone,
                              amount: amountInput,
                              note: noteInput || '',
                            })
                            if (result && typeof result.walletBalance === 'number') {
                              window.alert(`Wallet updated. New balance: ₹${result.walletBalance}`)
                            }
                          }}
                        >
                          Add to Wallet
                        </button>
                      </div>
                    )}
                    {((order.servicePhotos?.beforePhotos?.length) || (order.servicePhotos?.afterPhotos?.length)) > 0 && (
                      <div className="order-photos-section">
                        <span className="detail-label">Service photos</span>
                        {order.servicePhotos?.beforePhotos?.length > 0 && (
                          <div className="order-photos-row">
                            <span className="order-photos-label">Before:</span>
                            <div className="order-photos-thumbs">
                              {order.servicePhotos.beforePhotos.map((url, i) => (
                                <a key={`before-${i}`} href={UPLOADS_BASE + url} target="_blank" rel="noopener noreferrer" className="order-photo-link">
                                  <img src={UPLOADS_BASE + url} alt={`Before ${i + 1}`} className="order-photo-thumb" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.servicePhotos?.afterPhotos?.length > 0 && (
                          <div className="order-photos-row">
                            <span className="order-photos-label">After:</span>
                            <div className="order-photos-thumbs">
                              {order.servicePhotos.afterPhotos.map((url, i) => (
                                <a key={`after-${i}`} href={UPLOADS_BASE + url} target="_blank" rel="noopener noreferrer" className="order-photo-link">
                                  <img src={UPLOADS_BASE + url} alt={`After ${i + 1}`} className="order-photo-thumb" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="order-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={order.status === 'Completed'}
                        onClick={() => markOrderDelivered(order._id)}
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Employees Tab - list all employees and document status */}
        {activeTab === 'employees' && (
          <div className="attendance-section">
            <div className="section-header">
              <h2 className="section-title">Employees</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchEmployees}
                disabled={loadingEmployees}
              >
                {loadingEmployees ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Employee ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEmployees ? (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Loading employees...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>No employees found.</td></tr>
                  ) : employees.map((emp) => {
                    const docsUploaded = !!emp.documentsUploaded
                    return (
                      <tr key={emp.employeeId || emp._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{emp.employeeId}</td>
                        <td style={{ padding: '12px' }}>{emp.name || '—'}</td>
                        <td style={{ padding: '12px' }}>{emp.phone || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          {docsUploaded ? (
                            <>
                              <span style={{ marginRight: '8px', fontSize: '12px', color: '#155724' }}>Uploaded</span>
                              <button
                                type="button"
                                onClick={() => openEmployeeDocuments(emp)}
                                style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2F8CF4', color: '#fff', border: 'none', borderRadius: '6px' }}
                              >
                                View
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>Not uploaded</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="section-header">
              <h2 className="section-title">Employee Attendance</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchAttendance}
                disabled={loadingAttendance}
              >
                {loadingAttendance ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Date:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Employee:</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minWidth: '200px',
                  }}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.employeeId || emp._id} value={emp.employeeId || emp._id}>
                      {emp.name || emp.employeeId || 'Unknown'} ({emp.employeeId || emp._id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            {(() => {
              const summary = getAttendanceSummary()
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Employees</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.total}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#d4edda', 
                    borderRadius: '8px', 
                    border: '1px solid #c3e6cb' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#155724', marginBottom: '5px' }}>Present</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{summary.present}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8d7da', 
                    borderRadius: '8px', 
                    border: '1px solid #f5c6cb' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '5px' }}>Absent</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{summary.absent}</div>
                  </div>
                </div>
              )
            })()}

            {/* Attendance Table */}
            {loadingAttendance ? (
              <div className="loading-text">Loading attendance...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Employee ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                          No employees found. Please ensure employees are created first.
                        </td>
                      </tr>
                    ) : employees.map((employee) => {
                      const attendanceRecord = attendance.find(a => a.employeeId === employee.employeeId)
                      const docsUploaded = !!employee.documentsUploaded
                      return (
                        <tr key={employee.employeeId || employee._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{employee.employeeId}</td>
                          <td style={{ padding: '12px' }}>{employee.name || '—'}</td>
                          <td style={{ padding: '12px' }}>{employee.phone || '—'}</td>
                          <td style={{ padding: '12px' }}>
                            {attendanceRecord?.checkIn ? formatTime(attendanceRecord.checkIn) : '—'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {attendanceRecord?.checkIn ? (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#d4edda',
                                color: '#155724',
                              }}>
                                Present
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                              }}>
                                Absent
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {docsUploaded ? (
                              <>
                                <span style={{ marginRight: '8px', fontSize: '12px', color: '#155724' }}>Uploaded</span>
                                <button
                                  type="button"
                                  onClick={() => openEmployeeDocuments(employee)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: '#2F8CF4',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                  }}
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>Not uploaded</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* Employee documents view modal - outside tabs so it works from Employees or Attendance */}
        {documentViewEmployee && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={closeDocumentView}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Documents – {documentViewEmployee.name || documentViewEmployee.employeeId}</h3>
                <button type="button" onClick={closeDocumentView} style={{ padding: '6px 12px', cursor: 'pointer' }}>Close</button>
              </div>
              {loadingDocumentView ? (
                <p>Loading…</p>
              ) : documentViewUrls ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {documentViewUrls.aadharUrl && (
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Aadhaar Card</div>
                      <img
                        src={UPLOADS_BASE + documentViewUrls.aadharUrl}
                        alt="Aadhaar"
                        style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  {documentViewUrls.panUrl && (
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>PAN Card</div>
                      <img
                        src={UPLOADS_BASE + documentViewUrls.panUrl}
                        alt="PAN"
                        style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  {(!documentViewUrls.aadharUrl && !documentViewUrls.panUrl) && (
                    <p style={{ color: '#6B7280' }}>No documents available.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-section">
            {/* Summary Cards */}
            {(() => {
              const summary = getInventorySummary()
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Items</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.totalItems}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: summary.lowStockItems > 0 ? '#fff3cd' : '#d4edda', 
                    borderRadius: '8px', 
                    border: `1px solid ${summary.lowStockItems > 0 ? '#ffc107' : '#c3e6cb'}` 
                  }}>
                    <div style={{ fontSize: '12px', color: summary.lowStockItems > 0 ? '#856404' : '#155724', marginBottom: '5px' }}>Low Stock Items</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.lowStockItems > 0 ? '#856404' : '#155724' }}>{summary.lowStockItems}</div>
                  </div>
                </div>
              )
            })()}

            {/* Inventory List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Inventory Items</h2>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fetchInventory}
                  disabled={loadingInventory}
                >
                  {loadingInventory ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Filters */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Category:</label>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Soap">Soap</option>
                    <option value="Towels">Towels</option>
                    <option value="Polish">Polish</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Filter:</label>
                  <select
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Items</option>
                    <option value="lowStock">Low Stock Only</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Search:</label>
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search by name..."
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {loadingInventory ? (
                <div className="loading-text">Loading inventory...</div>
              ) : filteredInventory.length === 0 ? (
                <div className="info-text">No inventory items found.</div>
              ) : (
                <div className="addons-grid">
                  {filteredInventory.map(item => (
                    <div 
                      key={item._id} 
                      className="addon-card"
                      style={{
                        border: item.isLowStock ? '2px solid #dc3545' : '1px solid #ddd',
                        backgroundColor: item.isLowStock ? '#fff5f5' : '#fff',
                      }}
                    >
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{item.name}</h3>
                        {item.isLowStock && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#dc3545',
                            color: 'white',
                          }}>
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Category:</span>
                          <span className="detail-value">{item.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Stock:</span>
                          <span className="detail-value" style={{ 
                            color: item.isLowStock ? '#dc3545' : '#333',
                            fontWeight: item.isLowStock ? 'bold' : 'normal'
                          }}>
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Low Stock Threshold:</span>
                          <span className="detail-value">{item.lowStockThreshold} {item.unit}</span>
                        </div>
                        {item.supplier && (
                          <div className="detail-item">
                            <span className="detail-label">Supplier:</span>
                            <span className="detail-value">{item.supplier}</span>
                          </div>
                        )}
                        {item.lastRestocked && (
                          <div className="detail-item">
                            <span className="detail-label">Last Restocked:</span>
                            <span className="detail-value">
                              {new Date(item.lastRestocked).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="addon-card-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleEditInventory(item._id)}
                          style={{ flex: 1, minWidth: '80px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockUpdateModal({ 
                            open: true, 
                            item, 
                            quantity: '', 
                            operation: 'add' 
                          })}
                          style={{
                            flex: 1,
                            minWidth: '80px',
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Add Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockUpdateModal({ 
                            open: true, 
                            item, 
                            quantity: '', 
                            operation: 'remove' 
                          })}
                          style={{
                            flex: 1,
                            minWidth: '80px',
                            padding: '8px 16px',
                            backgroundColor: '#ffc107',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInventory(item._id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create/Edit Inventory Form */}
            <div className="form-section-divider"></div>
            <div className="section-header">
              <h2 className="section-title">
                {editingInventoryId ? 'Edit Inventory Item' : 'Create New Inventory Item'}
              </h2>
              {editingInventoryId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleNewInventory}
                >
                  Create New Instead
                </button>
              )}
            </div>
            <form onSubmit={handleInventorySubmit} className="form">
              <div className="form-group">
                <label htmlFor="inventory-name">Item Name *</label>
                <input
                  type="text"
                  id="inventory-name"
                  name="name"
                  value={inventoryFormData.name}
                  onChange={handleInventoryChange}
                  required
                  placeholder="e.g., Car Soap, Microfiber Towels"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-category">Category *</label>
                  <select
                    id="inventory-category"
                    name="category"
                    value={inventoryFormData.category}
                    onChange={handleInventoryChange}
                    required
                  >
                    <option value="Soap">Soap</option>
                    <option value="Towels">Towels</option>
                    <option value="Polish">Polish</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-unit">Unit *</label>
                  <input
                    type="text"
                    id="inventory-unit"
                    name="unit"
                    value={inventoryFormData.unit}
                    onChange={handleInventoryChange}
                    required
                    placeholder="e.g., liters, pieces, kg, bottles"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-stock">Current Stock *</label>
                  <input
                    type="number"
                    id="inventory-stock"
                    name="currentStock"
                    value={inventoryFormData.currentStock}
                    onChange={handleInventoryChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-threshold">Low Stock Threshold *</label>
                  <input
                    type="number"
                    id="inventory-threshold"
                    name="lowStockThreshold"
                    value={inventoryFormData.lowStockThreshold}
                    onChange={handleInventoryChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="10"
                  />
                  <small className="help-text">Alert when stock falls below this amount</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-supplier">Supplier</label>
                  <input
                    type="text"
                    id="inventory-supplier"
                    name="supplier"
                    value={inventoryFormData.supplier}
                    onChange={handleInventoryChange}
                    placeholder="e.g., ABC Supplies"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inventory-description">Description</label>
                <textarea
                  id="inventory-description"
                  name="description"
                  value={inventoryFormData.description}
                  onChange={handleInventoryChange}
                  rows="3"
                  placeholder="Additional notes about this item"
                />
              </div>

              {inventoryMessage.text && (
                <div className={`message ${inventoryMessage.type}`}>
                  {inventoryMessage.text}
                </div>
              )}

              <button type="submit" className="submit-button" disabled={loadingInventory}>
                {loadingInventory 
                  ? (editingInventoryId ? 'Updating...' : 'Creating...') 
                  : (editingInventoryId ? 'Update Item' : 'Create Item')}
              </button>
            </form>

            {/* Stock Update Modal */}
            {stockUpdateModal.open && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '90%',
                }}>
                  <h2 style={{ marginBottom: '20px' }}>
                    {stockUpdateModal.operation === 'add' ? 'Add' : 'Remove'} Stock
                  </h2>
                  <p style={{ marginBottom: '15px' }}>
                    <strong>Item:</strong> {stockUpdateModal.item?.name}
                  </p>
                  <p style={{ marginBottom: '15px' }}>
                    <strong>Current Stock:</strong> {stockUpdateModal.item?.currentStock} {stockUpdateModal.item?.unit}
                  </p>
                  <div className="form-group">
                    <label>Quantity to {stockUpdateModal.operation === 'add' ? 'Add' : 'Remove'} *</label>
                    <input
                      type="number"
                      value={stockUpdateModal.quantity}
                      onChange={(e) => setStockUpdateModal(prev => ({ ...prev, quantity: e.target.value }))}
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Enter quantity"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginBottom: '10px',
                      }}
                    />
                    <small className="help-text">Unit: {stockUpdateModal.item?.unit}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={handleStockUpdate}
                      disabled={loadingInventory || !stockUpdateModal.quantity}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: stockUpdateModal.operation === 'add' ? '#28a745' : '#ffc107',
                        color: stockUpdateModal.operation === 'add' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loadingInventory ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {loadingInventory ? 'Updating...' : stockUpdateModal.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockUpdateModal({ open: false, item: null, quantity: '', operation: 'add' })}
                      disabled={loadingInventory}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loadingInventory ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  )
}

export default App
