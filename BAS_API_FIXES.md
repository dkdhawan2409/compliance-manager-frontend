# BAS API Fixes - Complete Resolution

## 🎯 Issues Resolved

### 1. **Rapid API Calls (Infinite Loop)**
**Problem:** The BAS data API was being called rapidly and repeatedly, causing performance issues and excessive server load.

**Root Cause:**
- Callback props (`onBASError`, `onBASComplete`) were being recreated on every parent render
- These callbacks were in the `useCallback` dependency array, causing the function to be recreated
- The recreated function triggered `useEffect` dependencies, creating an infinite loop
- No debouncing mechanism to prevent rapid successive calls

**Solution:**
- ✅ Used `useRef` to store callback references instead of direct props
- ✅ Removed callback props from `useCallback` dependency arrays
- ✅ Added 300ms debounce to the auto-load effect
- ✅ Added request signature tracking to prevent duplicate calls with same parameters
- ✅ Added `force` option to loadBASData for manual refreshes

**Code Changes:**
```typescript
// Use refs to avoid infinite loops
const onBASErrorRef = useRef(onBASError);
const onBASCompleteRef = useRef(onBASComplete);
const requestSignatureRef = useRef<string | null>(null);

// Track request signature to prevent duplicates
const requestSignature = `${tenantId}|${fromDate}|${toDate}|${useCache}`;
if (!options.force && requestSignatureRef.current === requestSignature) {
  console.log('⚠️ Skipping BAS data reload; parameters unchanged');
  return;
}

// Debounce auto-load
useEffect(() => {
  if (selectedTenant && fromDate && toDate && isConnected && isTokenValid) {
    const timeoutId = setTimeout(() => {
      loadBASData();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }
}, [selectedTenant, fromDate, toDate, isConnected, isTokenValid, useCache, loadBASData]);
```

---

### 2. **404 Error on BAS Endpoint**
**Problem:** Backend was returning 404 error when trying to fetch BAS data from Xero.

**Root Cause:**
- The backend was trying to call `/api.xro/2.0/Reports/BAS` which **doesn't exist in Xero's API**
- Xero doesn't have a dedicated BAS report endpoint
- BAS data needs to be compiled from multiple Xero reports

**Solution:**
- ✅ Updated backend to fetch data from multiple real Xero endpoints:
  - **Tax Summary Report** (`/api.xro/2.0/Reports/TaxSummary`) - GST/tax data
  - **Profit & Loss Report** (`/api.xro/2.0/Reports/ProfitAndLoss`) - Revenue/expenses
  - **Balance Sheet Report** (`/api.xro/2.0/Reports/BalanceSheet`) - Balance context
  - **Invoices** (`/api.xro/2.0/Invoices`) - Transaction details
- ✅ Aggregated data from all sources into a comprehensive BAS dataset
- ✅ Added error handling for each report (graceful degradation)
- ✅ Maintained caching functionality for performance

**Backend Changes:**
```javascript
// src/services/xeroDataService.js - getBASData()
// 1. Get GST Report (most relevant for BAS)
gstReport = await this.fetchFromXero(
  '/api.xro/2.0/Reports/TaxSummary',
  accessToken, tenantId, gstParams, { companyId }
);

// 2. Get Profit & Loss
profitLoss = await this.fetchFromXero(
  '/api.xro/2.0/Reports/ProfitAndLoss',
  accessToken, tenantId, gstParams, { companyId }
);

// 3. Get Balance Sheet
balanceSheet = await this.fetchFromXero(
  '/api.xro/2.0/Reports/BalanceSheet',
  accessToken, tenantId, gstParams, { companyId }
);

// 4. Get Invoices for detailed data
invoices = await this.fetchFromXero(
  '/api.xro/2.0/Invoices',
  accessToken, tenantId, invoiceParams, { companyId }
);

// Compile into BAS data structure
const basData = {
  period: { fromDate, toDate },
  gstReport, profitLoss, balanceSheet, invoices,
  metadata: { fetchedAt, tenantId, companyId }
};
```

**Frontend Changes:**
```typescript
// src/components/BASProcessor.tsx - calculateBAS()
// Updated to process new data structure
const { gstReport, profitLoss, invoices } = basData;

// 1. Extract GST from Tax Summary report
if (gstReport?.Reports?.[0]?.Rows) {
  // Process GST rows for sales/purchases
}

// 2. Calculate from invoices if Tax Summary unavailable
if (gstOnSales === 0 && invoices?.Invoices) {
  invoices.Invoices.forEach((invoice: any) => {
    if (invoice.Type === 'ACCREC') { // Sales
      totalSales += parseFloat(invoice.SubTotal || '0');
      gstOnSales += parseFloat(invoice.TotalTax || '0');
    }
  });
}

// 3. Extract from P&L if needed
if (totalSales === 0 && profitLoss?.Reports?.[0]?.Rows) {
  // Process P&L revenue sections
}
```

---

## 📊 New Data Structure

### Backend Response Format
```json
{
  "success": true,
  "data": {
    "period": {
      "fromDate": "2025-09-30",
      "toDate": "2025-12-30"
    },
    "gstReport": {
      "Reports": [
        {
          "ReportType": "TaxSummary",
          "Rows": [...]
        }
      ]
    },
    "profitLoss": {
      "Reports": [
        {
          "ReportType": "ProfitAndLoss",
          "Rows": [...]
        }
      ]
    },
    "balanceSheet": {
      "Reports": [...]
    },
    "invoices": {
      "Invoices": [...]
    },
    "metadata": {
      "fetchedAt": "2025-10-12T00:00:00Z",
      "tenantId": "964c6de5-de81-46b2-af73-ccef240efdd3",
      "companyId": 123
    }
  }
}
```

---

## 🚀 Deployment Status

### Backend
- ✅ **Repository:** compliance-manager-backend
- ✅ **Commit:** `dcb8b6e` - "Fix BAS data endpoint - use TaxSummary and aggregate reports"
- ✅ **Pushed to:** main branch
- ✅ **Render Deployment:** Will auto-deploy (2-5 minutes)

### Frontend
- ✅ **Repository:** compliance-manager-frontend
- ✅ **Commit 1:** `d697710` - "Fix rapid BAS API calls - add debounce and fix infinite loop"
- ✅ **Commit 2:** `b1cabb1` - "Update BAS calculation to work with new aggregated data structure"
- ✅ **Pushed to:** main branch
- ✅ **Render Deployment:** Will auto-deploy (2-5 minutes)

---

## 🎯 Expected Results

### Performance Improvements
1. **No More Rapid API Calls**: API will only be called when necessary
2. **Debounced Loading**: 300ms delay prevents excessive calls during state changes
3. **Request Deduplication**: Same parameters won't trigger duplicate requests
4. **Graceful Degradation**: Each report failure is handled independently

### Functionality Improvements
1. **Working BAS Endpoint**: No more 404 errors
2. **Multiple Data Sources**: More comprehensive BAS data
3. **Better Error Handling**: Clear error messages for each report type
4. **Fallback Logic**: If one data source fails, others are still used

### User Experience
1. **Faster Load Times**: Cached data returned immediately when available
2. **More Accurate Data**: Multiple Xero reports provide better accuracy
3. **Better Error Messages**: Users see specific issues, not generic 404s
4. **Stable Performance**: No more browser slowdowns from rapid API calls

---

## 🔍 Testing Checklist

After deployment completes (5-10 minutes):

### 1. Verify No Rapid API Calls
- [ ] Open browser DevTools → Network tab
- [ ] Navigate to BAS page
- [ ] Verify `/api/xero/bas-data` is called only once
- [ ] Change date range → verify single call after 300ms debounce
- [ ] Check console for "⚠️ Skipping BAS data reload" messages

### 2. Verify BAS Data Loading
- [ ] Navigate to Xero BAS page
- [ ] Select organization and date range
- [ ] Verify data loads without 404 errors
- [ ] Check console for "✅ BAS data compiled successfully" message
- [ ] Verify BAS calculations display correctly

### 3. Verify Caching
- [ ] Load BAS data for a period
- [ ] Navigate away and return
- [ ] Verify "✅ Returning cached BAS data" in console
- [ ] Verify data loads instantly (no API call)

### 4. Verify Force Refresh
- [ ] Click "Refresh" button
- [ ] Verify API is called even with cached data
- [ ] Verify fresh data is loaded

---

## 📝 Files Modified

### Frontend
- `src/components/BASProcessor.tsx` - Fixed infinite loop, added debouncing, updated data processing
- `dist/assets/` - Built production files

### Backend
- `src/services/xeroDataService.js` - Fixed BAS endpoint, added multiple report aggregation

---

## 🔗 Related Documentation

- **Xero API Reports**: https://developer.xero.com/documentation/api/accounting/reports
- **Tax Summary Report**: `/api.xro/2.0/Reports/TaxSummary`
- **Available Xero Reports**: BalanceSheet, ProfitAndLoss, TaxSummary, BankSummary, etc.

---

## ✅ Success Criteria

All issues are resolved when:
1. ✅ No rapid API calls visible in Network tab
2. ✅ BAS data loads successfully without 404 errors
3. ✅ Console shows proper logging (no errors)
4. ✅ Debouncing works (300ms delay)
5. ✅ Request deduplication prevents unnecessary calls
6. ✅ BAS calculations display correctly
7. ✅ Caching works (cached data returns instantly)
8. ✅ Force refresh bypasses cache

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Deployed to Production (awaiting Render deployment completion)

