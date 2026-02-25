async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBlJ3IH_7AIhstt4VXKMxhfrMbmR0Z7SXQ`);
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
