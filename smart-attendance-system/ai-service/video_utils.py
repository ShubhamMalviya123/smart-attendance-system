"""
Extracts frames from an uploaded classroom video at a fixed interval (e.g. every 1-2 seconds).
"""
import cv2
import numpy as np
from typing import List
import tempfile
import os


def extract_frames_from_video(video_bytes: bytes, interval_seconds: float = 1.5, filename: str = "video.mp4") -> List[np.ndarray]:
    """
    Saves video bytes to a temp file, opens it with OpenCV,
    and extracts one frame every `interval_seconds`.
    Returns a list of RGB numpy arrays.

    `filename` is used only to pick the correct suffix (.mp4, .webm, etc.)
    so OpenCV's backend picks the right decoder - browser-recorded live
    video typically arrives as .webm, while uploaded files are often .mp4.
    """
    tmp_path = None
    frames = []

    suffix = os.path.splitext(filename)[1] or ".mp4"

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file - unsupported format or corrupted file")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 25  # sensible fallback if metadata is missing

        frame_interval = int(fps * interval_seconds)
        if frame_interval < 1:
            frame_interval = 1

        frame_count = 0
        while True:
            ret, frame_bgr = cap.read()
            if not ret:
                break
            if frame_count % frame_interval == 0:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
            frame_count += 1

        cap.release()

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return frames
