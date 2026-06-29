import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'PASTE_YOUR_GEMINI_KEY_HERE';

const isConfigured = () => GEMINI_API_KEY && GEMINI_API_KEY !== 'PASTE_YOUR_GEMINI_KEY_HERE';

const SAFETY_PROMPT = `You are a food-safety inspector for a home-cooking delivery platform.
Decide whether this kitchen is clean and hygienic enough to prepare food RIGHT NOW.

Judge ONLY things the cook can fix in the moment:
- cleanliness (visible dirt, grease, spills, dirty dishes or surfaces)
- clutter or rubbish in the food-prep area
- raw/cooked cross-contamination and unsafe food handling
- pests or signs of pests

Do NOT judge or even mention permanent, structural, or layout factors the cook
cannot change: kitchen size, room shape, the position or distance between the stove,
sink, counters, tables or furniture, and the type or age of appliances or cabinets.
Never mark the kitchen unsafe because of any of these.

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{
  "safe": true or false,
  "recommendations": "max 3 sentences on what looks good and what to clean or fix. Only mention fixable hygiene issues, never furniture placement or layout."
}

Be reasonable and practical, not overly strict. Pass kitchens that are reasonably
clean even if not perfect; only fail for genuine hygiene hazards.`;

export const checkKitchenSafety = async (base64Image, mimeType = 'image/jpeg') => {
    if (!isConfigured()) {
        return {
            safe: null,
            recommendations: 'Gemini API key not configured. Add GEMINI_API_KEY to backend/.env to enable kitchen safety checks.',
            configured: false,
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
            SAFETY_PROMPT,
            { inlineData: { data: base64Image, mimeType } },
        ]);

        let text = result.response.text().trim();
        text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

        const parsed = JSON.parse(text);
        return {
            safe: !!parsed.safe,
            recommendations: parsed.recommendations || 'No recommendations returned.',
            configured: true,
        };
    } catch (err) {
        console.error('Gemini kitchen check error:', err.message);
        return {
            safe: null,
            recommendations: 'Could not analyze the kitchen photo right now. Please try again.',
            configured: true,
        };
    }
};
