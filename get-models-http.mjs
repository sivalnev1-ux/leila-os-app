async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error('GEMINI_API_KEY not set'); return; }
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        if (data.models) {
            for (const model of data.models) {
                if (model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(model.name);
                }
            }
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
