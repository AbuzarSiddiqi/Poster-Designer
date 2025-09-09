import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractImage = (response: any): string | null => {
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
        }
    }
    return null;
}

export const suggestConcept = async (
    images: { base64: string, mimeType: string }[], 
    hint: string,
    referenceImage?: { base64: string, mimeType: string }
): Promise<string> => {
  try {
    let prompt: string;
    const parts: any[] = [];

    // Case 1: New feature - hint and reference image provided
    if (hint && referenceImage) {
        prompt = `You are an expert prompt writer for an image generation AI.
1. Analyze the reference image for its artistic style, composition, mood, and color palette.
2. Analyze the product image(s) to understand the subject.
3. Read the user's idea: "${hint}".
4. Your task is to generate a new, detailed prompt for the image generation AI. This prompt should instruct the AI to create a poster that:
   - Replicates the artistic style (e.g., photorealistic, illustrative), mood (e.g., dark, vibrant), and color scheme of the reference image.
   - Features the product from the product image(s) as the main subject.
   - Incorporates the user's idea as the central theme or modification.
The final output MUST be only the generated prompt itself, which will serve as a creative concept. It should be a detailed phrase or sentence. Do not add any extra explanations or conversational text.`;

        parts.push({ text: prompt });
        parts.push({ text: "Reference image for style inspiration:" });
        parts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
        
        images.forEach(img => {
            parts.push({ text: "Product image to include:" });
            parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
        });

    // Case 2: Only a hint is provided
    } else if (hint) {
        prompt = `Analyze the following product image(s) and the user's initial idea: "${hint}". Based on these, expand the idea into a more detailed and compelling concept for a marketing poster. The final concept MUST be approximately 100 to 150 characters long. For example, if the idea is 'summer vibe', you might suggest 'Experience the crisp, refreshing taste of summer with our all-natural citrus soda.'`;
        parts.push({ text: prompt });
        images.forEach(img => {
            parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
        });

    // Case 3: Only product images are provided
    } else {
        prompt = "Analyze the following product image(s). Based on the product, its style, and potential audience, generate a creative and compelling concept for a marketing poster. The concept MUST be a detailed phrase or sentence, approximately 100 to 150 characters long. Be descriptive and inspiring.";
        parts.push({ text: prompt });
        images.forEach(img => {
            parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
        });
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
    });
    return response.text;
  } catch (error) {
    console.error("Error in suggestConcept:", error);
    throw new Error("Failed to generate a concept. Please try again.");
  }
};


export const removeBackground = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: { data: base64Image, mimeType },
                },
                { text: 'Remove the background completely, keeping only the main product. Make the background transparent.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    const resultImage = extractImage(response);
    if (!resultImage) {
        throw new Error("AI did not return an image for background removal.");
    }
    return resultImage;
  } catch (error) {
    console.error("Error in removeBackground:", error);
    throw new Error("Failed to remove background. Please try again.");
  }
};

export const generatePoster = async (
    productImages: { data: string; mimeType: string }[],
    concept: string,
    ratio: string,
    base64ReferenceImage?: string,
    referenceMimeType?: string,
    base64LogoImage?: string,
    logoMimeType?: string
): Promise<string> => {
    try {
        const parts: any[] = [
            { text: `Create a dynamic and eye-catching poster with an aspect ratio of ${ratio}. The creative concept is: "${concept}". Place the following product(s) naturally within the generated scene.` }
        ];

        productImages.forEach(img => {
            parts.push({ text: "This is a product image with a transparent background to be included in the poster." });
            parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        });
        
        if (base64ReferenceImage && referenceMimeType) {
            parts.push({ text: "Use this reference image for style, color, and mood inspiration:" });
            parts.push({ inlineData: { data: base64ReferenceImage, mimeType: referenceMimeType } });
        }

        if (base64LogoImage && logoMimeType) {
            parts.push({ text: "CRITICAL INSTRUCTION: You MUST apply the following brand logo as a realistic sticker or branding element onto any packaging or serving container depicted in the image (e.g., bottles, boxes, cans, cups). The logo's placement should look natural and be clearly visible. It is crucial that the logo is NOT placed anywhere else, such as on the main product if it's not packaged, or floating in the background. Do not omit the logo." });
            parts.push({ inlineData: { data: base64LogoImage, mimeType: logoMimeType } });
        }


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const resultImage = extractImage(response);
        if (!resultImage) {
            throw new Error("AI did not return a poster image.");
        }
        return resultImage;
    } catch (error) {
        console.error("Error in generatePoster:", error);
        throw new Error("Failed to generate poster. Please try a different concept.");
    }
};


export const editPoster = async (base64Poster: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Poster, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        const resultImage = extractImage(response);
        if (!resultImage) {
            throw new Error("AI did not return an edited image.");
        }
        return resultImage;
    } catch (error) {
        console.error("Error in editPoster:", error);
        throw new Error("Failed to edit poster. Please try a different instruction.");
    }
};