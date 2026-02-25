import fs from 'fs';

async function test() {
    const apiKey = 'sk_pr_leila_cad697ce9d8766e1e88a087f17a9da8c3e83de5e';

    const base64Image = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image_file', blob, 'test.jpg');
    formData.append('background.color', '#FFFFFF');

    try {
        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData
        });
        console.log('Status:', response.status);
        console.log('Text:', await response.text());
    } catch (e) {
        console.error(e);
    }
}
test();
