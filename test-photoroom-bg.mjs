import fs from 'fs';

async function test() {
    const apiKey = 'sandbox_sk_pr_leila_cad697ce9d8766e1e88a087f17a9da8c3e83de5e';

    // Real red dot png
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('imageFile', blob, 'test.png');
    formData.append('background.color', '#FFFFFF'); // Try background.color
    // formData.append('shadow.mode', 'ai.soft'); // skip shadow for a clean look first
    formData.append('padding', '0.1');

    try {
        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData
        });
        console.log('Status:', response.status);
        const buffer = await response.arrayBuffer();
        const header = Buffer.from(buffer).slice(0, 10).toString('hex');
        console.log('Header hex:', header); // to check if PNG or JPEG
    } catch (e) {
        console.error(e);
    }
}
test();
