/**
 * AI Safety Check Microservice
 * 
 * This service handles safety verification for:
 * 1. Food hygiene checks for cook's kitchen
 * 2. Image-based safety verification (simulated)
 * 3. Content moderation for reviews
 * 4. Anomaly detection in orders
 * 
 * NOTE: This is a simulated AI service. For production,
 * integrate with actual ML models (TensorFlow, OpenCV, etc.)
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        service: 'AI Safety Check',
        status: 'running',
        version: '1.0.0',
        capabilities: [
            'hygiene_check',
            'image_moderation',
            'content_filtering',
            'anomaly_detection'
        ],
        note: 'Simulated AI service - replace with real ML models for production'
    });
});

// @desc    Check kitchen hygiene score
// @route   POST /api/safety/hygiene
const checkHygiene = async (req, res) => {
    try {
        const { 
            kitchenImage,
            cookId,
            previousScore,
            cleanlinessLevel
        } = req.body;

        console.log('Hygiene check requested for cook:', cookId);
        console.log('Cleanliness level:', cleanlinessLevel);

        // Simulated AI analysis
        const score = analyzeKitchenHygiene({
            previousScore,
            cleanlinessLevel
        });

        const result = {
            id: crypto.randomUUID(),
            cookId,
            type: 'HYGIENE_CHECK',
            score,
            status: score >= 70 ? 'PASS' : 'FAIL',
            timestamp: new Date().toISOString(),
            recommendations: generateRecommendations(score),
            note: 'Simulated result - configure ML model for production'
        };

        console.log('Hygiene check result:', result);

        res.json(result);
    } catch (error) {
        console.error('Hygiene check error:', error);
        res.status(500).json({ error: 'Hygiene check failed', details: error.message });
    }
};

// @desc    Moderate food image
// @route   POST /api/safety/moderate-image
const moderateImage = async (req, res) => {
    try {
        const { imageUrl, imageData } = req.body;

        console.log('Image moderation requested');

        // For now, always pass - in production, use actual ML model
        const result = {
            id: crypto.randomUUID(),
            imageUrl: imageUrl || 'data:image',
            type: 'IMAGE_MODERATION',
            isSafe: true,
            confidence: 0.95,
            flags: [],
            timestamp: new Date().toISOString(),
            note: 'Simulated result - configure vision ML model for production'
        };

        console.log('Image moderation result:', result);

        res.json(result);
    } catch (error) {
        console.error('Image moderation error:', error);
        res.status(500).json({ error: 'Image moderation failed', details: error.message });
    }
};

// @desc    Filter content (reviews, comments)
// @route   POST /api/safety/filter-content
const filterContent = async (req, res) => {
    try {
        const { content, type } = req.body;

        console.log('Content filter requested');

        const result = {
            id: crypto.randomUUID(),
            content,
            type,
            isApproved: true,
            filteredWords: [],
            sentiment: analyzeSentiment(content),
            timestamp: new Date().toISOString()
        };

        console.log('Content filter result:', result);

        res.json(result);
    } catch (error) {
        console.error('Content filter error:', error);
        res.status(500).json({ error: 'Content filtering failed', details: error.message });
    }
};

// @desc    Detect anomalies in orders
// @route   POST /api/safety/anomaly
const detectAnomaly = async (req, res) => {
    try {
        const { orderData, userId } = req.body;

        console.log('Anomaly detection requested for user:', userId);

        const result = {
            id: crypto.randomUUID(),
            userId,
            orderData,
            isAnomalous: false,
            riskScore: Math.random() * 20, // 0-20% risk (lower threshold)
            flags: [],
            timestamp: new Date().toISOString()
        };

        console.log('Anomaly detection result:', result);

        res.json(result);
    } catch (error) {
        console.error('Anomaly detection error:', error);
        res.status(500).json({ error: 'Anomaly detection failed', details: error.message });
    }
};

// @desc    Verify cook's identity
// @route   POST /api/safety/verify-cook
const verifyCook = async (req, res) => {
    try {
        const { cookId, verificationData } = req.body;

        console.log('Cook verification requested for:', cookId);

        const result = {
            id: crypto.randomUUID(),
            cookId,
            verificationId: crypto.randomUUID(),
            status: 'VERIFIED',
            verifiedAt: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            note: 'Simulated verification - configure identity verification for production'
        };

        console.log('Cook verification result:', result);

        res.json(result);
    } catch (error) {
        console.error('Cook verification error:', error);
        res.status(500).json({ error: 'Cook verification failed', details: error.message });
    }
};

// @desc    Analyze food image
// @route   POST /api/safety/analyze-food
const analyzeFood = async (req, res) => {
    try {
        const { imageUrl, foodName } = req.body;

        console.log('Food analysis requested');

        // Simulated food analysis
        const result = {
            id: crypto.randomUUID(),
            imageUrl,
            foodName: foodName || 'Unknown',
            analysis: {
                freshness: Math.round(70 + Math.random() * 30),
                quality: Math.round(75 + Math.random() * 25),
                hygiene: Math.round(80 + Math.random() * 20),
                recommended: true
            },
            timestamp: new Date().toISOString(),
            note: 'Simulated analysis - configure food recognition ML model for production'
        };

        console.log('Food analysis result:', result);

        res.json(result);
    } catch (error) {
        console.error('Food analysis error:', error);
        res.status(500).json({ error: 'Food analysis failed', details: error.message });
    }
};

// Helper functions
function analyzeKitchenHygiene(data) {
    let score = 70; // Default score
    
    if (data.previousScore) {
        score = (data.previousScore + 70) / 2;
    }
    
    if (data.cleanlinessLevel === 'excellent') score += 15;
    else if (data.cleanlinessLevel === 'good') score += 5;
    else if (data.cleanlinessLevel === 'average') score += 0;
    else if (data.cleanlinessLevel === 'poor') score -= 20;
    else if (data.cleanlinessLevel === 'bad') score -= 30;
    
    return Math.min(100, Math.max(0, Math.round(score)));
}

function generateRecommendations(score) {
    if (score >= 90) {
        return ['Excellent hygiene!', 'Keep up the great work.'];
    } else if (score >= 70) {
        return ['Good hygiene standards', 'Continue regular cleaning.'];
    } else if (score >= 50) {
        return ['Improvement needed', 'Review food safety guidelines.'];
    } else {
        return ['Critical issues found', 'Immediate action required.'];
    }
}

function analyzeSentiment(content) {
    const positive = ['great', 'amazing', 'delicious', 'excellent', 'love', 'best', 'awesome', 'fantastic'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disgusting', 'horrible', 'gross'];
    
    const lower = content.toLowerCase();
    let score = 0;
    
    positive.forEach(word => { if (lower.includes(word)) score += 1; });
    negative.forEach(word => { if (lower.includes(word)) score -= 1; });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
}

// Routes
app.post('/api/safety/hygiene', checkHygiene);
app.post('/api/safety/moderate-image', moderateImage);
app.post('/api/safety/filter-content', filterContent);
app.post('/api/safety/anomaly', detectAnomaly);
app.post('/api/safety/verify-cook', verifyCook);
app.post('/api/safety/analyze-food', analyzeFood);

const PORT = process.env.AI_PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 AI Safety Service running on port ${PORT}`);
    console.log('⚠️  WARNING: This is a simulated AI service');
    console.log('   Replace with real ML models for production use');
});
