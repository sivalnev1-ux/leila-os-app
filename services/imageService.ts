export const processImageWithPhotoroom = async (base64Image: string, prompt?: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_PHOTOROOM_API_KEY;
    if (!apiKey) {
        throw new Error("Photoroom API key is not configured.");
    }

    try {
        // 1. Convert base64 string to Blob
        const byteCharacters = atob(base64Image);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append('imageFile', blob, 'image.jpg');

        // Always guarantee a clean slate, square crop, white background and soft shadow
        formData.append('padding', '0.05');
        formData.append('background.color', '#FFFFFF');
        formData.append('shadow.mode', 'ai.soft');

        // 3. Generative AI Settings (v2)
        if (prompt) {
            formData.append('describeAnyChange.mode', 'ai.auto');
            formData.append('describeAnyChange.prompt', prompt);
        }

        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Photoroom API Error:", errorText);
            throw new Error(`Photoroom API error: ${response.statusText}`);
        }

        // 4. Get response blob and convert back to base64
        const responseBlob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // Strip the data URL prefix (data:image/png;base64,)
                resolve(base64data.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(responseBlob);
        });
    } catch (error) {
        console.error("Failed to process image with Photoroom:", error);
        throw error;
    }
};
