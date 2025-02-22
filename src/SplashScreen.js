import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

const SplashScreen = ({ onLoaded }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      onLoaded(); // Notify parent when loading is complete
    }, 2000); // ✅ Show for 2 seconds
  }, []);

  return (
    loading && (
      <div className="splash-overlay">
        <div className="splash-container">
          <img src="/logo1.png" alt="App Icon" className="splash-icon" /> <br></br>
          <h1 className="splash-title">AI-AR Photography Assistant</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  );
};

export default SplashScreen;
