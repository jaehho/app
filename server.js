const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Store for pose landmarks (in production, this would be a database)
const poseData = [];

// Root route - serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to receive pose landmarks
app.post('/api/pose-landmarks', (req, res) => {
    try {
        const { landmarks, timestamp, sessionId } = req.body;
        
        if (!landmarks || !Array.isArray(landmarks)) {
            return res.status(400).json({ 
                error: 'Invalid landmarks data', 
                message: 'Landmarks must be an array' 
            });
        }

        // Create pose data entry
        const poseEntry = {
            id: Date.now() + Math.random(),
            landmarks: landmarks,
            timestamp: timestamp || new Date().toISOString(),
            sessionId: sessionId || 'default',
            receivedAt: new Date().toISOString()
        };

        // Store the data (in memory for now)
        poseData.push(poseEntry);
        
        // Keep only the last 1000 entries to prevent memory issues
        if (poseData.length > 1000) {
            poseData.splice(0, poseData.length - 1000);
        }

        // Log the received data
        console.log(`[${new Date().toISOString()}] Received pose landmarks:`, {
            landmarkCount: landmarks.length,
            sessionId: poseEntry.sessionId,
            timestamp: poseEntry.timestamp
        });

        res.status(200).json({ 
            success: true, 
            message: 'Pose landmarks received successfully',
            id: poseEntry.id
        });

    } catch (error) {
        console.error('Error processing pose landmarks:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Failed to process pose landmarks' 
        });
    }
});

// API endpoint to get stored pose data (for debugging/monitoring)
app.get('/api/pose-data', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const recentData = poseData.slice(-limit);
    
    res.json({
        total: poseData.length,
        data: recentData
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        storedEntries: poseData.length
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Pose Landmark Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});

module.exports = app;