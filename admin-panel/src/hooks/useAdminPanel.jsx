import { useState, useEffect } from 'react'
import { API_BASE_URL, resolveUploadOrAbsoluteUrl } from '../config/api'
import {
  MAX_MEDIA_VIDEO_SIZE_BYTES,
  MAX_MEDIA_VIDEO_SIZE_MB,
  MAX_MEDIA_IMAGE_SIZE_BYTES,
  MAX_MEDIA_IMAGE_SIZE_MB,
  DEFAULT_PACKAGE_CARD,
} from '../utils/constants'
import { sortWashServicesForDisplay } from '../utils/sortWashServices'

export function useAdminPanel({ getFetchOptions, activeTab }) {
  
  // Services form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CarWash',
    basePrice: '',
    duration: '30 mins',
    image: '',
    panelImage: '',
    detailsPanelImage: '',
    listPrice: '',
    membershipDurationMonths: '12',
    membershipDiscountPercent: '20',
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
    applicableFor: [], // Array for CarWash, BikeWash, AutoWash, or any combination
  })

  // Coverage form data
  const [coverageFormData, setCoverageFormData] = useState({
    name: '',
    isActive: true,
    applicableFor: [], // Array for CarWash, BikeWash, AutoWash, or any combination
  })

  const [editingAddOnId, setEditingAddOnId] = useState(null)
  const [editingCoverageId, setEditingCoverageId] = useState(null)

  const [availableAddOns, setAvailableAddOns] = useState([])
  const [allAddOns, setAllAddOns] = useState([]) // All add-ons for listing
  const [addOnFilter, setAddOnFilter] = useState('car') // 'car', 'bike', 'auto'
  const [availableCoverage, setAvailableCoverage] = useState([])
  const [allCoverage, setAllCoverage] = useState([]) // All coverage items for listing
  const [coverageFilter, setCoverageFilter] = useState('car') // 'car', 'bike', 'auto'
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
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [allServices, setAllServices] = useState([])
  const [serviceFilter, setServiceFilter] = useState('car') // 'car', 'bike', 'auto', 'membership'
  const [serviceSearch, setServiceSearch] = useState('') // Search query
  const [draggingServiceId, setDraggingServiceId] = useState(null)
  const [editingServiceId, setEditingServiceId] = useState(null) // Track which service is being edited
  const [servicesError, setServicesError] = useState('')
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [uploadingPanelImage, setUploadingPanelImage] = useState(false)
  const [uploadingDetailsPanelImage, setUploadingDetailsPanelImage] = useState(false)
  const [uploadingPackageImage, setUploadingPackageImage] = useState(false)
  const [uploadingPackagePanelImage, setUploadingPackagePanelImage] = useState(false)
  
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
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null)
  const [employeeEditForm, setEmployeeEditForm] = useState({ name: '', phone: '', address: '', isActive: true })
  const [employeePasswordForm, setEmployeePasswordForm] = useState({ newPassword: '' })
  const [employeeEditMessage, setEmployeeEditMessage] = useState({ type: '', text: '' })
  const [employeePasswordMessage, setEmployeePasswordMessage] = useState({ type: '', text: '' })
  const [savingEmployeeDetails, setSavingEmployeeDetails] = useState(false)
  const [changingEmployeePassword, setChangingEmployeePassword] = useState(false)
  const [showCreateEmployeeForm, setShowCreateEmployeeForm] = useState(false)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [createEmployeeMessage, setCreateEmployeeMessage] = useState({ type: '', text: '' })
  const [employeeCreateForm, setEmployeeCreateForm] = useState({
    name: '',
    phone: '',
    address: '',
    password: '',
  })

  // Employee incentive targets (extra earnings above target)
  const [incentiveForm, setIncentiveForm] = useState({
    periodType: 'weekly',
    targetCount: 4,
    amountPerExtraService: 100,
    weekStartsOn: 1,
    isActive: true,
  })
  const [loadingIncentiveConfig, setLoadingIncentiveConfig] = useState(false)
  const [incentiveMessage, setIncentiveMessage] = useState({ type: '', text: '' })
  const [upsellForm, setUpsellForm] = useState({
    targetAmount: 3000,
    commissionPercent: 10,
    weekStartsOn: 1,
    isActive: true,
  })
  const [loadingUpsellConfig, setLoadingUpsellConfig] = useState(false)
  const [upsellMessage, setUpsellMessage] = useState({ type: '', text: '' })

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
    maxCapacity: '',
    unit: 'units',
    lowStockThreshold: '',
    description: '',
    supplier: '',
  })
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [inventoryMessage, setInventoryMessage] = useState({ type: '', text: '' })
  const [stockUpdateModal, setStockUpdateModal] = useState({ open: false, item: null, quantity: '', operation: 'add' })
  const [refillRequests, setRefillRequests] = useState([])
  const [pendingRefillCount, setPendingRefillCount] = useState(0)
  const [loadingRefillRequests, setLoadingRefillRequests] = useState(false)
  const [refillRequestFilter, setRefillRequestFilter] = useState('pending')

  // Media (testimonials, transformations, see the difference)
  const [mediaList, setMediaList] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [mediaMessage, setMediaMessage] = useState({ type: '', text: '' })
  const [testimonialMediaForm, setTestimonialMediaForm] = useState({ name: '', file: null, posterFile: null })
  const [transformationMediaForm, setTransformationMediaForm] = useState({ name: '', file: null, posterFile: null })
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [seeDiffMediaForm, setSeeDiffMediaForm] = useState({ name: '', file: null })
  const [homeSliderMediaForm, setHomeSliderMediaForm] = useState({ name: '', file: null })
  const [whyChooseMediaForm, setWhyChooseMediaForm] = useState({ title: '', description: '', file: null })
  const [loginBannerMediaForm, setLoginBannerMediaForm] = useState({ name: '', file: null })
  /** Remount file inputs after upload so the next pick always fires `onChange`. */
  const [mediaFileInputKey, setMediaFileInputKey] = useState({
    testimonials: 0,
    transformations: 0,
    seeTheDifference: 0,
    homeSliders: 0,
    whyChooseUs: 0,
    loginBanner: 0,
  })
  const [mediaPosterInputKey, setMediaPosterInputKey] = useState({
    testimonials: 0,
    transformations: 0,
  })

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
  const [newPackageCard, setNewPackageCard] = useState({ ...DEFAULT_PACKAGE_CARD, times: 2 })
  const [editingPackageCardIndex, setEditingPackageCardIndex] = useState(null)
  const [loadingPackagePricing, setLoadingPackagePricing] = useState(false)
  const [packagePricingMessage, setPackagePricingMessage] = useState({ type: '', text: '' })

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

  // Fetch inventory when inventory tab is active
  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'inventoryAlert' || activeTab === 'revenue') {
      fetchInventory()
      fetchRefillRequests()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'employeeIncentives') {
      fetchIncentiveConfig()
      fetchUpsellConfig()
    }
  }, [activeTab])

  // Fetch all add-ons for listing
  const fetchAllAddOns = async () => {
    setLoadingAllAddOns(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=AddOn&includeInactive=true`)
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
      const response = await fetch(`${API_BASE_URL}/services?category=Coverage&includeInactive=true`)
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
    if (addOnFilter === 'auto') {
      // Show add-ons that have AutoWash in applicableFor, or if applicableFor is empty/missing (legacy)
      return (addOn.applicableFor && addOn.applicableFor.includes('AutoWash')) ||
             (!addOn.applicableFor || addOn.applicableFor.length === 0)
    }
    return true
  })

  // Filter coverage based on selected filter
  const filteredCoverage = allCoverage.filter(item => {
    if (coverageFilter === 'car') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('CarWash')
    }
    if (coverageFilter === 'bike') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('BikeWash')
    }
    if (coverageFilter === 'auto') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('AutoWash')
    }
    return true
  })

  // For package creation: only CarWash applicable items (active only; admin list can include inactive)
  const packageCarWashAddOns = allAddOns.filter(
    (addOn) => addOn.isActive !== false && Array.isArray(addOn.applicableFor) && addOn.applicableFor.includes('CarWash')
  )
  const packageCarWashCoverage = allCoverage.filter(
    (item) => item.isActive !== false && Array.isArray(item.applicableFor) && item.applicableFor.includes('CarWash')
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
    if (activeTab === 'orders' || activeTab === 'revenue' || activeTab === 'activeWashes') {
      fetchOrders()
    }
    if (activeTab === 'reviews' || activeTab === 'revenue') {
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
              panelImage: card?.panelImage ?? '',
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
          panelImage: String(card.panelImage || '').trim(),
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

  const toggleNewPackageArrayValue = (field, value, checked) => {
    setNewPackageCard((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : []
      const next = checked ? [...current, value] : current.filter((item) => item !== value)
      return { ...prev, [field]: next }
    })
  }

  const handleCancelPackageCardEdit = () => {
    setEditingPackageCardIndex(null)
    setNewPackageCard({ ...DEFAULT_PACKAGE_CARD, times: 2 })
    setPackagePricingMessage({ type: '', text: '' })
  }

  const handleEditPackageCard = (index) => {
    const card = packagePricingForm.packageCards?.[index]
    if (!card) return
    setEditingPackageCardIndex(index)
    setNewPackageCard({
      name: card.name || '',
      description: card.description || '',
      image: card.image || '',
      panelImage: card.panelImage || '',
      times: card.times ?? 2,
      price: card.price ?? '',
      addOnServiceIds: Array.isArray(card.addOnServiceIds) ? [...card.addOnServiceIds] : [],
      coverageIncluded: Array.isArray(card.coverageIncluded) ? [...card.coverageIncluded] : [],
      coverageNotIncluded: Array.isArray(card.coverageNotIncluded) ? [...card.coverageNotIncluded] : [],
    })
    setPackagePricingMessage({ type: '', text: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreatePackageCard = () => {
    if (!String(newPackageCard.name || '').trim()) {
      setPackagePricingMessage({ type: 'error', text: 'Package name is required.' })
      return
    }
    if (!newPackageCard.times || Number(newPackageCard.times) <= 0) {
      setPackagePricingMessage({ type: 'error', text: 'Washes / Month must be greater than 0.' })
      return
    }
    if (newPackageCard.price === '' || Number(newPackageCard.price) < 0) {
      setPackagePricingMessage({ type: 'error', text: 'Price must be 0 or greater.' })
      return
    }

    const packageToSave = {
      ...newPackageCard,
      name: String(newPackageCard.name || '').trim(),
      description: String(newPackageCard.description || '').trim(),
      image: String(newPackageCard.image || '').trim(),
      panelImage: String(newPackageCard.panelImage || '').trim(),
      times: Number(newPackageCard.times || 0),
      price: Number(newPackageCard.price || 0),
    }

    if (editingPackageCardIndex != null) {
      setPackagePricingForm((prev) => {
        const cards = [...(prev.packageCards || [])]
        cards[editingPackageCardIndex] = packageToSave
        return { ...prev, packageCards: cards }
      })
      setEditingPackageCardIndex(null)
      setNewPackageCard({ ...DEFAULT_PACKAGE_CARD, times: 2 })
      setPackagePricingMessage({ type: 'success', text: 'Package updated. Click "Save Packages" to persist.' })
      return
    }

    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: [...(prev.packageCards || []), packageToSave],
    }))
    setNewPackageCard({ ...DEFAULT_PACKAGE_CARD, times: 2 })
    setPackagePricingMessage({ type: 'success', text: 'Package added. Click "Save Packages" to persist.' })
  }

  const deletePackageCardRow = (index) => {
    if (editingPackageCardIndex === index) {
      handleCancelPackageCardEdit()
    } else if (editingPackageCardIndex != null && editingPackageCardIndex > index) {
      setEditingPackageCardIndex(editingPackageCardIndex - 1)
    }
    setPackagePricingForm((prev) => ({
      ...prev,
      packageCards: (prev.packageCards || []).filter((_, idx) => idx !== index),
    }))
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      // Use admin route that doesn't require authentication
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`)
      const data = await response.json()
      if (data.success) {
        const nextOrders = data.data || []
        setOrders(nextOrders)
        setSelectedOrderId((prev) => {
          if (!nextOrders.length) return null
          if (prev && nextOrders.some((order) => order._id === prev)) return prev
          return nextOrders[0]._id
        })
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

  const handleCreateEmployee = async (e) => {
    e.preventDefault()
    const payload = {
      name: employeeCreateForm.name.trim(),
      phone: employeeCreateForm.phone.trim(),
      address: employeeCreateForm.address.trim(),
      password: employeeCreateForm.password,
    }

    if (!payload.name || !payload.phone || !payload.address || !payload.password) {
      setCreateEmployeeMessage({ type: 'error', text: 'Name, phone, address, and password are required.' })
      return
    }

    setCreatingEmployee(true)
    setCreateEmployeeMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload),
      }))
      const data = await response.json()
      if (data.success) {
        const generatedId = data?.data?.employeeId ? ` (${data.data.employeeId})` : ''
        setCreateEmployeeMessage({ type: 'success', text: `Employee created successfully${generatedId}.` })
        setEmployeeCreateForm({ name: '', phone: '', address: '', password: '' })
        await fetchEmployees()
        setShowCreateEmployeeForm(false)
      } else {
        setCreateEmployeeMessage({ type: 'error', text: data.message || 'Failed to create employee.' })
      }
    } catch (error) {
      setCreateEmployeeMessage({ type: 'error', text: error.message || 'Failed to create employee.' })
    } finally {
      setCreatingEmployee(false)
    }
  }

  const handleSaveEmployeeDetails = async (e) => {
    e.preventDefault()
    if (!selectedEmployeeDetails?.employeeId) return

    const payload = {
      name: employeeEditForm.name.trim(),
      phone: employeeEditForm.phone.trim(),
      address: employeeEditForm.address.trim(),
      isActive: Boolean(employeeEditForm.isActive),
    }
    if (!payload.name || !payload.phone || !payload.address) {
      setEmployeeEditMessage({ type: 'error', text: 'Name, phone, and address are required.' })
      return
    }

    setSavingEmployeeDetails(true)
    setEmployeeEditMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${encodeURIComponent(selectedEmployeeDetails.employeeId)}`, getFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      }))
      const data = await response.json()
      if (data.success && data.data) {
        setEmployeeEditMessage({ type: 'success', text: 'Employee details updated.' })
        setSelectedEmployeeDetails((prev) => (prev ? { ...prev, ...data.data } : prev))
        setEmployees((prev) => prev.map((emp) => (
          emp.employeeId === selectedEmployeeDetails.employeeId ? { ...emp, ...data.data } : emp
        )))
      } else {
        setEmployeeEditMessage({ type: 'error', text: data.message || 'Failed to update employee.' })
      }
    } catch (error) {
      setEmployeeEditMessage({ type: 'error', text: error.message || 'Failed to update employee.' })
    } finally {
      setSavingEmployeeDetails(false)
    }
  }

  const handleChangeEmployeePassword = async (e) => {
    e.preventDefault()
    if (!selectedEmployeeDetails?.employeeId) return

    const payload = {
      newPassword: employeePasswordForm.newPassword,
    }
    if (!payload.newPassword) {
      setEmployeePasswordMessage({ type: 'error', text: 'New password is required.' })
      return
    }

    setChangingEmployeePassword(true)
    setEmployeePasswordMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${encodeURIComponent(selectedEmployeeDetails.employeeId)}/password`, getFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      }))
      const data = await response.json()
      if (data.success) {
        setEmployeePasswordMessage({ type: 'success', text: 'Password reset successfully.' })
        setEmployeePasswordForm({ newPassword: '' })
      } else {
        setEmployeePasswordMessage({ type: 'error', text: data.message || 'Failed to change password.' })
      }
    } catch (error) {
      setEmployeePasswordMessage({ type: 'error', text: error.message || 'Failed to change password.' })
    } finally {
      setChangingEmployeePassword(false)
    }
  }

  const handleRemoveEmployee = async (employee) => {
    const employeeId = employee?.employeeId
    if (!employeeId) return

    const label = employee?.name ? `${employee.name} (${employeeId})` : employeeId
    const confirmed = window.confirm(`Remove employee ${label}?`)
    if (!confirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/employees/${encodeURIComponent(employeeId)}`, getFetchOptions({
        method: 'DELETE',
      }))
      const data = await response.json()
      if (!data.success) {
        window.alert(data.message || 'Failed to remove employee.')
        return
      }

      setEmployees((prev) => prev.filter((emp) => emp.employeeId !== employeeId))
      if (selectedEmployeeDetails?.employeeId === employeeId) {
        closeEmployeeDetails()
      }
      window.alert('Employee removed successfully.')
    } catch (error) {
      window.alert(error.message || 'Failed to remove employee.')
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

  const closeEmployeeDetails = () => {
    setSelectedEmployeeDetails(null)
    setEmployeeEditMessage({ type: '', text: '' })
    setEmployeePasswordMessage({ type: '', text: '' })
    setEmployeePasswordForm({ newPassword: '' })
  }

  const fetchIncentiveConfig = async () => {
    setLoadingIncentiveConfig(true)
    setIncentiveMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/employee-incentives/config`)
      const data = await res.json()
      if (data.success && data.data) {
        const c = data.data
        setIncentiveForm({
          periodType: c.periodType || 'weekly',
          targetCount: c.targetCount ?? 4,
          amountPerExtraService: c.amountPerExtraService ?? 100,
          weekStartsOn: c.weekStartsOn ?? 1,
          isActive: c.isActive !== false,
        })
      }
    } catch (e) {
      setIncentiveMessage({ type: 'error', text: e.message || 'Failed to load' })
    } finally {
      setLoadingIncentiveConfig(false)
    }
  }

  const fetchUpsellConfig = async () => {
    setLoadingUpsellConfig(true)
    setUpsellMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/employee-incentives/upsell-config`)
      const data = await res.json()
      if (data.success && data.data) {
        const c = data.data
        setUpsellForm({
          targetAmount: c.targetAmount ?? 3000,
          commissionPercent: c.commissionPercent ?? 10,
          weekStartsOn: c.weekStartsOn ?? 1,
          isActive: c.isActive !== false,
        })
      }
    } catch (e) {
      setUpsellMessage({ type: 'error', text: e.message || 'Failed to load' })
    } finally {
      setLoadingUpsellConfig(false)
    }
  }

  const handleUpsellSubmit = async (e) => {
    e.preventDefault()
    setLoadingUpsellConfig(true)
    setUpsellMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/employee-incentives/upsell-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAmount: Number(upsellForm.targetAmount),
          commissionPercent: Number(upsellForm.commissionPercent),
          weekStartsOn: Number(upsellForm.weekStartsOn),
          isActive: upsellForm.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUpsellMessage({ type: 'success', text: 'Upsell settings saved.' })
        if (data.data) {
          const c = data.data
          setUpsellForm({
            targetAmount: c.targetAmount ?? 3000,
            commissionPercent: c.commissionPercent ?? 10,
            weekStartsOn: c.weekStartsOn ?? 1,
            isActive: c.isActive !== false,
          })
        }
      } else {
        setUpsellMessage({ type: 'error', text: data.message || 'Failed to save' })
      }
    } catch (err) {
      setUpsellMessage({ type: 'error', text: err.message || 'Failed to save' })
    } finally {
      setLoadingUpsellConfig(false)
    }
  }

  const handleIncentiveSubmit = async (e) => {
    e.preventDefault()
    setLoadingIncentiveConfig(true)
    setIncentiveMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/employee-incentives/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType: incentiveForm.periodType,
          targetCount: Number(incentiveForm.targetCount),
          amountPerExtraService: Number(incentiveForm.amountPerExtraService),
          weekStartsOn: Number(incentiveForm.weekStartsOn),
          isActive: incentiveForm.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIncentiveMessage({ type: 'success', text: 'Saved.' })
        if (data.data) {
          const c = data.data
          setIncentiveForm({
            periodType: c.periodType || 'weekly',
            targetCount: c.targetCount ?? 4,
            amountPerExtraService: c.amountPerExtraService ?? 100,
            weekStartsOn: c.weekStartsOn ?? 1,
            isActive: c.isActive !== false,
          })
        }
      } else {
        setIncentiveMessage({ type: 'error', text: data.message || 'Failed to save' })
      }
    } catch (err) {
      setIncentiveMessage({ type: 'error', text: err.message || 'Failed to save' })
    } finally {
      setLoadingIncentiveConfig(false)
    }
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

  const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-IN')
  }

  // Fetch inventory items
  const fetchInventory = async () => {
    setLoadingInventory(true)
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`)
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

    const maxCap = Number(inventoryFormData.maxCapacity)
    if (!inventoryFormData.maxCapacity || Number.isNaN(maxCap) || maxCap <= 0) {
      setInventoryMessage({ type: 'error', text: 'Max capacity is required (e.g. 20 bottles on the shelf).' })
      setLoadingInventory(false)
      return
    }

    if (Number(inventoryFormData.currentStock) > maxCap) {
      setInventoryMessage({ type: 'error', text: 'Current stock cannot be greater than max capacity.' })
      setLoadingInventory(false)
      return
    }

    try {
      const inventoryData = {
        name: inventoryFormData.name.trim(),
        category: inventoryFormData.category,
        currentStock: Number(inventoryFormData.currentStock),
        unit: inventoryFormData.unit.trim(),
        lowStockThreshold: Number(inventoryFormData.lowStockThreshold),
        description: inventoryFormData.description.trim(),
        supplier: inventoryFormData.supplier.trim(),
        maxCapacity: maxCap,
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
          maxCapacity: '',
          unit: 'units',
          lowStockThreshold: '',
          description: '',
          supplier: '',
        })
        setEditingInventoryId(null)
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
          maxCapacity: item.maxCapacity != null ? String(item.maxCapacity) : '',
          unit: item.unit || 'units',
          lowStockThreshold: String(item.lowStockThreshold || ''),
          description: item.description || '',
          supplier: item.supplier || '',
        })
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
      maxCapacity: '',
      unit: 'units',
      lowStockThreshold: '',
      description: '',
      supplier: '',
    })
  }

  const fetchPendingRefillCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/refill-requests?status=pending`)
      const data = await response.json()
      if (data.success) {
        setPendingRefillCount(data.count ?? (data.data?.length ?? 0))
      }
    } catch (error) {
      console.error('Error fetching pending refill count:', error)
    }
  }

  const fetchRefillRequests = async () => {
    setLoadingRefillRequests(true)
    try {
      const params = refillRequestFilter !== 'all' ? `?status=${refillRequestFilter}` : ''
      const response = await fetch(`${API_BASE_URL}/inventory/refill-requests${params}`)
      const data = await response.json()
      if (data.success) {
        setRefillRequests(data.data || [])
      } else {
        console.error('Error fetching refill requests:', data.message)
        setInventoryMessage({ type: 'error', text: data.message || 'Error fetching refill requests' })
      }
      await fetchPendingRefillCount()
    } catch (error) {
      console.error('Error fetching refill requests:', error)
      setInventoryMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingRefillRequests(false)
    }
  }

  const handleReviewRefillRequest = async (requestId, action) => {
    const isReject = action === 'reject'
    let adminNote = ''
    if (isReject) {
      adminNote = window.prompt('Optional note for the employee (reason for rejection):') || ''
      if (!window.confirm('Reject this refill request?')) return
    } else if (!window.confirm('Approve this refill? Stock updates when the employee confirms receipt in the app.')) {
      return
    }

    setLoadingRefillRequests(true)
    setInventoryMessage({ type: '', text: '' })
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/refill-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: adminNote.trim() || undefined }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setInventoryMessage({ type: 'success', text: data.message })
        fetchRefillRequests()
        if (action === 'approve') {
          fetchPendingRefillCount()
        } else {
          fetchInventory()
        }
      } else {
        setInventoryMessage({ type: 'error', text: data.message || 'Failed to update refill request' })
      }
    } catch (error) {
      console.error('Error reviewing refill request:', error)
      setInventoryMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingRefillRequests(false)
    }
  }

  useEffect(() => {
    fetchPendingRefillCount()
  }, [])

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
      const response = await fetch(`${API_BASE_URL}/services?includeInactive=true`)
      const data = await response.json()
      if (data.success) {
        const services = (data.data || []).filter(
          (s) =>
            s.category === 'CarWash' ||
            s.category === 'BikeWash' ||
            s.category === 'AutoWash' ||
            s.category === 'Membership'
        )
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

  // Filter services by tab + search (washes or membership)
  const filteredServices = sortWashServicesForDisplay(allServices.filter(service => {
    if (service.category === 'Membership') {
      if (serviceFilter !== 'membership') return false
    } else {
      if (serviceFilter === 'car' && service.category !== 'CarWash') return false
      if (serviceFilter === 'bike' && service.category !== 'BikeWash') return false
      if (serviceFilter === 'auto' && service.category !== 'AutoWash') return false
      if (serviceFilter === 'membership') return false
    }

    if (serviceSearch) {
      const searchLower = serviceSearch.toLowerCase()
      const matchesName = service.name?.toLowerCase().includes(searchLower)
      const matchesDescription = service.description?.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesDescription) return false
    }

    return true
  }))

  const persistWashServiceOrder = async (category, orderedIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/wash-order`, getFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ category, orderedIds }),
      }))
      const data = await response.json()
      if (response.ok && data.success) {
        await fetchAllServices()
      } else {
        window.alert(data.message || 'Failed to save display order')
      }
    } catch (error) {
      console.error(error)
      window.alert(error.message || 'Failed to save display order')
    }
  }

  const handleWashServiceDragStart = (e, serviceId) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(serviceId))
    setDraggingServiceId(serviceId)
  }

  const handleWashServiceDragEnd = () => {
    setDraggingServiceId(null)
  }

  const handleWashServiceDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleWashServiceDrop = (e, targetService) => {
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/plain')
    setDraggingServiceId(null)
    if (serviceSearch || !fromId || !targetService?._id) return
    if (String(fromId) === String(targetService._id)) return
    const catMap = { car: 'CarWash', bike: 'BikeWash', auto: 'AutoWash' }
    const category = catMap[serviceFilter]
    if (!category) return
    const orderedIds = filteredServices.map((s) => s._id)
    const fromIdx = orderedIds.findIndex((id) => String(id) === String(fromId))
    const toIdx = orderedIds.findIndex((id) => String(id) === String(targetService._id))
    if (fromIdx < 0 || toIdx < 0) return
    const next = [...orderedIds]
    const [removed] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, removed)
    persistWashServiceOrder(category, next)
  }
  const categoryCounts = {
    car: allServices.filter((s) => s.category === 'CarWash').length,
    bike: allServices.filter((s) => s.category === 'BikeWash').length,
    auto: allServices.filter((s) => s.category === 'AutoWash').length,
    membership: allServices.filter((s) => s.category === 'Membership').length,
  }

  const washReorderEnabled =
    (serviceFilter === 'car' || serviceFilter === 'bike' || serviceFilter === 'auto') && !serviceSearch

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

  const uploadServiceImageFiles = async (files) => {
    const uploadedUrls = []
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      const opts = getFetchOptions()
      const headers = { ...(opts.headers || {}) }
      delete headers['Content-Type']
      const res = await fetch(`${API_BASE_URL}/services/upload-image`, {
        ...opts,
        method: 'POST',
        headers,
        body,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed')
      }
      uploadedUrls.push(data.data.url)
    }
    return uploadedUrls
  }

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingMainImage(true)
    try {
      const [uploadedUrl] = await uploadServiceImageFiles([file])
      setFormData((prev) => ({ ...prev, image: uploadedUrl || '' }))
      setMessage({ type: 'success', text: 'Main image uploaded' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload main image' })
    } finally {
      setUploadingMainImage(false)
    }
  }

  const handlePanelImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingPanelImage(true)
    try {
      const [uploadedUrl] = await uploadServiceImageFiles([file])
      setFormData((prev) => ({ ...prev, panelImage: uploadedUrl || '' }))
      setMessage({ type: 'success', text: 'Panel image uploaded' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload panel image' })
    } finally {
      setUploadingPanelImage(false)
    }
  }

  const handleClearPanelImage = () => {
    setFormData((prev) => ({ ...prev, panelImage: '' }))
  }

  const handleDetailsPanelImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingDetailsPanelImage(true)
    try {
      const [uploadedUrl] = await uploadServiceImageFiles([file])
      setFormData((prev) => ({ ...prev, detailsPanelImage: uploadedUrl || '' }))
      setMessage({ type: 'success', text: 'View Details panel image uploaded' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload View Details panel image' })
    } finally {
      setUploadingDetailsPanelImage(false)
    }
  }

  const handleClearDetailsPanelImage = () => {
    setFormData((prev) => ({ ...prev, detailsPanelImage: '' }))
  }

  const handlePackageImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingPackageImage(true)
    setPackagePricingMessage({ type: '', text: '' })
    try {
      const [uploadedUrl] = await uploadServiceImageFiles([file])
      setNewPackageCard((prev) => ({ ...prev, image: uploadedUrl || '' }))
      setPackagePricingMessage({ type: 'success', text: 'Package image uploaded to storage.' })
    } catch (error) {
      setPackagePricingMessage({ type: 'error', text: error.message || 'Failed to upload package image' })
    } finally {
      setUploadingPackageImage(false)
    }
  }

  const handleClearPackageImage = () => {
    setNewPackageCard((prev) => ({ ...prev, image: '' }))
  }

  const handlePackagePanelImageUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingPackagePanelImage(true)
    setPackagePricingMessage({ type: '', text: '' })
    try {
      const [uploadedUrl] = await uploadServiceImageFiles([file])
      setNewPackageCard((prev) => ({ ...prev, panelImage: uploadedUrl || '' }))
      setPackagePricingMessage({ type: 'success', text: 'Panel image uploaded to storage.' })
    } catch (error) {
      setPackagePricingMessage({ type: 'error', text: error.message || 'Failed to upload panel image' })
    } finally {
      setUploadingPackagePanelImage(false)
    }
  }

  const handleClearPackagePanelImage = () => {
    setNewPackageCard((prev) => ({ ...prev, panelImage: '' }))
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
          panelImage: service.panelImage || '',
          detailsPanelImage: service.detailsPanelImage || '',
          listPrice: String(service.listPrice ?? ''),
          membershipDurationMonths: String(service.membershipDurationMonths ?? '12'),
          membershipDiscountPercent: String(service.membershipDiscountPercent ?? '0'),
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

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/services/${service._id}`, {
        ...getFetchOptions(),
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        if (editingServiceId && String(editingServiceId) === String(service._id)) handleNewService()
        setMessage({ type: 'success', text: 'Service deleted.' })
        fetchAllServices()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete service' })
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete service' })
    }
  }

  // Reset form to create new service
  const handleNewService = () => {
    setEditingServiceId(null)
    setFormData({
      name: '',
      description: '',
      category: serviceFilter === 'membership' ? 'Membership' : 'CarWash',
      basePrice: '',
      duration: serviceFilter === 'membership' ? '' : '30 mins',
      image: '',
      panelImage: '',
      detailsPanelImage: '',
      listPrice: '',
      membershipDurationMonths: '12',
      membershipDiscountPercent: '20',
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
      const isWashCategory =
        formData.category === 'CarWash' ||
        formData.category === 'BikeWash' ||
        formData.category === 'AutoWash'

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

      let serviceData

      if (formData.category === 'Membership') {
        const lp = parseFloat(formData.listPrice)
        const months = parseInt(formData.membershipDurationMonths, 10)
        const disc = parseFloat(formData.membershipDiscountPercent)
        serviceData = {
          name: formData.name.trim(),
          description: (formData.description || '').trim(),
          category: 'Membership',
          basePrice: parseFloat(formData.basePrice),
          duration: (formData.duration || '').trim(),
          image: formData.image,
          panelImage: formData.panelImage || '',
          detailsPanelImage: formData.detailsPanelImage || '',
          images: [],
          specifications: { coverage: [], notIncluded: [] },
          addOnServices: [],
          packages: { monthly: [], quarterly: [], yearly: [] },
          applicableFor: [],
          listPrice: Number.isFinite(lp) ? lp : 0,
          membershipDurationMonths:
            Number.isFinite(months) && months > 0 ? months : 12,
          membershipDiscountPercent: Number.isFinite(disc)
            ? Math.min(100, Math.max(0, disc))
            : 0,
        }
      } else {
        const coverage = isWashCategory ? selectedCoverage : []

        const notIncluded = isWashCategory
          ? availableCoverage
              .map(item => item.name)
              .filter(name => !selectedCoverage.includes(name))
          : []

        const applicableAddOnIds = isWashCategory
          ? availableAddOns.map(addOn => addOn._id)
          : []

        serviceData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          basePrice: parseFloat(formData.basePrice),
          duration: formData.duration,
          image: formData.image,
          panelImage: formData.panelImage || '',
          detailsPanelImage: formData.detailsPanelImage || '',
          images: [],
          specifications: {
            coverage: coverage,
            notIncluded: notIncluded,
          },
          addOnServices: applicableAddOnIds,
          packages: formatPackages(formData.packages),
        }
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

  const handleNewAddOn = () => {
    setEditingAddOnId(null)
    setAddOnFormData({
      name: '',
      basePrice: '',
      isActive: true,
      applicableFor: [],
    })
    setAddOnMessage({ type: '', text: '' })
  }

  const handleNewCoverage = () => {
    setEditingCoverageId(null)
    setCoverageFormData({
      name: '',
      isActive: true,
      applicableFor: [],
    })
    setCoverageMessage({ type: '', text: '' })
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
      const existing = editingAddOnId ? allAddOns.find((a) => a._id === editingAddOnId) : null
      const addOnData = {
        name: addOnFormData.name,
        category: 'AddOn', // Always AddOn for add-ons
        basePrice: parseFloat(addOnFormData.basePrice),
        isActive: addOnFormData.isActive,
        applicableFor: addOnFormData.applicableFor || [], // CarWash, BikeWash, or both
        addOnServices: existing?.addOnServices || [],
        packages: existing?.packages || {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const url = editingAddOnId
        ? `${API_BASE_URL}/services/${editingAddOnId}`
        : `${API_BASE_URL}/services`
      const method = editingAddOnId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addOnData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAddOnMessage({
          type: 'success',
          text: editingAddOnId ? 'Add-On updated successfully!' : 'Add-On created successfully!',
        })
        handleNewAddOn()
        fetchAddOns()
        fetchAllAddOns()
      } else {
        setAddOnMessage({ 
          type: 'error', 
          text: data.message || (editingAddOnId ? 'Failed to update add-on' : 'Failed to create add-on')
        })
      }
    } catch (error) {
      console.error('Error saving add-on:', error)
      setAddOnMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoadingAddOn(false)
    }
  }

  const handleDeleteAddOn = async (addOn) => {
    if (!window.confirm(`Delete add-on "${addOn.name}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/services/${addOn._id}`, { ...getFetchOptions(), method: 'DELETE' })
      const data = await response.json()
      if (response.ok && data.success) {
        if (editingAddOnId && String(editingAddOnId) === String(addOn._id)) handleNewAddOn()
        setAddOnMessage({ type: 'success', text: 'Add-on deleted.' })
        fetchAddOns()
        fetchAllAddOns()
      } else {
        setAddOnMessage({ type: 'error', text: data.message || 'Failed to delete add-on' })
      }
    } catch (error) {
      console.error('Error deleting add-on:', error)
      setAddOnMessage({ type: 'error', text: error.message || 'Failed to delete add-on' })
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
      const existing = editingCoverageId ? allCoverage.find((c) => c._id === editingCoverageId) : null
      const coverageData = {
        name: coverageFormData.name,
        category: 'Coverage',
        basePrice: 0,
        isActive: coverageFormData.isActive,
        applicableFor: coverageFormData.applicableFor || [],
        addOnServices: existing?.addOnServices || [],
        packages: existing?.packages || {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const url = editingCoverageId
        ? `${API_BASE_URL}/services/${editingCoverageId}`
        : `${API_BASE_URL}/services`
      const method = editingCoverageId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coverageData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCoverageMessage({
          type: 'success',
          text: editingCoverageId ? 'Coverage item updated successfully!' : 'Coverage item created successfully!',
        })
        handleNewCoverage()
        fetchCoverage()
        fetchAllCoverage()
      } else {
        setCoverageMessage({
          type: 'error',
          text: data.message || (editingCoverageId ? 'Failed to update coverage item' : 'Failed to create coverage item')
        })
      }
    } catch (error) {
      console.error('Error saving coverage item:', error)
      setCoverageMessage({
        type: 'error',
        text: error.message || 'Network error. Please check if backend is running.'
      })
    } finally {
      setLoadingCoverage(false)
    }
  }

  const handleDeleteCoverage = async (item) => {
    if (!window.confirm(`Delete coverage "${item.name}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/services/${item._id}`, { ...getFetchOptions(), method: 'DELETE' })
      const data = await response.json()
      if (response.ok && data.success) {
        if (editingCoverageId && String(editingCoverageId) === String(item._id)) handleNewCoverage()
        setCoverageMessage({ type: 'success', text: 'Coverage item deleted.' })
        fetchCoverage()
        fetchAllCoverage()
      } else {
        setCoverageMessage({ type: 'error', text: data.message || 'Failed to delete coverage item' })
      }
    } catch (error) {
      console.error('Error deleting coverage item:', error)
      setCoverageMessage({ type: 'error', text: error.message || 'Failed to delete coverage item' })
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

  const uploadMediaFile = async (type, formState, setFormState) => {
    const isImageMedia =
      type === 'seeTheDifference' ||
      type === 'homeSliders' ||
      type === 'whyChooseUs' ||
      type === 'loginBanner'
    if (type === 'whyChooseUs') {
      if (!formState.title?.trim() || !formState.description?.trim()) {
        setMediaMessage({ type: 'error', text: 'Title and description are required' })
        return
      }
    }
    if (!formState.file) {
      setMediaMessage({
        type: 'error',
        text: isImageMedia ? 'Please select an image' : 'Please select a video file',
      })
      return
    }
    const maxBytes = isImageMedia ? MAX_MEDIA_IMAGE_SIZE_BYTES : MAX_MEDIA_VIDEO_SIZE_BYTES
    const maxMb = isImageMedia ? MAX_MEDIA_IMAGE_SIZE_MB : MAX_MEDIA_VIDEO_SIZE_MB
    const kind = isImageMedia ? 'image' : 'video'
    if (formState.file.size > maxBytes) {
      const msg = `Size limit exceeded. Max allowed is ${maxMb} MB per ${kind}.`
      setMediaMessage({ type: 'error', text: msg })
      window.alert(msg)
      return
    }
    setUploadingMedia(true)
    setMediaMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('type', type)
      if (type === 'whyChooseUs') {
        formData.append('title', formState.title.trim())
        formData.append('description', formState.description.trim())
      } else {
        formData.append('name', formState.name)
      }
      formData.append('file', formState.file)
      if (formState.posterFile) {
        formData.append('poster', formState.posterFile)
      }
      const opts = getFetchOptions()
      const headers = { ...opts.headers }
      delete headers['Content-Type']
      const res = await fetch(`${API_BASE_URL}/media`, { ...opts, method: 'POST', headers, body: formData })
      const data = await res.json()
      if (data.success) {
        setMediaMessage({ type: 'success', text: 'Uploaded successfully' })
        setFormState(
          type === 'whyChooseUs'
            ? { title: '', description: '', file: null }
            : { name: '', file: null, posterFile: null }
        )
        setMediaFileInputKey((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
        if (type === 'testimonials' || type === 'transformations') {
          setMediaPosterInputKey((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
        }
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
        setCouponMessage({ type: 'error', text: data.message || 'Failed to load Woosh Coins' })
      }
    } catch (e) {
      setCouponMessage({ type: 'error', text: e.message || 'Failed to load Woosh Coins' })
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
        setCouponMessage({ type: 'success', text: 'Woosh Coin created successfully' })
        setCouponForm({
          code: '',
          discountValue: '',
          perUserLimit: '1',
        })
        fetchCoupons()
      } else {
        setCouponMessage({ type: 'error', text: data.message || 'Failed to create Woosh Coin' })
      }
    } catch (e) {
      setCouponMessage({ type: 'error', text: e.message || 'Failed to create Woosh Coin' })
    }
  }

  const completedStatuses = ['completed', 'delivered', 'done']
  const closedStatuses = ['cancelled', 'canceled', 'rejected', 'failed']
  const completedOrders = orders.filter((order) => completedStatuses.includes(String(order?.status || '').toLowerCase()))
  const pendingOrders = orders.filter((order) => {
    const status = String(order?.status || '').toLowerCase()
    return !completedStatuses.includes(status) && !closedStatuses.includes(status)
  })


  return {
    activeTab,
    addOnFilter,
    addOnFormData,
    addOnMessage,
    allAddOns,
    allCoverage,
    allServices,
    attendance,
    attendanceDate,
    availableAddOns,
    availableCoverage,
    changingEmployeePassword,
    closeDocumentView,
    closeEmployeeDetails,
    closedStatuses,
    completedOrders,
    completedStatuses,
    couponForm,
    couponMessage,
    coupons,
    coverageFilter,
    coverageFormData,
    coverageMessage,
    createEmployeeMessage,
    creatingEmployee,
    creditCustomerWallet,
    dailyOverrideMessage,
    dailyOverrideSlots,
    defaultSlotsCount,
    defaultStartHour,
    deleteMediaItem,
    deletePackageCardRow,
    documentViewEmployee,
    documentViewUrls,
    draggingServiceId,
    editingAddOnId,
    editingCoverageId,
    editingInventoryId,
    editingPackageCardIndex,
    editingServiceId,
    editingTimeSlotId,
    employeeCreateForm,
    employeeEditForm,
    employeeEditMessage,
    employeePasswordForm,
    employeePasswordMessage,
    employees,
    fetchAddOns,
    fetchAllAddOns,
    fetchAllCoverage,
    fetchAllServices,
    fetchAttendance,
    fetchCoupons,
    fetchCoverage,
    fetchEmployees,
    fetchIncentiveConfig,
    fetchInventory,
    fetchMedia,
    fetchOrders,
    fetchPackagePricing,
    fetchPendingRefillCount,
    fetchRefillRequests,
    fetchReviews,
    fetchTimeSlots,
    fetchUpsellConfig,
    filteredAddOns,
    filteredCoverage,
    filteredInventory,
    filteredServices,
    formData,
    formatDateTime,
    formatTime,
    getAttendanceSummary,
    getEmployeeInfo,
    getFetchOptions,
    getInventorySummary,
    getTimeSlotsFromDB,
    handleAddOnChange,
    handleAddOnSubmit,
    handleCancelPackageCardEdit,
    handleChange,
    handleChangeEmployeePassword,
    handleClearDetailsPanelImage,
    handleClearPackageImage,
    handleClearPackagePanelImage,
    handleClearPanelImage,
    handleCoverageChange,
    handleCoverageSubmit,
    handleCreateCoupon,
    handleCreateEmployee,
    handleCreatePackageCard,
    handleDeleteAddOn,
    handleDeleteCoverage,
    handleDeleteDailyOverride,
    handleDeleteInventory,
    handleDeleteService,
    handleDeleteTimeSlot,
    handleDetailsPanelImageUpload,
    handleEditInventory,
    handleEditPackageCard,
    handleEditService,
    handleEditTimeSlot,
    handleIncentiveSubmit,
    handleInventoryChange,
    handleInventorySubmit,
    handleMainImageUpload,
    handleNewAddOn,
    handleNewCoverage,
    handleNewInventory,
    handleNewService,
    handleNewTimeSlot,
    handlePackageImageUpload,
    handlePackagePanelImageUpload,
    handlePackagePricingSubmit,
    handlePanelImageUpload,
    handleRemoveEmployee,
    handleResetToDefaults,
    handleReviewRefillRequest,
    handleSaveDailyOverride,
    handleSaveEmployeeDetails,
    handleStockUpdate,
    handleSubmit,
    handleTimeSlotChange,
    handleTimeSlotSubmit,
    handleUpsellSubmit,
    handleWashServiceDragEnd,
    handleWashServiceDragOver,
    handleWashServiceDragStart,
    handleWashServiceDrop,
    homeSliderMediaForm,
    incentiveForm,
    incentiveMessage,
    inventory,
    inventoryCategoryFilter,
    inventoryFilter,
    inventoryFormData,
    inventoryMessage,
    inventorySearch,
    loading,
    loadingAddOn,
    loadingAddOns,
    loadingAllAddOns,
    loadingAllCoverage,
    loadingAllServices,
    loadingAttendance,
    loadingCoupons,
    loadingCoverage,
    loadingDailyOverride,
    loadingDocumentView,
    loadingEmployees,
    loadingIncentiveConfig,
    loadingInventory,
    loadingMedia,
    loadingOrders,
    loadingPackagePricing,
    loadingRefillRequests,
    loadingReviews,
    loadingTimeSlots,
    loadingUpsellConfig,
    loginBannerMediaForm,
    markOrderDelivered,
    mediaFileInputKey,
    mediaList,
    mediaMessage,
    mediaPosterInputKey,
    message,
    newPackageCard,
    openEmployeeDocuments,
    orders,
    packagePricingForm,
    packagePricingMessage,
    pendingOrders,
    pendingRefillCount,
    refillRequestFilter,
    refillRequests,
    reviews,
    savingEmployeeDetails,
    seeDiffMediaForm,
    selectedCoverage,
    selectedEmployeeDetails,
    selectedEmployeeId,
    selectedOrderId,
    selectedOverrideDate,
    serviceFilter,
    serviceSearch,
    servicesError,
    setAddOnFilter,
    setAddOnFormData,
    setAddOnMessage,
    setAllAddOns,
    setAllCoverage,
    setAllServices,
    setAttendance,
    setAttendanceDate,
    setAvailableAddOns,
    setAvailableCoverage,
    setChangingEmployeePassword,
    setCouponForm,
    setCouponMessage,
    setCoupons,
    setCoverageFilter,
    setCoverageFormData,
    setCoverageMessage,
    setCreateEmployeeMessage,
    setCreatingEmployee,
    setDailyOverrideMessage,
    setDailyOverrideSlots,
    setDefaultSlotsCount,
    setDefaultStartHour,
    setDocumentViewEmployee,
    setDocumentViewUrls,
    setDraggingServiceId,
    setEditingAddOnId,
    setEditingCoverageId,
    setEditingInventoryId,
    setEditingPackageCardIndex,
    setEditingServiceId,
    setEditingTimeSlotId,
    setEmployeeCreateForm,
    setEmployeeEditForm,
    setEmployeeEditMessage,
    setEmployeePasswordForm,
    setEmployeePasswordMessage,
    setEmployees,
    setFormData,
    setHomeSliderMediaForm,
    setIncentiveForm,
    setIncentiveMessage,
    setInventory,
    setInventoryCategoryFilter,
    setInventoryFilter,
    setInventoryFormData,
    setInventoryMessage,
    setInventorySearch,
    setLoading,
    setLoadingAddOn,
    setLoadingAddOns,
    setLoadingAllAddOns,
    setLoadingAllCoverage,
    setLoadingAllServices,
    setLoadingAttendance,
    setLoadingCoupons,
    setLoadingCoverage,
    setLoadingDailyOverride,
    setLoadingDocumentView,
    setLoadingEmployees,
    setLoadingIncentiveConfig,
    setLoadingInventory,
    setLoadingMedia,
    setLoadingOrders,
    setLoadingPackagePricing,
    setLoadingRefillRequests,
    setLoadingReviews,
    setLoadingTimeSlots,
    setLoadingUpsellConfig,
    setLoginBannerMediaForm,
    setMediaFileInputKey,
    setMediaList,
    setMediaMessage,
    setMediaPosterInputKey,
    setMessage,
    setNewPackageCard,
    setOrders,
    setPackagePricingForm,
    setPackagePricingMessage,
    setPendingRefillCount,
    setRefillRequestFilter,
    setRefillRequests,
    setReviews,
    setSavingEmployeeDetails,
    setSeeDiffMediaForm,
    setSelectedCoverage,
    setSelectedEmployeeDetails,
    setSelectedEmployeeId,
    setSelectedOrderId,
    setSelectedOverrideDate,
    setServiceFilter,
    setServiceSearch,
    setServicesError,
    setShowCreateEmployeeForm,
    setStockUpdateModal,
    setTestimonialMediaForm,
    setTimeSlotFormData,
    setTimeSlotMessage,
    setTimeSlots,
    setTimeSlotsError,
    setTransformationMediaForm,
    setUploadingDetailsPanelImage,
    setUploadingMainImage,
    setUploadingMedia,
    setUploadingPackageImage,
    setUploadingPackagePanelImage,
    setUploadingPanelImage,
    setUpsellForm,
    setUpsellMessage,
    setWhyChooseMediaForm,
    showCreateEmployeeForm,
    stockUpdateModal,
    testimonialMediaForm,
    timeSlotFormData,
    timeSlotMessage,
    timeSlots,
    timeSlotsError,
    transformationMediaForm,
    uploadingDetailsPanelImage,
    uploadingMainImage,
    uploadingMedia,
    uploadingPackageImage,
    uploadingPackagePanelImage,
    uploadingPanelImage,
    upsellForm,
    upsellMessage,
    washReorderEnabled,
    whyChooseMediaForm,
    categoryCounts,
    packageCarWashAddOns,
    packageCarWashCoverage,
    toggleNewPackageArrayValue,
    loadDailyOverride,
    addSlotToOverride,
    toggleCoverage,
    uploadMediaFile,
    renderPackageSection,
    resolveUploadOrAbsoluteUrl,
    API_BASE_URL,
  }
}
