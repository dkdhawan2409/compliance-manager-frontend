/**
 * Test utilities to verify company data isolation
 * These functions help verify that different companies cannot access each other's data
 */

import { Company } from '../api/companyService';

export interface CompanyIsolationTestResult {
  passed: boolean;
  testName: string;
  details: string;
  error?: string;
}

/**
 * Test that simulates switching between companies and verifies data isolation
 */
export const testCompanyDataIsolation = async (): Promise<CompanyIsolationTestResult[]> => {
  const results: CompanyIsolationTestResult[] = [];

  // Test 1: Verify localStorage is cleared when switching companies
  try {
    // Simulate company 1 data
    localStorage.setItem('company_1_xero_data', 'company1_data');
    localStorage.setItem('company_2_xero_data', 'company2_data');
    localStorage.setItem('xero_authorized', 'true');

    // Clear data for company 1
    const { clearCompanySpecificData } = await import('./companyDataIsolation');
    clearCompanySpecificData(1);

    // Check that company 1 data is cleared but company 2 data remains
    const company1DataExists = localStorage.getItem('company_1_xero_data') !== null;
    const company2DataExists = localStorage.getItem('company_2_xero_data') !== null;
    const generalDataCleared = localStorage.getItem('xero_authorized') === null;

    if (!company1DataExists && company2DataExists && generalDataCleared) {
      results.push({
        passed: true,
        testName: 'localStorage Isolation',
        details: 'Company-specific data cleared correctly while preserving other company data'
      });
    } else {
      results.push({
        passed: false,
        testName: 'localStorage Isolation',
        details: 'Failed to properly clear company-specific data',
        error: `Company1: ${company1DataExists}, Company2: ${company2DataExists}, General: ${!generalDataCleared}`
      });
    }

    // Cleanup
    localStorage.removeItem('company_2_xero_data');
  } catch (error) {
    results.push({
      passed: false,
      testName: 'localStorage Isolation',
      details: 'Test failed with exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Verify company data validation
  try {
    const { validateCompanyData } = await import('./companyDataIsolation');
    
    const company1: Company = {
      id: 1,
      companyName: 'Test Company 1',
      email: 'test1@example.com',
      role: 'admin',
      superadmin: false
    };

    const company2: Company = {
      id: 2,
      companyName: 'Test Company 2',
      email: 'test2@example.com',
      role: 'admin',
      superadmin: false
    };

    // Test valid data
    const validData = { companyId: 1, someData: 'test' };
    const validResult = validateCompanyData(validData, company1);

    // Test invalid data (wrong company)
    const invalidData = { companyId: 2, someData: 'test' };
    const invalidResult = validateCompanyData(invalidData, company1);

    if (validResult.isValid && !invalidResult.isValid) {
      results.push({
        passed: true,
        testName: 'Company Data Validation',
        details: 'Correctly validates company ownership of data'
      });
    } else {
      results.push({
        passed: false,
        testName: 'Company Data Validation',
        details: 'Failed to properly validate company data ownership',
        error: `Valid: ${validResult.isValid}, Invalid: ${invalidResult.isValid}`
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      testName: 'Company Data Validation',
      details: 'Test failed with exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
};

/**
 * Runs all company isolation tests and logs results
 */
export const runCompanyIsolationTests = async (): Promise<void> => {
  console.log('🧪 Running Company Data Isolation Tests...');
  
  const results = await testCompanyDataIsolation();
  
  console.log('\n📊 Test Results:');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.testName}`);
    console.log(`   ${result.details}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All company data isolation tests passed!');
  } else {
    console.warn('⚠️ Some company data isolation tests failed. Please review security implementation.');
  }
};

/**
 * Test that verifies Xero API calls include proper company context
 */
export const testXeroAPICompanyContext = (): void => {
  console.log('🔍 Testing Xero API Company Context...');
  
  // Override fetch to monitor API calls
  const originalFetch = window.fetch;
  let apiCallsWithAuth = 0;
  let apiCallsWithoutAuth = 0;

  window.fetch = async (...args) => {
    const [url, options] = args;
    
    if (typeof url === 'string' && url.includes('/api/xero/')) {
      const hasAuth = options?.headers && 
        Object.entries(options.headers).some(([key, value]) => 
          key.toLowerCase() === 'authorization' && typeof value === 'string' && value.includes('Bearer')
        );
      
      if (hasAuth) {
        apiCallsWithAuth++;
        console.log('✅ Xero API call with authentication:', url);
      } else {
        apiCallsWithoutAuth++;
        console.warn('⚠️ Xero API call without authentication:', url);
      }
    }
    
    return originalFetch(...args);
  };

  // Restore fetch after 10 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log(`🔍 API Monitoring Complete: ${apiCallsWithAuth} authenticated, ${apiCallsWithoutAuth} unauthenticated`);
  }, 10000);

  console.log('🔍 Monitoring Xero API calls for 10 seconds...');
};

// Add to global window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testCompanyIsolation = {
    runTests: runCompanyIsolationTests,
    testAPIContext: testXeroAPICompanyContext,
    testDataIsolation: testCompanyDataIsolation
  };
}

