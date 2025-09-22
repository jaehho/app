class PoseLandmarkApp {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.demoBtn = document.getElementById('demoBtn');
        this.toggleSendBtn = document.getElementById('toggleSendBtn');
        
        this.cameraStatus = document.getElementById('cameraStatus');
        this.poseStatus = document.getElementById('poseStatus');
        this.sendStatus = document.getElementById('sendStatus');
        this.landmarkCount = document.getElementById('landmarkCount');
        this.landmarkDetails = document.getElementById('landmarkDetails');
        
        this.poseLandmarker = null;
        this.isDetecting = false;
        this.isSendingData = false;
        this.landmarksSent = 0;
        this.sessionId = this.generateSessionId();
        this.animationId = null;
        
        this.initializeEventListeners();
        this.initializeMediaPipe();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCamera());
        this.stopBtn.addEventListener('click', () => this.stopCamera());
        this.demoBtn.addEventListener('click', () => this.startDemoMode());
        this.toggleSendBtn.addEventListener('click', () => this.toggleDataSending());
    }
    
    async initializeMediaPipe() {
        try {
            // Check if MediaPipe is available
            if (typeof MediaPipeTasksVision !== 'undefined') {
                const { PoseLandmarker, FilesetResolver } = MediaPipeTasksVision;
                
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                
                this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1
                });
                
                console.log('MediaPipe initialized successfully');
                this.updateStatus('poseStatus', 'MediaPipe Ready', 'active');
            } else {
                console.warn('MediaPipe not available, using demo mode');
                this.poseLandmarker = null;
                this.updateStatus('poseStatus', 'Demo Mode (No MediaPipe)', 'active');
            }
        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            console.log('Falling back to demo mode');
            this.poseLandmarker = null;
            this.updateStatus('poseStatus', 'Demo Mode', 'active');
        }
    }
    
    async startCamera() {
        try {
            this.updateStatus('cameraStatus', 'Starting...', 'active');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = stream;
            
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.canvas.style.width = this.video.offsetWidth + 'px';
                this.canvas.style.height = this.video.offsetHeight + 'px';
                
                // Start pose detection loop
                this.detectPose();
            };
            
            await this.video.play();
            this.isDetecting = true;
            
            this.updateStatus('cameraStatus', 'Active', 'active');
            this.updateStatus('poseStatus', 'Detecting...', 'active');
            
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.toggleSendBtn.disabled = false;
            
        } catch (error) {
            console.error('Error starting camera:', error);
            this.updateStatus('cameraStatus', 'Error: ' + error.message, 'error');
            alert('Failed to start camera. Please ensure you have granted camera permissions.');
        }
    }
    
    startDemoMode() {
        // Create a demo canvas for visualization
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.canvas.style.width = '640px';
        this.canvas.style.height = '480px';
        
        this.isDetecting = true;
        this.updateStatus('cameraStatus', 'Demo Mode Active', 'active');
        this.updateStatus('poseStatus', 'Generating Demo Data', 'active');
        
        this.startBtn.disabled = true;
        this.demoBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.toggleSendBtn.disabled = false;
        
        // Start demo detection loop
        this.detectPose();
    }
    detectPose() {
        if (!this.isDetecting) {
            return;
        }
        
        if (this.video && this.video.readyState === 4 && this.poseLandmarker) {
            try {
                // Real MediaPipe detection
                const startTimeMs = performance.now();
                const results = this.poseLandmarker.detectForVideo(this.video, startTimeMs);
                this.onPoseResults(results);
            } catch (error) {
                console.error('Error detecting pose:', error);
                // Fallback to demo mode
                this.generateDemoLandmarks();
            }
        } else {
            // Demo mode - generate fake landmarks
            this.generateDemoLandmarks();
        }
        
        this.animationId = requestAnimationFrame(() => this.detectPose());
    }
    
    generateDemoLandmarks() {
        // Generate demo pose landmarks for demonstration
        const time = Date.now() / 1000;
        const demoLandmarks = [];
        
        // Create 33 landmarks (standard pose landmarks count)
        for (let i = 0; i < 33; i++) {
            const baseX = 0.5;
            const baseY = 0.3 + (i / 33) * 0.4;
            
            demoLandmarks.push({
                x: baseX + Math.sin(time + i * 0.1) * 0.1,
                y: baseY + Math.cos(time + i * 0.2) * 0.05,
                z: Math.sin(time + i * 0.15) * 0.1,
                visibility: 0.8 + Math.random() * 0.2
            });
        }
        
        const demoResults = {
            landmarks: [demoLandmarks]
        };
        
        this.onPoseResults(demoResults);
    }
    
    stopCamera() {
        this.isDetecting = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateStatus('cameraStatus', 'Stopped', '');
        this.updateStatus('poseStatus', 'Waiting', '');
        
        this.startBtn.disabled = false;
        this.demoBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.toggleSendBtn.disabled = true;
        
        if (this.isSendingData) {
            this.toggleDataSending();
        }
    }
    
    toggleDataSending() {
        this.isSendingData = !this.isSendingData;
        
        if (this.isSendingData) {
            this.updateStatus('sendStatus', 'Enabled', 'active');
            this.toggleSendBtn.textContent = 'Disable Data Sending';
            this.toggleSendBtn.classList.add('active');
        } else {
            this.updateStatus('sendStatus', 'Disabled', '');
            this.toggleSendBtn.textContent = 'Enable Data Sending';
            this.toggleSendBtn.classList.remove('active');
        }
    }
    
    onPoseResults(results) {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the pose landmarks
        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0]; // Get first pose
            this.drawPoseLandmarks(landmarks);
            this.updateStatus('poseStatus', 'Pose Detected', 'active');
            
            // Update landmark details
            this.updateLandmarkDetails(landmarks);
            
            // Send data if enabled
            if (this.isSendingData) {
                this.sendLandmarksToServer(landmarks);
            }
        } else {
            this.updateStatus('poseStatus', 'No Pose Detected', '');
            this.landmarkDetails.textContent = 'No pose detected';
        }
        
        this.ctx.restore();
    }
    
    drawPoseLandmarks(landmarks) {
        // Draw connections
        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
            [11, 23], [12, 24], [23, 24], // Torso
            [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
            [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
            [27, 31], [28, 32] // Feet
        ];
        
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    landmarks[start].x * this.canvas.width,
                    landmarks[start].y * this.canvas.height
                );
                this.ctx.lineTo(
                    landmarks[end].x * this.canvas.width,
                    landmarks[end].y * this.canvas.height
                );
                this.ctx.stroke();
            }
        });
        
        // Draw landmarks
        this.ctx.fillStyle = '#FF0000';
        landmarks.forEach((landmark, index) => {
            if (landmark.visibility === undefined || landmark.visibility > 0.5) {
                this.ctx.beginPath();
                this.ctx.arc(
                    landmark.x * this.canvas.width,
                    landmark.y * this.canvas.height,
                    5,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            }
        });
    }
    
    updateLandmarkDetails(landmarks) {
        const visibleLandmarks = landmarks.filter(l => l.visibility === undefined || l.visibility > 0.5);
        const details = `
Detected: ${landmarks.length} landmarks
Visible: ${visibleLandmarks.length} landmarks
Timestamp: ${new Date().toLocaleTimeString()}
Session ID: ${this.sessionId}

Key Points:
- Nose: ${landmarks[0] ? `(${(landmarks[0].x * 100).toFixed(1)}, ${(landmarks[0].y * 100).toFixed(1)})` : 'Not detected'}
- Left Shoulder: ${landmarks[11] ? `(${(landmarks[11].x * 100).toFixed(1)}, ${(landmarks[11].y * 100).toFixed(1)})` : 'Not detected'}
- Right Shoulder: ${landmarks[12] ? `(${(landmarks[12].x * 100).toFixed(1)}, ${(landmarks[12].y * 100).toFixed(1)})` : 'Not detected'}
- Left Hip: ${landmarks[23] ? `(${(landmarks[23].x * 100).toFixed(1)}, ${(landmarks[23].y * 100).toFixed(1)})` : 'Not detected'}
- Right Hip: ${landmarks[24] ? `(${(landmarks[24].x * 100).toFixed(1)}, ${(landmarks[24].y * 100).toFixed(1)})` : 'Not detected'}
        `.trim();
        
        this.landmarkDetails.textContent = details;
    }
    
    async sendLandmarksToServer(landmarks) {
        try {
            const data = {
                landmarks: landmarks.map(landmark => ({
                    x: landmark.x,
                    y: landmark.y,
                    z: landmark.z,
                    visibility: landmark.visibility || 1.0
                })),
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId
            };
            
            const response = await fetch('/api/pose-landmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.landmarksSent++;
                this.landmarkCount.textContent = this.landmarksSent;
            } else {
                console.error('Failed to send landmarks:', response.statusText);
            }
            
        } catch (error) {
            console.error('Error sending landmarks to server:', error);
        }
    }
    
    updateStatus(elementId, text, className = '') {
        const element = document.getElementById(elementId);
        element.textContent = text;
        element.className = 'status-value ' + className;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PoseLandmarkApp();
});