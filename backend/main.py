from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import pickle

app = FastAPI()

# ✅ Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load AI Pose Model
with open("pose_model.pkl", "rb") as f:
    pose_model = pickle.load(f)

# ✅ Load Ideal Pose Dataset
ideal_pose_data = np.load("ideal_pose_data.npy", allow_pickle=True).item()

# ✅ Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

@app.get("/")
def read_root():
    return {"message": "Welcome to AI-AR Backend!"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        print(f"📸 Received file: {file.filename}")

        # ✅ Read image data
        image_data = await file.read()
        image_np = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

        if image is None:
            return {"error": "Invalid image format. Try another image."}

        # ✅ Convert BGR to RGB (required by MediaPipe)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # ✅ Detect pose
        results = pose.process(image_rgb)
        if not results.pose_landmarks:
            return {"poses": "No pose detected ❌", "landmarks": None}

        # ✅ Extract landmarks
        landmarks = np.array([[lm.x, lm.y] for lm in results.pose_landmarks.landmark]).flatten()

        # ✅ Predict the closest ideal pose
        ideal_pose_label = pose_model.predict([landmarks])[0]

        # ✅ Get Ideal Pose Keypoints
        ideal_pose_landmarks = ideal_pose_data.get(ideal_pose_label, [])

        # ✅ Calculate Pose Similarity
        similarity = sum(
            np.linalg.norm(np.array([landmarks[i], landmarks[i+1]]) - 
                           np.array([ideal_pose_landmarks[i]["x"], ideal_pose_landmarks[i]["y"]]))
            for i in range(0, len(ideal_pose_landmarks)*2, 2)
        ) / len(ideal_pose_landmarks) if ideal_pose_landmarks else 1.0

        feedback = "Perfect Pose! ✅" if similarity < 0.05 else "Adjust your position slightly. 🔄"

        return {
            "poses": "Pose detected ✅",
            "landmarks": landmarks.tolist(),
            "ideal_pose": ideal_pose_landmarks,
            "ideal_pose_label": ideal_pose_label,
            "feedback": feedback,
            "lighting": analyze_lighting(image)
        }

    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return {"error": f"Failed to process image: {str(e)}"}

def analyze_lighting(image):
    """ 
    Analyze lighting direction based on brightness in different regions of the image 
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        left_region = gray[:, :width // 3]
        center_region = gray[:, width // 3: 2 * width // 3]
        right_region = gray[:, 2 * width // 3:]

        left_brightness = np.mean(left_region)
        center_brightness = np.mean(center_region)
        right_brightness = np.mean(right_region)

        if left_brightness > right_brightness and left_brightness > center_brightness:
            return "Light source from the LEFT 🔆"
        elif right_brightness > left_brightness and right_brightness > center_brightness:
            return "Light source from the RIGHT 🔆"
        elif center_brightness > left_brightness and center_brightness > right_brightness:
            return "Light source from the CENTER 🔆"
        else:
            return "Lighting is evenly distributed"

    except Exception as e:
        print(f"❌ Error analyzing lighting: {str(e)}")
        return "Error detecting lighting"
