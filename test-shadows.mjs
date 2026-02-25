import fs from 'fs';

async function testMode(modeName) {
    const apiKey = 'sandbox_sk_pr_leila_cad697ce9d8766e1e88a087f17a9da8c3e83de5e';

    // Real test image (the user's last uploaded image)
    const imagePath = 'C:\\Users\\infop\\.gemini\\antigravity\\brain\\16f0aafb-6cb5-44e8-8c51-b2b92d48cd88\\uploaded_media_1771982815177.img';
    let base64Image = fs.readFileSync(imagePath, 'utf8');
    if (base64Image.includes(',')) {
        base64Image = base64Image.split(',')[1];
    }
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('imageFile', blob, 'test.jpg');
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
        }
    } catch (e) {
        console.error(e);
    }
}

async function runAll() {
    await testMode('ai.soft');
    await testMode('3d');
    await testMode('drop');
}

runAll();
