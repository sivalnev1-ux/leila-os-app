export const processImageWithPhotoroom = async (base64Image: string, prompt?: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_PHOTOROOM_API_KEY;
    if (!apiKey) throw new Error("Photoroom API key is not configured.");

    try {
        const byteCharacters = atob(base64Image);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('imageFile', blob, 'image.jpg');
        formData.append('padding', '0.05');
        formData.append('background.color', '#FFFFFF');
        formData.append('shadow.mode', 'ai.soft');

        if (prompt) {
            formData.append('describeAnyChange.mode', 'ai.auto');
            formData.append('describeAnyChange.prompt', prompt);
        }

        const response = await fetch('https://image-api.photoroom.com/v2/edit', {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
            body: formData,
        });

        if (!response.ok) throw new Error(`Photoroom API error: ${response.statusText}`);
        const responseBlob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(responseBlob);
        });
    } catch (error) {
        console.error("Failed to process image:", error);
        throw error;
    }
};
