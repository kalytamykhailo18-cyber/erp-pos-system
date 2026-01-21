const shippingService = require('../services/shipping.service');
const { success, created } = require('../utils/apiResponse');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * Get all shipping zones with neighborhood mappings
 */
exports.getAllZones = async (req, res, next) => {
  try {
    const { include_inactive } = req.query;
    const zones = await shippingService.getAllZones(include_inactive === 'true');

    return success(res, zones, 'Shipping zones retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single shipping zone by ID
 */
exports.getZoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const zone = await shippingService.getZoneById(id);

    return success(res, zone, 'Shipping zone retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new shipping zone
 */
exports.createZone = async (req, res, next) => {
  try {
    const {
      name,
      description,
      base_rate,
      free_shipping_threshold,
      weight_surcharge_per_kg,
      express_surcharge,
      estimated_delivery_hours,
      is_active,
      sort_order
    } = req.body;

    // Validation
    if (!name) {
      throw new ValidationError('Zone name is required');
    }
    if (base_rate === undefined || base_rate === null) {
      throw new ValidationError('Base rate is required');
    }

    const zone = await shippingService.createZone(
      {
        name,
        description,
        base_rate,
        free_shipping_threshold,
        weight_surcharge_per_kg,
        express_surcharge,
        estimated_delivery_hours,
        is_active,
        sort_order
      },
      req.user.id
    );

    return created(res, zone, 'Shipping zone created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing shipping zone
 */
exports.updateZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const zone = await shippingService.updateZone(id, updateData, req.user.id);

    return success(res, zone, 'Shipping zone updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a shipping zone (soft delete)
 */
exports.deleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await shippingService.deleteZone(id, req.user.id);

    return success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all neighborhood mappings
 */
exports.getAllNeighborhoods = async (req, res, next) => {
  try {
    const { zone_id } = req.query;
    const neighborhoods = await shippingService.getAllNeighborhoods(zone_id);

    return success(res, neighborhoods, 'Neighborhood mappings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new neighborhood mapping
 */
exports.createNeighborhoodMapping = async (req, res, next) => {
  try {
    const {
      neighborhood_name,
      postal_code,
      postal_code_pattern,
      shipping_zone_id,
      city,
      province
    } = req.body;

    // Validation
    if (!neighborhood_name) {
      throw new ValidationError('Neighborhood name is required');
    }
    if (!shipping_zone_id) {
      throw new ValidationError('Shipping zone ID is required');
    }

    const mapping = await shippingService.createNeighborhoodMapping(
      {
        neighborhood_name,
        postal_code,
        postal_code_pattern,
        shipping_zone_id,
        city,
        province
      },
      req.user.id
    );

    return created(res, mapping, 'Neighborhood mapping created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a neighborhood mapping
 */
exports.updateNeighborhoodMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mapping = await shippingService.updateNeighborhoodMapping(id, updateData, req.user.id);

    return success(res, mapping, 'Neighborhood mapping updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a neighborhood mapping
 */
exports.deleteNeighborhoodMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await shippingService.deleteNeighborhoodMapping(id, req.user.id);

    return success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Find shipping zone for a location (neighborhood or postal code)
 */
exports.findZoneForLocation = async (req, res, next) => {
  try {
    const { neighborhood, postal_code } = req.query;

    if (!neighborhood && !postal_code) {
      throw new ValidationError('Either neighborhood or postal_code is required');
    }

    const zone = await shippingService.findZoneForLocation(neighborhood, postal_code);

    return success(res, zone, 'Shipping zone found');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate shipping cost for an order
 */
exports.calculateShipping = async (req, res, next) => {
  try {
    const { neighborhood, postal_code, subtotal, weight, is_express } = req.body;

    // Validation
    if (!neighborhood) {
      throw new ValidationError('Neighborhood is required');
    }
    if (subtotal === undefined || subtotal === null) {
      throw new ValidationError('Subtotal is required');
    }

    const calculation = await shippingService.calculateShipping({
      neighborhood,
      postalCode: postal_code,
      subtotal: parseFloat(subtotal),
      weight: weight ? parseFloat(weight) : 0,
      isExpress: is_express === true || is_express === 'true'
    });

    return success(res, calculation, 'Shipping cost calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create shipping record for a sale
 */
exports.createSaleShipping = async (req, res, next) => {
  try {
    const { sale_id } = req.params;
    const shippingData = req.body;

    const shipping = await shippingService.createSaleShipping(sale_id, shippingData, req.user.id);

    return created(res, shipping, 'Shipping record created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery status for a shipment
 */
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, signature, photo } = req.body;

    if (!status) {
      throw new ValidationError('Delivery status is required');
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const shipping = await shippingService.updateDeliveryStatus(
      id,
      status,
      req.user.id,
      { signature, photo }
    );

    return success(res, shipping, 'Delivery status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping details for a sale
 */
exports.getShippingBySaleId = async (req, res, next) => {
  try {
    const { sale_id } = req.params;
    const shipping = await shippingService.getShippingBySaleId(sale_id);

    if (!shipping) {
      return success(res, null, 'No shipping record found for this sale');
    }

    return success(res, shipping, 'Shipping details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments with optional filters
 */
exports.getAllShipments = async (req, res, next) => {
  try {
    const { status, zone_id, customer_id, from_date, to_date } = req.query;

    const shipments = await shippingService.getAllShipments({
      status,
      zone_id,
      customer_id,
      from_date: from_date ? new Date(from_date) : null,
      to_date: to_date ? new Date(to_date) : null
    });

    return success(res, shipments, 'Shipments retrieved successfully');
  } catch (error) {
    next(error);
  }
};
