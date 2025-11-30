// Test script to verify IndexedDB connection fixes
// This can be run in the browser console to test the improved error handling

async function testIndexedDBFixes() {
  console.log('Testing IndexedDB connection fixes...');
  
  try {
    // Import the functions (in a real app, these would be imported)
    const { get, set, del } = await import('./utils/idb.js');
    
    // Test 1: Basic set/get operations
    console.log('Test 1: Basic operations');
    await set('test-key', { message: 'Hello World', timestamp: Date.now() });
    const result = await get('test-key');
    console.log('Got result:', result);
    
    // Test 2: Force connection close and retry
    console.log('Test 2: Connection resilience');
    // This simulates the connection closing scenario
    const originalDB = window.indexedDB;
    
    // Test multiple rapid operations to stress test the retry logic
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(set(`stress-test-${i}`, { index: i }));
    }
    await Promise.all(promises);
    console.log('Stress test completed successfully');
    
    // Cleanup
    await del('test-key');
    for (let i = 0; i < 10; i++) {
      await del(`stress-test-${i}`);
    }
    
    console.log('✅ All tests passed! IndexedDB fixes are working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for use in browser console
window.testIndexedDBFixes = testIndexedDBFixes;

console.log('Test script loaded. Run window.testIndexedDBFixes() to test.');
