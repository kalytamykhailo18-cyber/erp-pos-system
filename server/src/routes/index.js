const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const branchRoutes = require('./branch.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const categoryRoutes = require('./category.routes');
// Three-level taxonomy routes (PART 6)
const speciesRoutes = require('./species.routes');
const varietyRoutes = require('./variety.routes');
const productTypeRoutes = require('./productType.routes');
const productRoutes = require('./product.routes');
const customerRoutes = require('./customer.routes');
const supplierRoutes = require('./supplier.routes');
const stockRoutes = require('./stock.routes');
// Open bags and non-sales deductions routes (PART 6)
const openBagRoutes = require('./openBag.routes');
const nonSalesDeductionRoutes = require('./nonSalesDeduction.routes');
const saleRoutes = require('./sale.routes');
const paymentRoutes = require('./payment.routes');
const registerRoutes = require('./register.routes');
const invoiceRoutes = require('./invoice.routes');
const alertRoutes = require('./alert.routes');
const reportRoutes = require('./report.routes');
const syncRoutes = require('./sync.routes');
const priceImportRoutes = require('./priceImport.routes');
const loyaltyRoutes = require('./loyalty.routes');
const printerRoutes = require('./printer.routes');
const auditRoutes = require('./audit.routes');
const chatRoutes = require('./chat.routes');
const scaleRoutes = require('./scale.routes');
const shippingRoutes = require('./shipping.routes');
const expenseRoutes = require('./expense.routes');
const denominationRoutes = require('./denomination.routes');
const settingsRoutes = require('./settings.routes');
const systemRoutes = require('./system.routes');

// API Version prefix
const API_VERSION = '/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/branches`, branchRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/roles`, roleRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
// Three-level taxonomy (PART 6)
router.use(`${API_VERSION}/species`, speciesRoutes);
router.use(`${API_VERSION}/varieties`, varietyRoutes);
router.use(`${API_VERSION}/product-types`, productTypeRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/customers`, customerRoutes);
router.use(`${API_VERSION}/suppliers`, supplierRoutes);
router.use(`${API_VERSION}/stock`, stockRoutes);
// Open bags and non-sales deductions (PART 6)
router.use(`${API_VERSION}/open-bags`, openBagRoutes);
router.use(`${API_VERSION}/non-sales-deductions`, nonSalesDeductionRoutes);
router.use(`${API_VERSION}/sales`, saleRoutes);
router.use(`${API_VERSION}/payment-methods`, paymentRoutes);
router.use(`${API_VERSION}/registers`, registerRoutes);
router.use(`${API_VERSION}/invoices`, invoiceRoutes);
router.use(`${API_VERSION}/alerts`, alertRoutes);
router.use(`${API_VERSION}/reports`, reportRoutes);
router.use(`${API_VERSION}/sync`, syncRoutes);
router.use(`${API_VERSION}/prices`, priceImportRoutes);
router.use(`${API_VERSION}/loyalty`, loyaltyRoutes);
router.use(`${API_VERSION}/printer`, printerRoutes);
router.use(`${API_VERSION}/audit`, auditRoutes);
router.use(`${API_VERSION}/chat`, chatRoutes);
router.use(`${API_VERSION}/scales`, scaleRoutes);
router.use(`${API_VERSION}/shipping`, shippingRoutes);
router.use(`${API_VERSION}/expenses`, expenseRoutes);
router.use(`${API_VERSION}/denominations`, denominationRoutes);
router.use(`${API_VERSION}/settings`, settingsRoutes);
router.use(`${API_VERSION}/system`, systemRoutes);

module.exports = router;
