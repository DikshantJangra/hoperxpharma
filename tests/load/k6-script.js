import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '30s', target: 0 },  // Ramp down
    ],
};

const BASE_URL = 'http://localhost:3000/api/v1';

export default function () {
    // 1. Search for patients
    const searchRes = http.get(`${BASE_URL}/patients?search=John`);
    check(searchRes, {
        'search status is 200': (r) => r.status === 200,
        'search duration < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(1);

    // 2. Get patient details (mock ID)
    // In real test, extract ID from search result
    const patientId = 'cm41...'; // Replace with valid ID if possible or use dynamic
    // For now, we'll skip if we don't have IDs or assume seeded data

    // 3. Get history
    // http.get(`${BASE_URL}/patients/${patientId}/history`);

    sleep(1);
}
