// Simple test script to verify API connectivity
import { api } from './api.js';

async function testAPI() {
  console.log('🔍 Testing GhostShift API connectivity...');

  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:8000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test API base connectivity
    console.log('Testing API base endpoint...');
    try {
      const baseResponse = await api.request('/', { method: 'GET' });
      console.log('✅ API base endpoint accessible:', baseResponse);
    } catch (error) {
      console.log('ℹ️  API base endpoint test (expected to fail):', error.message);
    }

    // Test auth endpoints existence
    console.log('Testing auth endpoint existence...');
    try {
      const authResponse = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Auth endpoint exists (returned validation error as expected)');
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.log('❌ Auth endpoint not found');
      } else {
        console.log('✅ Auth endpoint exists (returned other error as expected):', error.message);
      }
    }

    console.log('🎉 API connectivity test completed!');
    return true;

  } catch (error) {
    console.error('❌ API connectivity test failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testAPI();
}

export default testAPI;