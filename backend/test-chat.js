
async function testChat() {
    try {
        console.log('Sending prompt to chat API...');
        const response = await fetch('http://localhost:8000/api/v1/chat/prompt/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'What is HopeRx Pharma?'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        console.log('Response received:');
        console.log(data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testChat();
