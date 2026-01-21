const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  ShippingZone,
  NeighborhoodMapping,
  SaleShipping,
  Sale,
  Customer,
  sequelize
} = require('../database/models');
const { NotFoundError, BusinessError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ShippingService {
  /**
   * Get all active shipping zones with their neighborhood mappings
   */
  async getAllZones(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };

    return ShippingZone.findAll({
      where,
      include: [
        {
          model: NeighborhoodMapping,
          as: 'neighborhood_mappings',
          where: includeInactive ? {} : { is_active: true },
          required: false
        }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Get a single shipping zone by ID
   */
  async getZoneById(zoneId) {
    const zone = await ShippingZone.findByPk(zoneId, {
      include: [
        {
          model: NeighborhoodMapping,
          as: 'neighborhood_mappings',
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!zone) {
      throw new NotFoundError('Shipping zone not found');
    }

    return zone;
  }

  /**
   * Create a new shipping zone
   */
  async createZone(zoneData, userId) {
    const zone = await ShippingZone.create({
      id: uuidv4(),
      ...zoneData
    });

    logger.info(`Shipping zone created: ${zone.name} by user ${userId}`);
    return zone;
  }

  /**
   * Update an existing shipping zone
   */
  async updateZone(zoneId, zoneData, userId) {
    const zone = await this.getZoneById(zoneId);

    await zone.update(zoneData);

    logger.info(`Shipping zone updated: ${zone.name} by user ${userId}`);
    return zone;
  }

  /**
   * Delete a shipping zone (soft delete by marking inactive)
   */
  async deleteZone(zoneId, userId) {
    const zone = await this.getZoneById(zoneId);

    // Check if zone is used in any active sale shipping records
    const activeUsage = await SaleShipping.count({
      where: {
        shipping_zone_id: zoneId,
        delivery_status: {
          [Op.notIn]: ['DELIVERED', 'CANCELLED']
        }
      }
    });

    if (activeUsage > 0) {
      throw new BusinessError(
        `Cannot delete shipping zone "${zone.name}" - it is currently used in ${activeUsage} active shipments`
      );
    }

    await zone.update({ is_active: false });

    logger.info(`Shipping zone deleted: ${zone.name} by user ${userId}`);
    return { success: true, message: 'Shipping zone deleted successfully' };
  }

  /**
   * Get all neighborhood mappings
   */
  async getAllNeighborhoods(zoneId = null) {
    const where = zoneId ? { shipping_zone_id: zoneId, is_active: true } : { is_active: true };

    return NeighborhoodMapping.findAll({
      where,
      include: [
        {
          model: ShippingZone,
          as: 'shipping_zone'
        }
      ],
      order: [['neighborhood_name', 'ASC']]
    });
  }

  /**
   * Create a new neighborhood mapping
   */
  async createNeighborhoodMapping(mappingData, userId) {
    // Verify the shipping zone exists
    await this.getZoneById(mappingData.shipping_zone_id);

    // Normalize the neighborhood name for matching
    const normalizedName = mappingData.neighborhood_name.toLowerCase().trim();

    // Check for duplicate mapping
    const existing = await NeighborhoodMapping.findOne({
      where: {
        normalized_name: normalizedName,
        is_active: true
      }
    });

    if (existing) {
      throw new BusinessError(
        `A mapping for "${mappingData.neighborhood_name}" already exists`
      );
    }

    const mapping = await NeighborhoodMapping.create({
      id: uuidv4(),
      ...mappingData,
      normalized_name: normalizedName
    });

    logger.info(`Neighborhood mapping created: ${mapping.neighborhood_name} by user ${userId}`);
    return mapping;
  }

  /**
   * Update a neighborhood mapping
   */
  async updateNeighborhoodMapping(mappingId, mappingData, userId) {
    const mapping = await NeighborhoodMapping.findByPk(mappingId);

    if (!mapping) {
      throw new NotFoundError('Neighborhood mapping not found');
    }

    // If changing zone, verify it exists
    if (mappingData.shipping_zone_id && mappingData.shipping_zone_id !== mapping.shipping_zone_id) {
      await this.getZoneById(mappingData.shipping_zone_id);
    }

    // Update normalized name if neighborhood name changed
    if (mappingData.neighborhood_name) {
      mappingData.normalized_name = mappingData.neighborhood_name.toLowerCase().trim();
    }

    await mapping.update(mappingData);

    logger.info(`Neighborhood mapping updated: ${mapping.neighborhood_name} by user ${userId}`);
    return mapping;
  }

  /**
   * Delete a neighborhood mapping
   */
  async deleteNeighborhoodMapping(mappingId, userId) {
    const mapping = await NeighborhoodMapping.findByPk(mappingId);

    if (!mapping) {
      throw new NotFoundError('Neighborhood mapping not found');
    }

    await mapping.update({ is_active: false });

    logger.info(`Neighborhood mapping deleted: ${mapping.neighborhood_name} by user ${userId}`);
    return { success: true, message: 'Neighborhood mapping deleted successfully' };
  }

  /**
   * Find shipping zone for a given neighborhood or postal code
   */
  async findZoneForLocation(neighborhood, postalCode = null) {
    const normalizedNeighborhood = neighborhood.toLowerCase().trim();

    // Try exact neighborhood match first
    let mapping = await NeighborhoodMapping.findOne({
      where: {
        normalized_name: normalizedNeighborhood,
        is_active: true
      },
      include: [
        {
          model: ShippingZone,
          as: 'shipping_zone',
          where: { is_active: true }
        }
      ]
    });

    // Try postal code match if provided and no neighborhood match found
    if (!mapping && postalCode) {
      mapping = await NeighborhoodMapping.findOne({
        where: {
          [Op.or]: [
            { postal_code: postalCode },
            sequelize.where(
              sequelize.literal(`'${postalCode}' LIKE postal_code_pattern`),
              true
            )
          ],
          is_active: true
        },
        include: [
          {
            model: ShippingZone,
            as: 'shipping_zone',
            where: { is_active: true }
          }
        ]
      });
    }

    // If no specific mapping found, use default "Other Neighborhoods" zone
    if (!mapping) {
      const defaultZone = await ShippingZone.findOne({
        where: {
          name: { [Op.iLike]: '%other%' },
          is_active: true
        }
      });

      if (!defaultZone) {
        throw new NotFoundError(
          'No shipping zone found for this neighborhood and no default zone configured'
        );
      }

      return defaultZone;
    }

    return mapping.shipping_zone;
  }

  /**
   * Calculate shipping cost for an order
   * @param {Object} params - Calculation parameters
   * @param {string} params.neighborhood - Delivery neighborhood
   * @param {string} params.postalCode - Postal code (optional)
   * @param {number} params.subtotal - Order subtotal amount
   * @param {number} params.weight - Total weight in kg (optional)
   * @param {boolean} params.isExpress - Express delivery requested (optional)
   * @returns {Object} Shipping calculation details
   */
  async calculateShipping({ neighborhood, postalCode = null, subtotal, weight = 0, isExpress = false }) {
    // Find the appropriate shipping zone
    const zone = await this.findZoneForLocation(neighborhood, postalCode);

    // Start with base rate
    let shippingCost = parseFloat(zone.base_rate);
    let freeShippingApplied = false;

    // Check if free shipping threshold is met
    if (zone.free_shipping_threshold && subtotal >= parseFloat(zone.free_shipping_threshold)) {
      shippingCost = 0;
      freeShippingApplied = true;
    }

    // Calculate weight surcharge (only if not free shipping)
    let weightSurcharge = 0;
    if (!freeShippingApplied && weight > 0 && zone.weight_surcharge_per_kg) {
      weightSurcharge = weight * parseFloat(zone.weight_surcharge_per_kg);
      shippingCost += weightSurcharge;
    }

    // Add express surcharge if requested (applies even with free shipping)
    let expressSurcharge = 0;
    if (isExpress && zone.express_surcharge) {
      expressSurcharge = parseFloat(zone.express_surcharge);
      shippingCost += expressSurcharge;
    }

    // Calculate estimated delivery date
    let estimatedDeliveryDate = null;
    if (zone.estimated_delivery_hours) {
      const deliveryHours = isExpress
        ? Math.ceil(zone.estimated_delivery_hours / 2) // Express is roughly half the time
        : zone.estimated_delivery_hours;

      estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setHours(estimatedDeliveryDate.getHours() + deliveryHours);
    }

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      base_rate: parseFloat(zone.base_rate),
      weight_kg: weight,
      weight_surcharge: weightSurcharge,
      is_express: isExpress,
      express_surcharge: expressSurcharge,
      free_shipping_applied: freeShippingApplied,
      free_shipping_threshold: zone.free_shipping_threshold ? parseFloat(zone.free_shipping_threshold) : null,
      total_shipping_cost: Math.max(0, shippingCost), // Never negative
      estimated_delivery_date: estimatedDeliveryDate,
      estimated_delivery_hours: zone.estimated_delivery_hours
    };
  }

  /**
   * Create shipping record for a sale
   */
  async createSaleShipping(saleId, shippingData, userId) {
    const t = await sequelize.transaction();

    try {
      // Verify sale exists
      const sale = await Sale.findByPk(saleId);
      if (!sale) {
        throw new NotFoundError('Sale not found');
      }

      // Check if shipping already exists for this sale
      const existing = await SaleShipping.findOne({
        where: { sale_id: saleId }
      });

      if (existing) {
        throw new BusinessError('Shipping record already exists for this sale');
      }

      // Get customer address if customer_id provided
      let deliveryAddress = shippingData.delivery_address;
      let deliveryNeighborhood = shippingData.delivery_neighborhood;
      let deliveryCity = shippingData.delivery_city;
      let deliveryPostalCode = shippingData.delivery_postal_code;

      if (shippingData.customer_id) {
        const customer = await Customer.findByPk(shippingData.customer_id);
        if (customer) {
          deliveryAddress = deliveryAddress || customer.address;
          deliveryNeighborhood = deliveryNeighborhood || customer.neighborhood;
          deliveryCity = deliveryCity || customer.city;
          deliveryPostalCode = deliveryPostalCode || customer.postal_code;
        }
      }

      if (!deliveryNeighborhood) {
        throw new ValidationError('Delivery neighborhood is required');
      }

      // Calculate shipping cost
      const calculation = await this.calculateShipping({
        neighborhood: deliveryNeighborhood,
        postalCode: deliveryPostalCode,
        subtotal: parseFloat(sale.subtotal),
        weight: shippingData.weight_kg || 0,
        isExpress: shippingData.is_express || false
      });

      // Create shipping record
      const saleShipping = await SaleShipping.create({
        id: uuidv4(),
        sale_id: saleId,
        customer_id: shippingData.customer_id || sale.customer_id,
        shipping_zone_id: calculation.zone_id,
        delivery_address: deliveryAddress,
        delivery_neighborhood: deliveryNeighborhood,
        delivery_city: deliveryCity,
        delivery_postal_code: deliveryPostalCode,
        delivery_notes: shippingData.delivery_notes,
        base_rate: calculation.base_rate,
        weight_kg: calculation.weight_kg,
        weight_surcharge: calculation.weight_surcharge,
        is_express: calculation.is_express,
        express_surcharge: calculation.express_surcharge,
        free_shipping_applied: calculation.free_shipping_applied,
        free_shipping_threshold: calculation.free_shipping_threshold,
        total_shipping_cost: calculation.total_shipping_cost,
        estimated_delivery_date: calculation.estimated_delivery_date,
        delivery_status: 'PENDING'
      }, { transaction: t });

      await t.commit();

      logger.info(`Shipping record created for sale ${saleId} by user ${userId}`);

      return saleShipping;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Update delivery status for a shipment
   */
  async updateDeliveryStatus(shippingId, status, userId, additionalData = {}) {
    const shipping = await SaleShipping.findByPk(shippingId);

    if (!shipping) {
      throw new NotFoundError('Shipping record not found');
    }

    const updateData = { delivery_status: status };

    // If marking as delivered, set actual delivery date
    if (status === 'DELIVERED') {
      updateData.actual_delivery_date = new Date();
      updateData.delivered_by = userId;

      if (additionalData.signature) {
        updateData.delivery_confirmation_signature = additionalData.signature;
      }
      if (additionalData.photo) {
        updateData.delivery_confirmation_photo = additionalData.photo;
      }
    }

    await shipping.update(updateData);

    logger.info(`Delivery status updated to ${status} for shipping ${shippingId} by user ${userId}`);

    return shipping;
  }

  /**
   * Get shipping details for a sale
   */
  async getShippingBySaleId(saleId) {
    const shipping = await SaleShipping.findOne({
      where: { sale_id: saleId },
      include: [
        {
          model: ShippingZone,
          as: 'shipping_zone'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    return shipping;
  }

  /**
   * Get all shipments with optional filters
   */
  async getAllShipments(filters = {}) {
    const where = {};

    if (filters.status) {
      where.delivery_status = filters.status;
    }
    if (filters.zone_id) {
      where.shipping_zone_id = filters.zone_id;
    }
    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }
    if (filters.from_date) {
      where.created_at = { [Op.gte]: filters.from_date };
    }
    if (filters.to_date) {
      where.created_at = { ...where.created_at, [Op.lte]: filters.to_date };
    }

    return SaleShipping.findAll({
      where,
      include: [
        {
          model: Sale,
          as: 'sale'
        },
        {
          model: ShippingZone,
          as: 'shipping_zone'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new ShippingService();
