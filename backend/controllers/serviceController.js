import Service from '../models/Service.js';

// @desc    Get all services (with optional filters)
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
  try {
    const { category, isActive, search, sortBy } = req.query;

    // Build query
    const query = {};

    // Filter by category (CarWash, BikeWash, AddOn)
    if (category) {
      query.category = category;
    }

    // Filter by active status (default: only active services for customers)
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // Default: show only active services for public access
      query.isActive = true;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === 'price-low') {
      sortOptions = { basePrice: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { basePrice: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { rating: -1, totalReviews: -1 };
    } else {
      // Default: sort by category first, then by price (low to high)
      sortOptions = { category: 1, basePrice: 1 };
    }

    const services = await Service.find(query)
      .sort(sortOptions)
      .select('-createdBy -__v');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message,
    });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('addOnServices', 'name basePrice category')
      .select('-createdBy -__v');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Only return active services to public (unless admin)
    if (!service.isActive && !req.user?.role === 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message,
    });
  }
};

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
export const getPopularServices = async (req, res) => {
  try {
    const { category, limit = 5 } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .sort({ rating: -1, totalReviews: -1 })
      .limit(parseInt(limit))
      .select('name description category basePrice image rating totalReviews duration');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular services',
      error: error.message,
    });
  }
};

// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { sortBy } = req.query;

    // Validate category
    const validCategories = ['CarWash', 'BikeWash', 'AddOn'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: CarWash, BikeWash, AddOn',
      });
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === 'price-low') {
      sortOptions = { basePrice: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { basePrice: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const services = await Service.find({
      category,
      isActive: true,
    })
      .sort(sortOptions)
      .select('-createdBy -__v');

    res.status(200).json({
      success: true,
      count: services.length,
      category,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services by category',
      error: error.message,
    });
  }
};
