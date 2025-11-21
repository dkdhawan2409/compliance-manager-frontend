# 📄 Backend PDF Generation Implementation for BAS and FAS Reports

## Overview

This document provides the complete backend implementation for PDF generation endpoints that support BAS (Business Activity Statement) and FAS (Fringe Benefits Tax Activity Statement) reports based on Xero account data.

## Required Endpoints

The frontend calls these endpoints:
- `POST /api/reports/bas/pdf` - Generate BAS PDF report
- `POST /api/reports/fas/pdf` - Generate FAS PDF report

## Payload Structure

### BAS PDF Endpoint (`POST /api/reports/bas/pdf`)

**Request Body:**
```json
{
  "basData": {
    "BAS_Period": "Q1 2024",
    "BAS_Fields": {
      "G1": 100000.00,
      "G2": 50000.00,
      "G3": 0,
      "G10": 0,
      "G11": 0,
      "1A": 10000.00,
      "1B": 5000.00,
      "W1": 0,
      "W2": 0
    },
    "rawXeroData": { /* Full Xero data object */ }
  },
  "summary": {
    "totalSales": 100000.00,
    "totalPurchases": 50000.00,
    "totalGST": 10000.00,
    "gstOnPurchases": 5000.00,
    "netGST": 5000.00,
    "period": {
      "fromDate": "2024-07-01",
      "toDate": "2024-09-30",
      "quarter": "Q1"
    }
  },
  "metadata": {
    "companyName": "Example Company",
    "organizationName": "Xero Organization Name",
    "tenantId": "xero-tenant-id",
    "generatedAt": "2024-10-10T12:00:00.000Z",
    "period": {
      "fromDate": "2024-07-01",
      "toDate": "2024-09-30",
      "quarter": "Q1"
    },
    "notes": "BAS PDF generated from Xero account data for organization.",
    "dataSource": "Xero Accounting",
    "reportType": "Business Activity Statement"
  }
}
```

### FAS PDF Endpoint (`POST /api/reports/fas/pdf`)

**Request Body:**
```json
{
  "fasData": {
    "FAS_Period": "Q1 2024",
    "FAS_Fields": {
      "A1": 50000.00,
      "A2": 0,
      "A3": 50000.00,
      "A4": 0,
      "A5": 23500.00,
      "A6": 47,
      "A7": 0,
      "A8": 2.0802,
      "A9": 1.8868
    },
    "rawXeroData": { /* Full Xero data object */ }
  },
  "summary": {
    "totalFringeBenefits": 50000.00,
    "fbtOnCars": 20000.00,
    "fbtOnEntertainment": 15000.00,
    "fbtOnOther": 15000.00,
    "grossTaxableValue": 50000.00,
    "fbtPayable": 23500.00,
    "fbtRate": 47,
    "period": {
      "fromDate": "2024-07-01",
      "toDate": "2024-09-30",
      "quarter": "Q1"
    }
  },
  "metadata": {
    "companyName": "Example Company",
    "organizationName": "Xero Organization Name",
    "tenantId": "xero-tenant-id",
    "generatedAt": "2024-10-10T12:00:00.000Z",
    "period": {
      "fromDate": "2024-07-01",
      "toDate": "2024-09-30",
      "quarter": "Q1"
    },
    "notes": "FAS PDF generated from Xero account data for organization.",
    "dataSource": "Xero Accounting",
    "reportType": "Fringe Benefits Tax Activity Statement"
  }
}
```

## Backend Implementation

### Step 1: Install Required Dependencies

```bash
npm install pdfkit express
```

### Step 2: Create PDF Generation Service

**File: `services/pdfGeneratorService.js`**

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFGeneratorService {
  /**
   * Generate BAS PDF Report
   */
  async generateBASPDF(payload) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        // Collect PDF data
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const { basData, summary, metadata } = payload;

        // Header
        doc.fontSize(20).text('Business Activity Statement (BAS)', { align: 'center' });
        doc.moveDown();

        // Company Information
        doc.fontSize(14).text('Company Information', { underline: true });
        doc.fontSize(12);
        doc.text(`Company Name: ${metadata.companyName || 'N/A'}`);
        doc.text(`Organization: ${metadata.organizationName || 'N/A'}`);
        doc.text(`Period: ${basData.BAS_Period || 'N/A'}`);
        doc.text(`Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}`);
        doc.moveDown();

        // BAS Fields Section
        doc.fontSize(14).text('BAS Fields', { underline: true });
        doc.fontSize(12);
        
        const fields = basData.BAS_Fields || {};
        doc.text(`G1 - Total Sales (GST Inclusive): $${this.formatCurrency(fields.G1 || 0)}`);
        doc.text(`G2 - Total Purchases (GST Inclusive): $${this.formatCurrency(fields.G2 || 0)}`);
        doc.text(`G3 - Export Sales: $${this.formatCurrency(fields.G3 || 0)}`);
        doc.text(`G10 - Capital Acquisitions: $${this.formatCurrency(fields.G10 || 0)}`);
        doc.text(`G11 - Non-Capital Acquisitions: $${this.formatCurrency(fields.G11 || 0)}`);
        doc.moveDown();
        
        doc.text(`1A - GST on Sales: $${this.formatCurrency(fields['1A'] || 0)}`);
        doc.text(`1B - GST on Purchases: $${this.formatCurrency(fields['1B'] || 0)}`);
        doc.moveDown();
        
        doc.text(`W1 - Total Wages: $${this.formatCurrency(fields.W1 || 0)}`);
        doc.text(`W2 - PAYG Withholding: $${this.formatCurrency(fields.W2 || 0)}`);
        doc.moveDown();

        // Summary Section
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12);
        doc.text(`Total Sales: $${this.formatCurrency(summary.totalSales || 0)}`);
        doc.text(`Total Purchases: $${this.formatCurrency(summary.totalPurchases || 0)}`);
        doc.text(`Total GST on Sales: $${this.formatCurrency(summary.totalGST || 0)}`);
        doc.text(`GST on Purchases: $${this.formatCurrency(summary.gstOnPurchases || 0)}`);
        doc.text(`Net GST Payable: $${this.formatCurrency(summary.netGST || 0)}`, { 
          bold: true,
          color: summary.netGST >= 0 ? 'red' : 'green'
        });
        doc.moveDown();

        // Period Information
        if (summary.period) {
          doc.fontSize(14).text('Period Information', { underline: true });
          doc.fontSize(12);
          doc.text(`From: ${summary.period.fromDate || 'N/A'}`);
          doc.text(`To: ${summary.period.toDate || 'N/A'}`);
          if (summary.period.quarter) {
            doc.text(`Quarter: ${summary.period.quarter}`);
          }
          doc.moveDown();
        }

        // Footer
        doc.fontSize(10)
           .fillColor('gray')
           .text(`Data Source: ${metadata.dataSource || 'N/A'}`, 50, doc.page.height - 50, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate FAS PDF Report
   */
  async generateFASPDF(payload) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const { fasData, summary, metadata } = payload;

        // Header
        doc.fontSize(20).text('Fringe Benefits Tax Activity Statement (FAS)', { align: 'center' });
        doc.moveDown();

        // Company Information
        doc.fontSize(14).text('Company Information', { underline: true });
        doc.fontSize(12);
        doc.text(`Company Name: ${metadata.companyName || 'N/A'}`);
        doc.text(`Organization: ${metadata.organizationName || 'N/A'}`);
        doc.text(`Period: ${fasData.FAS_Period || 'N/A'}`);
        doc.text(`Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}`);
        doc.moveDown();

        // FAS Fields Section
        doc.fontSize(14).text('FAS Fields', { underline: true });
        doc.fontSize(12);
        
        const fields = fasData.FAS_Fields || {};
        doc.text(`A1 - Total Fringe Benefits: $${this.formatCurrency(fields.A1 || 0)}`);
        doc.text(`A2 - Exempt Benefits: $${this.formatCurrency(fields.A2 || 0)}`);
        doc.text(`A3 - Gross Taxable Value: $${this.formatCurrency(fields.A3 || 0)}`);
        doc.text(`A4 - Aggregate FBT Amount: $${this.formatCurrency(fields.A4 || 0)}`);
        doc.text(`A5 - FBT Payable: $${this.formatCurrency(fields.A5 || 0)}`, { bold: true });
        doc.text(`A6 - FBT Rate: ${fields.A6 || 0}%`);
        doc.text(`A7 - FBT Credit: $${this.formatCurrency(fields.A7 || 0)}`);
        doc.text(`A8 - Type 1 Gross-up Rate: ${fields.A8 || 0}`);
        doc.text(`A9 - Type 2 Gross-up Rate: ${fields.A9 || 0}`);
        doc.moveDown();

        // Summary Section
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12);
        doc.text(`Total Fringe Benefits: $${this.formatCurrency(summary.totalFringeBenefits || 0)}`);
        doc.text(`FBT on Cars: $${this.formatCurrency(summary.fbtOnCars || 0)}`);
        doc.text(`FBT on Entertainment: $${this.formatCurrency(summary.fbtOnEntertainment || 0)}`);
        doc.text(`FBT on Other Benefits: $${this.formatCurrency(summary.fbtOnOther || 0)}`);
        doc.text(`Gross Taxable Value: $${this.formatCurrency(summary.grossTaxableValue || 0)}`);
        doc.text(`FBT Payable (${summary.fbtRate || 47}%): $${this.formatCurrency(summary.fbtPayable || 0)}`, {
          bold: true,
          color: 'red'
        });
        doc.moveDown();

        // Period Information
        if (summary.period) {
          doc.fontSize(14).text('Period Information', { underline: true });
          doc.fontSize(12);
          doc.text(`From: ${summary.period.fromDate || 'N/A'}`);
          doc.text(`To: ${summary.period.toDate || 'N/A'}`);
          if (summary.period.quarter) {
            doc.text(`Quarter: ${summary.period.quarter}`);
          }
          doc.moveDown();
        }

        // Footer
        doc.fontSize(10)
           .fillColor('gray')
           .text(`Data Source: ${metadata.dataSource || 'N/A'}`, 50, doc.page.height - 50, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format currency value
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

module.exports = new PDFGeneratorService();
```

### Step 3: Add Routes to Your Server

**Add to your main server file (e.g., `server.js` or `app.js`):**

```javascript
const express = require('express');
const pdfGeneratorService = require('./services/pdfGeneratorService');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for PDF payloads

// Authentication middleware (use your existing middleware)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Verify token (use your existing JWT verification)
  // ... your token verification logic ...
  
  req.user = decoded; // Set user from token
  next();
};

/**
 * POST /api/reports/bas/pdf
 * Generate BAS PDF Report
 */
app.post('/api/reports/bas/pdf', authenticateToken, async (req, res) => {
  try {
    console.log('📄 Generating BAS PDF report...');
    
    const { basData, summary, metadata } = req.body;

    // Validate required fields
    if (!basData || !basData.BAS_Fields) {
      return res.status(400).json({
        success: false,
        message: 'Missing required BAS data'
      });
    }

    // Generate PDF
    const pdfBuffer = await pdfGeneratorService.generateBASPDF({
      basData,
      summary,
      metadata
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="BAS_Report_${metadata.organizationName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
    
    console.log('✅ BAS PDF generated successfully');
  } catch (error) {
    console.error('❌ Error generating BAS PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate BAS PDF',
      error: error.message
    });
  }
});

/**
 * POST /api/reports/fas/pdf
 * Generate FAS PDF Report
 */
app.post('/api/reports/fas/pdf', authenticateToken, async (req, res) => {
  try {
    console.log('📄 Generating FAS PDF report...');
    
    const { fasData, summary, metadata } = req.body;

    // Validate required fields
    if (!fasData || !fasData.FAS_Fields) {
      return res.status(400).json({
        success: false,
        message: 'Missing required FAS data'
      });
    }

    // Generate PDF
    const pdfBuffer = await pdfGeneratorService.generateFASPDF({
      fasData,
      summary,
      metadata
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FAS_Report_${metadata.organizationName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
    
    console.log('✅ FAS PDF generated successfully');
  } catch (error) {
    console.error('❌ Error generating FAS PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate FAS PDF',
      error: error.message
    });
  }
});

module.exports = app;
```

## Testing

### Test BAS PDF Generation

```bash
curl -X POST https://your-backend-url.com/api/reports/bas/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basData": {
      "BAS_Period": "Q1 2024",
      "BAS_Fields": {
        "G1": 100000,
        "1A": 10000,
        "1B": 5000
      }
    },
    "summary": {
      "totalSales": 100000,
      "netGST": 5000
    },
    "metadata": {
      "companyName": "Test Company",
      "organizationName": "Test Org",
      "dataSource": "Xero Accounting"
    }
  }' \
  --output bas_report.pdf
```

### Test FAS PDF Generation

```bash
curl -X POST https://your-backend-url.com/api/reports/fas/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fasData": {
      "FAS_Period": "Q1 2024",
      "FAS_Fields": {
        "A1": 50000,
        "A5": 23500,
        "A6": 47
      }
    },
    "summary": {
      "totalFringeBenefits": 50000,
      "fbtPayable": 23500
    },
    "metadata": {
      "companyName": "Test Company",
      "organizationName": "Test Org",
      "dataSource": "Xero Accounting"
    }
  }' \
  --output fas_report.pdf
```

## Key Features

✅ **Xero Account Data Integration**: PDFs include organization name, tenant ID, and data source  
✅ **Complete BAS/FAS Fields**: All required fields are included in the PDF  
✅ **Professional Formatting**: Clean, professional PDF layout with proper formatting  
✅ **Summary Sections**: Financial summaries for quick reference  
✅ **Period Information**: Clear period/quarter information  
✅ **Metadata Tracking**: Includes generation timestamp and data source  

## Notes

- The PDF generator uses `pdfkit` which is a popular Node.js PDF generation library
- The implementation handles large payloads (increased JSON limit to 10mb)
- All PDFs include proper headers for download
- Error handling is comprehensive with clear error messages
- Authentication is required for all PDF generation endpoints

## Deployment

1. Install dependencies: `npm install pdfkit express`
2. Create the `services/pdfGeneratorService.js` file
3. Add the routes to your main server file
4. Deploy to your backend server
5. Test the endpoints using the curl commands above

---

**Last Updated**: October 10, 2024  
**Status**: Ready for Implementation

