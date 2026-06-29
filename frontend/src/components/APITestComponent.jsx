// Simple component to test API connectivity
import React, { useState, useEffect } from 'react';

const APITestComponent = () => {
  const [status, setStatus] = useState('testing');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setStatus('testing');

        // Test health endpoint
        const healthResponse = await fetch('http://localhost:8000/health');
        const healthData = await healthResponse.json();

        // Test API documentation
        const docsResponse = await fetch('http://localhost:8000/docs');
        const docsStatus = docsResponse.status;

        // Test OpenAPI spec
        const openapiResponse = await fetch('http://localhost:8000/openapi.json');
        const openapiStatus = openapiResponse.status;

        setResults({
          health: healthData,
          docs: docsStatus,
          openapi: openapiStatus
        });

        setStatus('success');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    testAPI();
  }, []);

  if (status === 'testing') {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p>🔍 Testing API connectivity...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-800">❌ API Test Failed: {error}</p>
        <p className="text-red-600 text-sm mt-2">
          Please ensure the GhostShift backend is running on http://localhost:8000
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 rounded-lg">
        <p className="text-green-800 font-semibold">🎉 API Connectivity Test Passed!</p>
        <div className="mt-2 text-sm text-green-700">
          <p>Health Check: {results.health.status}</p>
          <p>API Docs: {results.docs === 200 ? '✅ Accessible' : '❌ Not accessible'}</p>
          <p>OpenAPI Spec: {results.openapi === 200 ? '✅ Accessible' : '❌ Not accessible'}</p>
        </div>
        <p className="text-green-600 text-xs mt-2">
          The GhostShift backend is ready for integration!
        </p>
      </div>
    );
  }

  return null;
};

export default APITestComponent;