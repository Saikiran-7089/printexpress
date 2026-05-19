// Pricing Logic Service for PrintExpress

const BASE_RATES = {
  // A4 rates (per page)
  A4: {
    BW: { single: 2.0, double: 4.0 }, // double-sided is ₹4 per page as requested
    COLOR: { single: 10.0, double: 7.5 }
  },
  // Multipliers for sizes
  MULTIPLIERS: {
    A4: 1.0,
    A3: 2.0,
    LEGAL: 1.5
  },
  // Binding flat charges
  BINDING: {
    NONE: 0.0,
    STAPLED: 5.0,
    SPIRAL: 30.0
  },
  // Emergency add-on
  EMERGENCY_FEE: 1.0,
  // GST Tax rate
  GST_RATE: 0.18
};

/**
 * Calculate dynamic cost for a single print job document configuration
 * @param {Object} config - { printType, paperSize, sides, copies, binding, totalPages }
 */
function calculateDocumentCost(config) {
  const { printType, paperSize, sides, copies, binding, totalPages } = config;
  
  const size = paperSize.toUpperCase();
  const type = printType.toUpperCase(); // 'BW' or 'COLOR'
  const sideType = sides.toLowerCase(); // 'single' or 'double'
  const bindType = binding.toUpperCase(); // 'NONE', 'STAPLED', 'SPIRAL'
  const numCopies = Math.max(1, parseInt(copies) || 1);
  const pages = Math.max(1, parseInt(totalPages) || 1);
  const isEmergency = config.isEmergency || false;

  const sheets = sideType === 'double' ? Math.ceil(pages / 2) : pages;

  // Get base page rate (A4)
  const baseRateTable = BASE_RATES.A4[type] || BASE_RATES.A4.BW;
  const pageRate = sideType === 'double' ? baseRateTable.double : baseRateTable.single;

  // Apply size multiplier
  const sizeMultiplier = BASE_RATES.MULTIPLIERS[size] || 1.0;
  
  // Calculate cost per single copy
  const printingCostPerCopy = sheets * pageRate * sizeMultiplier;
  const bindingCost = BASE_RATES.BINDING[bindType] || 0.0;
  const emergencyCostPerCopy = isEmergency ? pages * BASE_RATES.EMERGENCY_FEE : 0.0; // Emergency fee applies to total logical pages

  // Total for this document configuration
  const subtotal = (printingCostPerCopy + bindingCost + emergencyCostPerCopy) * numCopies;

  return {
    pageRate: pageRate * sizeMultiplier,
    printingCost: printingCostPerCopy * numCopies,
    bindingCost: bindingCost * numCopies,
    emergencyCost: emergencyCostPerCopy * numCopies,
    sheets,
    subtotal: Math.round(subtotal * 100) / 100
  };
}

/**
 * Calculate complete order invoice breakdown
 * @param {Array} documents - Array of document config objects
 */
function calculateInvoice(documents = []) {
  let subtotal = 0;
  let emergencyTotal = 0;
  const itemsBreakdown = documents.map((doc, index) => {
    const costDetails = calculateDocumentCost(doc);
    subtotal += costDetails.subtotal;
    emergencyTotal += costDetails.emergencyCost;
    return {
      index,
      fileName: doc.originalName || `Document ${index + 1}`,
      totalPages: doc.totalPages,
      copies: doc.copies,
      config: {
        printType: doc.printType,
        paperSize: doc.paperSize,
        sides: doc.sides,
        binding: doc.binding,
        isEmergency: doc.isEmergency
      },
      ...costDetails
    };
  });

  const gst = Math.round(subtotal * BASE_RATES.GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  return {
    items: itemsBreakdown,
    subtotal: Math.round(subtotal * 100) / 100,
    emergencyTotal: Math.round(emergencyTotal * 100) / 100,
    gst,
    total
  };
}

/**
 * Simulates parsing standard files (PDF, DOCX, images) to estimate page counts.
 * Uses a heuristic based on file size and extension.
 * @param {string} fileName 
 * @param {number} fileSize 
 */
function estimatePageCount(fileName, fileSize) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
    return 1; // Images are always 1 page
  }

  // Documents: Simulating page count based on size
  // e.g. 50KB standard page size estimation
  const bytesPerPage = 40000;
  let estimated = Math.ceil(fileSize / bytesPerPage);
  
  // Set logical bounds
  if (estimated < 1) estimated = 1;
  if (estimated > 250) estimated = 250; // Cap default mock

  return estimated;
}

module.exports = {
  calculateDocumentCost,
  calculateInvoice,
  estimatePageCount,
  BASE_RATES
};
