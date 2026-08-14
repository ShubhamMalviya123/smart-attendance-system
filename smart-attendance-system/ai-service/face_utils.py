"""
Core face detection/recognition utilities using face_recognition (dlib) + OpenCV.
"""
import face_recognition
import numpy as np
import cv2
from typing import List, Tuple


def load_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Decode raw image bytes into an RGB numpy array."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    bgr_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if bgr_image is None:
        raise ValueError("Could not decode image - unsupported format or corrupted file")
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    return rgb_image


def resize_for_speed(rgb_image: np.ndarray, max_width: int = 640) -> np.ndarray:
    """
    Downscales an image so its width is at most `max_width`, preserving aspect ratio.
    Face detection/encoding time scales heavily with pixel count, so this is the
    single biggest speed lever - a 1920px classroom photo/frame can take 5-10x
    longer to process than the same photo resized to 640px, with little accuracy
    loss for attendance-style face matching.
    """
    height, width = rgb_image.shape[:2]
    if width <= max_width:
        return rgb_image
    scale = max_width / width
    new_size = (max_width, int(height * scale))
    return cv2.resize(rgb_image, new_size, interpolation=cv2.INTER_AREA)


def detect_faces(rgb_image: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """Returns list of face bounding boxes (top, right, bottom, left)."""
    return face_recognition.face_locations(rgb_image, model="hog")


def get_face_encodings(rgb_image: np.ndarray, face_locations=None) -> List[np.ndarray]:
    """Returns list of 128-d face encodings for all faces found in the image."""
    if face_locations is None:
        face_locations = detect_faces(rgb_image)
    return face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)


def average_encodings(encodings_list: List[np.ndarray]) -> np.ndarray:
    """Averages multiple encodings of the same person (from multiple registration images)."""
    if not encodings_list:
        raise ValueError("No face encodings provided to average")
    return np.mean(np.array(encodings_list), axis=0)


def match_face(unknown_encoding: np.ndarray, known_encodings: List[np.ndarray],
               known_roll_nos: List[str], tolerance: float = 0.5):
    """
    Compares one unknown face encoding against all known encodings.
    Returns (roll_no, confidence) of best match, or (None, 0.0) if no match within tolerance.
    Lower face distance = better match; confidence = 1 - distance (approx).
    """
    if not known_encodings:
        return None, 0.0

    distances = face_recognition.face_distance(known_encodings, unknown_encoding)
    best_idx = int(np.argmin(distances))
    best_distance = distances[best_idx]

    if best_distance <= tolerance:
        confidence = round(1 - best_distance, 4)
        return known_roll_nos[best_idx], confidence

    return None, 0.0
