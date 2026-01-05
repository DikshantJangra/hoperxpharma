// Test if event listener is working
const eventBus = require('./src/events/eventBus');
const { INVENTORY_EVENTS } = require('./src/events/eventTypes');

console.log('\n🧪 Testing Event Listener...\n');

// Check event history
console.log('Event history:', eventBus.getHistory(5));

// Listen for test event
eventBus.on('TEST_EVENT', (payload) => {
    console.log('✅ Event listener IS working! Received:', payload);
});

// Emit test event
console.log('\n1️⃣ Emitting test event...');
eventBus.emitEvent('TEST_EVENT', { test: 'data' });

// Now test a real inventory event
console.log('\n2️⃣ Emitting INVENTORY.LOW_STOCK event...');
eventBus.emitEvent(INVENTORY_EVENTS.LOW_STOCK, {
    storeId: 'cmj05wyqo0001149rer0lp7mr',
    entityType: 'drug',
    entityId: 'test-drug',
    drugName: 'Test Drug',
    currentStock: 2,
    reorderLevel: 10,
    deficit: 8,
});

// Wait a bit for async processing
setTimeout(() => {
    console.log('\n📊 Event history after test:', eventBus.getHistory(5));
    console.log('\n✅ Test complete. Check if alert was created.');
    process.exit(0);
}, 2000);
