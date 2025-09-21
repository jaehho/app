# Pose Landmark Detection Web App

A real-time web application that uses MediaPipe PoseLandmarker to detect human pose landmarks from webcam input and transmit them to a server for logging.

## Features

- **Real-time Pose Detection**: Uses MediaPipe PoseLandmarker for accurate human pose detection
- **Webcam Integration**: Accesses user's webcam with permission handling
- **Live Visualization**: Real-time rendering of pose landmarks and connections on canvas
- **Server Integration**: Transmits detected landmarks to backend server via REST API
- **Demo Mode**: Fallback mode with simulated pose data for testing without camera/MediaPipe
- **Responsive Design**: Modern, responsive UI that works on desktop and mobile devices
- **Session Tracking**: Each session gets a unique ID for data organization
- **Error Handling**: Graceful degradation when camera or MediaPipe is unavailable

## Architecture

### Frontend
- **HTML5 Canvas**: For real-time pose visualization
- **MediaPipe Tasks Vision**: For pose landmark detection
- **Webcam API**: For camera access and video streaming
- **Fetch API**: For server communication
- **Responsive CSS**: Modern styling with gradient backgrounds

### Backend
- **Node.js + Express**: REST API server
- **CORS enabled**: For cross-origin requests
- **JSON parsing**: Handles landmark data
- **In-memory storage**: Stores recent pose data (configurable for database)
- **Health endpoints**: For monitoring and debugging

## API Endpoints

- `GET /` - Serves the main web application
- `POST /api/pose-landmarks` - Receives pose landmark data
- `GET /api/pose-data` - Returns recent pose data (for debugging)
- `GET /api/health` - Health check endpoint

## Installation & Usage

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the application**:
   Open http://localhost:3000 in your browser

### Usage Instructions

1. **Start Camera**: Click "Start Camera" to begin webcam access
2. **Grant Permissions**: Allow camera access when prompted
3. **Position Yourself**: Stand in front of the camera for pose detection
4. **Enable Data Sending**: Toggle data transmission to server
5. **Demo Mode**: Use "Start Demo Mode" for testing without camera

### Pose Landmarks

The application detects 33 standard pose landmarks including:
- Facial landmarks (nose, eyes, ears)
- Upper body (shoulders, elbows, wrists)
- Torso (chest, hips)
- Lower body (knees, ankles, feet)

Each landmark includes:
- `x, y`: Normalized coordinates (0-1)
- `z`: Depth coordinate
- `visibility`: Confidence score (0-1)

## Deployment

### Cloudflare Pages/Workers

The application is configured for deployment on Cloudflare with `wrangler.toml`:

1. **Configure Cloudflare**:
   - Set up a Cloudflare account
   - Create KV namespace for data storage
   - Update `wrangler.toml` with your namespace IDs

2. **Deploy**:
   ```bash
   wrangler publish
   ```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Data Format

Pose landmark data sent to server:

```json
{
  "landmarks": [
    {
      "x": 0.5,
      "y": 0.3,
      "z": 0.1,
      "visibility": 0.9
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "sessionId": "session_123456789_abc123"
}
```

## Browser Compatibility

- **Modern browsers** with WebRTC support
- **HTTPS required** for camera access in production
- **MediaPipe fallback** to demo mode if libraries fail to load

## Development Notes

- MediaPipe models are loaded from CDN
- Demo mode generates synthetic pose data for testing
- Server stores last 1000 pose entries in memory
- CORS enabled for development and production use

## License

MIT License