import numpy as np
import os

# Get the absolute path of the backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSE_FILE = os.path.join(BASE_DIR, "ideal_pose_data.npy")

# Example pose data (replace with actual pose landmarks)
ideal_pose = {
    "pose1": [(0.5, 0.3), (0.6, 0.4), (0.7, 0.5)],
    "pose2": [(0.2, 0.5), (0.3, 0.6), (0.4, 0.7)],
}

# Save the data as an .npy file
np.save(POSE_FILE, ideal_pose)

print(f"✅ ideal_pose_data.npy saved at: {POSE_FILE}")
