import React, { useState } from "react";
import CameraFeed from "./CameraFeed";
import SplashScreen from "./SplashScreen";
import "./App.css";

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <SplashScreen onLoaded={() => setLoaded(true)} />}
      {loaded && (
        <div className="app-container">
          <header className="app-header">
            
            <h1>📸 AI-AR Photography Assistant</h1>
            <p>Get AI-powered pose suggestions & lighting analysis!</p>
          </header>

          <main className="app-content">
            <CameraFeed />
          </main>

          <footer className="app-footer">
            <p>🚀 Built with ❤️ by <span className="highlight">Hanu</span></p>
          </footer>
        </div>
      )}
    </>
  );
}

export default App;
