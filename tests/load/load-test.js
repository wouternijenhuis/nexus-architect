import http from 'k6/http'
import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

export default function () {
  // Test API health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`)
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check returns ok': (r) => {
      const body = JSON.parse(r.body)
      return body.status === 'ok'
    },
  })

  sleep(1)

  // Test WebSocket connection (basic HTTP upgrade test)
  const wsRes = http.get(`${BASE_URL}/socket.io/?EIO=4&transport=polling`)
  check(wsRes, {
    'websocket endpoint accessible': (r) => r.status === 200,
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, options = {}) {
  const indent = options.indent || ''
  const enableColors = options.enableColors || false
  
  return `
${indent}Test Summary
${indent}============
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}Average Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
  `
}
