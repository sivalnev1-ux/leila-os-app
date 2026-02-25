import fs from 'fs';

async function testMode(modeName) {
    const apiKey = 'sandbox_sk_pr_leila_cad697ce9d8766e1e88a087f17a9da8c3e83de5e';

    // Real red dot png
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('imageFile', blob, 'test.png');
    formData.append('background.color', '#FFFFFF');
    formData.append('shadow.mode', modeName);
    formData.append('padding', '0.1');

    try {
        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
            body: formData
        });
        console.log(`Mode: ${modeName} - Status:`, response.status);
        if (!response.ok) {
            console.log(`Error:`, await response.text());
        } else {
            console.log("Success");
        }
    } catch (e) {
        console.error(e);
    }
}

async function runAll() {
    await testMode('ai.soft');
    await testMode('ai.hard');
    await testMode('none');
}

runAll();
