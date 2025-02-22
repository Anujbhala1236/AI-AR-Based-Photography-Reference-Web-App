import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./CameraFeed.css";

const API_URL = "https://ai-ar-backend.onrender.com/analyze";

const IdealPoseOverlay = ({ webcamRef, landmarks }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const drawPose = () => {
      if (!webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!video || !ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length >= 2) {
        // Define body part connections
        const skeleton = [
          [0, 1], [1, 2], [2, 3], [3, 4],    // Right arm
          [0, 5], [5, 6], [6, 7], [7, 8],    // Left arm
          [0, 9], [9, 10], [10, 11], [11, 12], // Torso
          [9, 13], [13, 15], [15, 17],       // Right leg
          [10, 14], [14, 16], [16, 18]       // Left leg
        ];
    
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
    
        // Convert normalized keypoints to pixel values
        const keypoints = [];
        for (let i = 0; i < landmarks.length; i += 2) {
          keypoints.push({
            x: landmarks[i] * canvas.width,
            y: landmarks[i + 1] * canvas.height
          });
        }
    
        // Draw skeleton connections
        skeleton.forEach(([start, end]) => {
          if (keypoints[start] && keypoints[end]) {
            ctx.beginPath();
            ctx.moveTo(keypoints[start].x, keypoints[start].y);
            ctx.lineTo(keypoints[end].x, keypoints[end].y);
            ctx.stroke();
          }
        });
    
        // Draw keypoints
        ctx.fillStyle = "red";
        keypoints.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    };

    drawPose();
  }, [landmarks]);

  return <canvas ref={canvasRef} className="pose-overlay" />;
};

const CameraFeed = () => {
  const webcamRef = useRef(null);
  const [response, setResponse] = useState("Waiting for AI analysis...");
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedHighResImage, setCapturedHighResImage] = useState(null); // ✅ Fix
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const analyzePose = async () => {
    setResponse("🔄 Analyzing pose...");
    setLoading(true);
  
    try {
      const video = webcamRef.current.video;
      if (!video) {
        setResponse("❌ Webcam not available.");
        setLoading(false);
        return;
      }
  
      const screenshot = webcamRef.current.getScreenshot();
      console.log("Captured Image:", screenshot);  // Debugging line
  
      if (!screenshot) {
        setResponse("❌ Error capturing image for analysis.");
        setLoading(false);
        return;
      }
  
      // Convert base64 to Blob for better handling
      const blob = await (await fetch(screenshot)).blob();
      const formData = new FormData();
      formData.append("file", blob, "pose.jpg");
  
      console.log("Sending FormData:", formData);  // Debugging line
  
      const { data } = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      console.log("API Response:", data);  // Debugging line
  
      if (data.landmarks) {
        setLandmarks(data.landmarks);
        setShowOverlay(true);
        setResponse("✅ Overlay displayed. Align yourself!");
      } else {
        setResponse("⚠️ No pose detected.");
      }
    } catch (error) {
      console.error("❌ Analysis Failed:", error.response?.data || error.message);
      setResponse("⚠️ Pose analysis failed.");
    }
    setLoading(false);
  };
  
  /*const captureImage = () => {
    if (!webcamRef.current) {
      setResponse("❌ Error: Webcam not found.");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setResponse("❌ Error: Unable to capture image.");
      return;
    }

    setCapturedImage(imageSrc);
    setResponse("📸 Image Captured! Ready for Download.");
    setShowOverlay(false);
  }; */

  
  const captureImage = () => {
    if (!webcamRef.current || !webcamRef.current.video) {
        setResponse("❌ Error: Webcam not found.");
        return;
    }

    const video = webcamRef.current.video;
    const canvas = document.createElement("canvas");
    canvas.width = 1929;
    canvas.height = (video.videoHeight / video.videoWidth) * 1920;
    const ctx = canvas.getContext("2d");

    // Mirror the image
    if (facingMode === "user") {
      // Front Camera (Mirror Image)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
  } else {
      // Rear Camera (Normal)
      ctx.translate(0, 0);
      ctx.scale(1, 1);
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const highResImageSrc = canvas.toDataURL("image/png", 1.0);
   // const highResImageSrc = highResCanvas.toDataURL("image/png", 1.0);

    
    const lowResImageSrc = webcamRef.current.getScreenshot();

    if (!lowResImageSrc || !highResImageSrc) {
        setResponse("❌ Error: Unable to capture image.");
        return;
    }

    setCapturedImage(lowResImageSrc); // Show low-res image in UI
    setCapturedHighResImage(highResImageSrc); // Store high-res for download
    setResponse("📸 Image Captured! Ready for Download.");
    setShowOverlay(false);
};


  const resetCamera = () => {
    setCapturedImage(null);
    setShowOverlay(false);
    setLandmarks([]);
  };

  const downloadImage = (quality) => {
    if (!capturedHighResImage) {
      setResponse("⚠️ No captured image found.");
      return;
    }

    const link = document.createElement("a");
    link.href = capturedHighResImage;

    if (quality === "hd") {
      link.download = "captured_image_hd.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowDownloadPopup(false);
      setShowFeedback(true); // 
    } else {
      alert("🔒 Enhanced HD is locked! Unlock in future updates.");
    }
  };

  const submitFeedback = (rating) => {
    alert(`Thanks for rating us ${rating} stars! ⭐`);
    setShowFeedback(false);
  };

  return (
    <div className="camera-container">
      <div className="video-wrapper">
        {capturedImage ? (
          <div className="captured-wrapper">
            <img src={capturedImage} alt="Captured" className="captured-image" />
          </div>
        ) : (
          <div className="webcam-wrapper">
            <Webcam
              ref={webcamRef}
              className="webcam"
              screenshotFormat="image/jpeg"
              mirrored={facingMode === "user"}
              videoConstraints={{ facingMode: facingMode }}
            />
            {showOverlay && <IdealPoseOverlay webcamRef={webcamRef} landmarks={landmarks} />}
          </div>
        )}
      </div>

      <button onClick={toggleCamera} className="toggle-button">🔄 Switch Camera</button>

      {!showOverlay && !capturedImage && (
        <button 
        onClick={analyzePose} 
        className="analyze-button" 
        disabled={loading} 
        style={{ backgroundColor: "#ff9800", color: "white", fontWeight: "bold" }}
      >
        {loading ? "⏳ Analyzing..." : "🤖 Analyze Pose"}
      </button>
      
      )}

      {showOverlay && !capturedImage && (
        <button onClick={captureImage} className="capture-button">📸 Capture</button>
      )}

      {capturedImage && (
        <>
          <button onClick={() => setShowDownloadPopup(true)} className="download-button">⬇️ Download Image</button>
          <button onClick={resetCamera} className="reset-button">❌ Retake</button>
        </>
      )}

      {showDownloadPopup && (
        <div className="popup">
          <h3>📷 Select Image Quality</h3>
          <button className="hd-button" onClick={() => downloadImage("hd")}>HD (Free) ✅</button>
          <button className="locked-button" disabled>Enhanced HD (🔒 Locked)</button>
          <button className="cancel-button" onClick={() => setShowDownloadPopup(false)}>❌ Cancel</button>
        </div>
      )}

      <div className="result-container">
        <h3>AI Suggestions:</h3>
        <pre className="result-box">{response}</pre>
      </div>

      {/* ✅ Feedback Page */}
      {showFeedback && (
        <div className="feedback-container">
          <h2>🎉 Download Complete!</h2>
          <p>How was your experience?</p>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} onClick={() => submitFeedback(star)}>⭐</span>
            ))}
          </div>
          <button className="close-button"onClick={() => setShowFeedback(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
