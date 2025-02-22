import numpy as np
import pickle
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split

# ✅ Load the dataset (pose landmarks stored as NumPy arrays)
data = np.load("pose_dataset.npy")  # Shape: (samples, 33*2)
labels = np.load("pose_labels.npy")  # Shape: (samples,)

# ✅ Check dataset size
num_samples = data.shape[0]
if num_samples < 2:
    raise ValueError("Not enough samples to train the model. Add more data.")

# ✅ Split data into train & test sets
X_train, X_test, y_train, y_test = train_test_split(data, labels, test_size=0.2, random_state=42)

# ✅ Ensure n_neighbors is not greater than available training samples
n_neighbors = min(3, len(X_train))

# ✅ Train a K-Nearest Neighbors model
knn = KNeighborsClassifier(n_neighbors=n_neighbors)
knn.fit(X_train, y_train)

# ✅ Save the trained model
with open("pose_model.pkl", "wb") as f:
    pickle.dump(knn, f)

print(f"✅ Model trained with n_neighbors={n_neighbors} & saved as pose_model.pkl")
print(f"📊 Dataset size: {num_samples} samples")
print(f"🏷️ Unique labels: {np.unique(labels)}")
