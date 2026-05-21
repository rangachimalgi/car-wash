import PackagePricing from '../models/PackagePricing.js';

const REQUIRED_KEYS = [
  'i1_e1_daily',
  'i1_e1_alternate',
  'i1_e2_daily',
  'i1_e2_alternate',
  'i2_e1_daily',
  'i2_e1_alternate',
  'i2_e2_daily',
  'i2_e2_alternate',
];

const DEFAULT_MATRIX = {
  i1_e1_daily: 1499,
  i1_e1_alternate: 1299,
  i1_e2_daily: 1799,
  i1_e2_alternate: 1599,
  i2_e1_daily: 1899,
  i2_e1_alternate: 1699,
  i2_e2_daily: 2199,
  i2_e2_alternate: 1999,
};

const DEFAULT_SLOTS = ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '10:00 AM - 11:00 AM'];

const validateMatrix = (matrix = {}) => {
  const missing = REQUIRED_KEYS.filter((key) => matrix[key] === undefined || matrix[key] === null);
  if (missing.length > 0) {
    return { valid: false, message: `Missing pricing keys: ${missing.join(', ')}` };
  }

  const invalid = REQUIRED_KEYS.filter((key) => Number(matrix[key]) < 0 || Number.isNaN(Number(matrix[key])));
  if (invalid.length > 0) {
    return { valid: false, message: `Invalid values for pricing keys: ${invalid.join(', ')}` };
  }

  return { valid: true };
};

const validatePackageCards = (cards = []) => {
  if (!Array.isArray(cards)) {
    return { valid: false, message: 'packageCards must be an array' };
  }

  for (const card of cards) {
    const name = String(card?.name || '').trim();
    const description = String(card?.description || '').trim();
    const image = String(card?.image || '').trim();
    const panelImage = String(card?.panelImage || '').trim();
    const times = Number(card?.times);
    const price = Number(card?.price);
    const addOnServiceIds = Array.isArray(card?.addOnServiceIds) ? card.addOnServiceIds : [];
    const coverageIncluded = Array.isArray(card?.coverageIncluded) ? card.coverageIncluded : [];
    const coverageNotIncluded = Array.isArray(card?.coverageNotIncluded) ? card.coverageNotIncluded : [];
    if (!name) {
      return { valid: false, message: 'Each package must include a package name' };
    }
    if (description.length > 800) {
      return { valid: false, message: 'Package description is too long' };
    }
    if (image && !/^https?:\/\//i.test(image) && !image.startsWith('/uploads/')) {
      return { valid: false, message: 'Package image must be a valid URL or /uploads path' };
    }
    if (panelImage && !/^https?:\/\//i.test(panelImage) && !panelImage.startsWith('/uploads/')) {
      return { valid: false, message: 'Panel image must be a valid URL or /uploads path' };
    }
    if (!Number.isFinite(times) || times < 1) {
      return { valid: false, message: 'Each package must include washes per month (times >= 1)' };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { valid: false, message: 'Each package must include a valid price (>= 0)' };
    }
    if (!Array.isArray(addOnServiceIds)) {
      return { valid: false, message: 'addOnServiceIds must be an array' };
    }
    if (!Array.isArray(coverageIncluded) || !Array.isArray(coverageNotIncluded)) {
      return { valid: false, message: 'coverageIncluded and coverageNotIncluded must be arrays' };
    }
  }

  return { valid: true };
};

const normalizeLegacyCards = (cards = [], matrix = DEFAULT_MATRIX) => {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((card) => {
      if (card?.name !== undefined && card?.times !== undefined && card?.price !== undefined) {
        return {
          name: String(card.name || '').trim(),
          description: String(card.description || '').trim(),
          image: String(card.image || '').trim(),
          panelImage: String(card.panelImage || '').trim(),
          times: Number(card.times),
          price: Number(card.price),
          addOnServiceIds: Array.isArray(card.addOnServiceIds) ? card.addOnServiceIds : [],
          coverageIncluded: Array.isArray(card.coverageIncluded) ? card.coverageIncluded.map((v) => String(v || '').trim()).filter(Boolean) : [],
          coverageNotIncluded: Array.isArray(card.coverageNotIncluded) ? card.coverageNotIncluded.map((v) => String(v || '').trim()).filter(Boolean) : [],
        };
      }
      const fallbackPrice = Number(matrix?.[card?.pricingKey] || 0);
      return {
        name: String(card?.title || '').trim(),
        description: '',
        image: '',
        panelImage: '',
        times: 1,
        price: fallbackPrice,
        addOnServiceIds: [],
        coverageIncluded: [],
        coverageNotIncluded: [],
      };
    })
    .filter((card) => card.name && Number.isFinite(card.times) && card.times >= 1 && Number.isFinite(card.price) && card.price >= 0);
};

// @desc    Get package pricing config
// @route   GET /api/package-pricing
// @access  Public
export const getPackagePricing = async (req, res) => {
  try {
    const app = req.query.app || 'customer';
    const vehicleType = req.query.vehicleType || 'car';

    let config = await PackagePricing.findOne({ app, vehicleType }).lean();

    if (!config) {
      const created = await PackagePricing.create({
        app,
        vehicleType,
        durationDays: 30,
        timeSlots: DEFAULT_SLOTS,
        pricingMatrix: DEFAULT_MATRIX,
        packageCards: [],
        isActive: true,
      });
      config = created.toObject();
    } else {
      const normalizedLegacy = normalizeLegacyCards(config.packageCards, config.pricingMatrix);
      if (normalizedLegacy.length > 0 && JSON.stringify(normalizedLegacy) !== JSON.stringify(config.packageCards)) {
        const patched = await PackagePricing.findOneAndUpdate(
          { app, vehicleType },
          { $set: { packageCards: normalizedLegacy } },
          { new: true }
        ).lean();
        config = patched || config;
      }
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching package pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package pricing',
      error: error.message,
    });
  }
};

// @desc    Create/Update package pricing config
// @route   PUT /api/package-pricing
// @access  Admin (auth middleware can be added later)
export const upsertPackagePricing = async (req, res) => {
  try {
    const app = req.body.app || req.query.app || 'customer';
    const vehicleType = req.body.vehicleType || req.query.vehicleType || 'car';
    const durationDays = Number(req.body.durationDays || 30);
    const timeSlots = Array.isArray(req.body.timeSlots) ? req.body.timeSlots : DEFAULT_SLOTS;
    const pricingMatrix = req.body.pricingMatrix || {};
    const packageCards = req.body.packageCards;
    const isActive = req.body.isActive !== undefined ? !!req.body.isActive : true;

    const validation = validateMatrix(pricingMatrix);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    if (durationDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'durationDays must be at least 1',
      });
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'timeSlots must be a non-empty array',
      });
    }

    const normalizedTimeSlots = timeSlots.map((slot) => String(slot || '').trim()).filter(Boolean);
    if (normalizedTimeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'timeSlots must contain at least one valid slot',
      });
    }

    const normalizedMatrix = REQUIRED_KEYS.reduce((acc, key) => {
      acc[key] = Number(pricingMatrix[key]);
      return acc;
    }, {});

    let cardsInput = packageCards;
    if (cardsInput === undefined) {
      const existingConfig = await PackagePricing.findOne({ app, vehicleType }).lean();
      if (Array.isArray(existingConfig?.packageCards) && existingConfig.packageCards.length > 0) {
        cardsInput = normalizeLegacyCards(existingConfig.packageCards, existingConfig.pricingMatrix);
      } else {
        cardsInput = [];
      }
    }
    const cardsValidation = validatePackageCards(cardsInput);
    if (!cardsValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cardsValidation.message,
      });
    }

    const normalizedCards = cardsInput.map((card) => ({
      name: String(card.name || '').trim(),
      description: String(card.description || '').trim(),
      image: String(card.image || '').trim(),
      panelImage: String(card.panelImage || '').trim(),
      times: Number(card.times),
      price: Number(card.price),
      addOnServiceIds: Array.isArray(card.addOnServiceIds)
        ? card.addOnServiceIds.map((id) => String(id || '').trim()).filter(Boolean)
        : [],
      coverageIncluded: Array.isArray(card.coverageIncluded)
        ? card.coverageIncluded.map((v) => String(v || '').trim()).filter(Boolean)
        : [],
      coverageNotIncluded: Array.isArray(card.coverageNotIncluded)
        ? card.coverageNotIncluded.map((v) => String(v || '').trim()).filter(Boolean)
        : [],
    }));

    const updated = await PackagePricing.findOneAndUpdate(
      { app, vehicleType },
      {
        app,
        vehicleType,
        durationDays,
        timeSlots: normalizedTimeSlots,
        pricingMatrix: normalizedMatrix,
        packageCards: normalizedCards,
        isActive,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Package pricing saved successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error saving package pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving package pricing',
      error: error.message,
    });
  }
};
