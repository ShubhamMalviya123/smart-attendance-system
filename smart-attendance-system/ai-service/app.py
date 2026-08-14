"""
Smart AI Classroom Attendance System - AI Microservice
Run with: uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""
import json
from typing import List

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from face_utils import (
    load_image_from_bytes,
    detect_faces,
    get_face_encodings,
    average_encodings,
    match_face,
    resize_for_speed,
)
from video_utils import extract_frames_from_video

app = FastAPI(title="Smart Attendance AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:9630"],  # Spring Boot backend
    allow_methods=["*"],
    allow_headers=["*"],
)

FACE_MATCH_TOLERANCE = 0.5  # lower = stricter matching; tune based on real testing
MAX_CLASSROOM_IMAGES = 50    # classroom attendance photos (not registration photos)
MAX_VIDEOS = 3               # how many video clips can be submitted for one attendance session
FRAME_INTERVAL_SECONDS = 2.5 # slightly longer interval = fewer frames = faster processing


@app.get("/health")
def health_check():
    return {"status": "AI service is running"}


@app.post("/detect-faces")
async def detect_faces_endpoint(image: UploadFile = File(...)):
    """Returns bounding boxes for all faces found in a single image."""
    image_bytes = await image.read()
    rgb_image = resize_for_speed(load_image_from_bytes(image_bytes))
    locations = detect_faces(rgb_image)
    return {"faces_found": len(locations), "locations": locations}


@app.post("/generate-encoding")
async def generate_encoding_endpoint(images: List[UploadFile] = File(...)):
    """
    Used during student face REGISTRATION.
    Accepts 1-5 images of the SAME student, returns one averaged 128-d encoding.
    (Kept small deliberately - registration wants a few clear, single-face photos,
    not a bulk batch.)
    """
    if len(images) < 1 or len(images) > 5:
        raise HTTPException(status_code=400, detail="Please upload between 1 and 5 images")

    all_encodings = []
    for img_file in images:
        image_bytes = await img_file.read()
        rgb_image = resize_for_speed(load_image_from_bytes(image_bytes))
        encodings = get_face_encodings(rgb_image)

        if len(encodings) == 0:
            raise HTTPException(status_code=400, detail=f"No face detected in '{img_file.filename}'")
        if len(encodings) > 1:
            raise HTTPException(status_code=400, detail=f"Multiple faces found in '{img_file.filename}' - please upload a photo with only one face for registration")

        all_encodings.append(encodings[0])

    averaged = average_encodings(all_encodings)
    return {"encoding": json.dumps(averaged.tolist())}


@app.post("/attendance/from-images")
async def attendance_from_images(
    images: List[UploadFile] = File(...),
    known_encodings: str = Form(...),
):
    """
    Used during TAKE ATTENDANCE via images (classroom photos, up to MAX_CLASSROOM_IMAGES).
    known_encodings: JSON string like [{"roll_no": "101", "encoding": [...]}]
    Returns unique list of recognized students across all images (duplicates removed).
    """
    if len(images) < 1 or len(images) > MAX_CLASSROOM_IMAGES:
        raise HTTPException(status_code=400, detail=f"Please upload between 1 and {MAX_CLASSROOM_IMAGES} images")

    known_list = json.loads(known_encodings)
    known_roll_nos = [item["roll_no"] for item in known_list]
    known_vectors = [item["encoding"] for item in known_list]

    recognized_map = {}  # roll_no -> best confidence seen across all images

    for img_file in images:
        image_bytes = await img_file.read()
        rgb_image = resize_for_speed(load_image_from_bytes(image_bytes))
        face_locations = detect_faces(rgb_image)
        face_encodings = get_face_encodings(rgb_image, face_locations)

        for encoding in face_encodings:
            roll_no, confidence = match_face(encoding, known_vectors, known_roll_nos, FACE_MATCH_TOLERANCE)
            if roll_no is not None:
                # keep the highest confidence if the same student appears in multiple images
                if roll_no not in recognized_map or confidence > recognized_map[roll_no]:
                    recognized_map[roll_no] = confidence

    recognized = [{"roll_no": roll, "confidence": conf} for roll, conf in recognized_map.items()]
    return {"recognized": recognized, "total_images_processed": len(images)}


@app.post("/attendance/from-video")
async def attendance_from_video(
    videos: List[UploadFile] = File(...),
    known_encodings: str = Form(...),
):
    """
    Used during TAKE ATTENDANCE via video - accepts 1 to MAX_VIDEOS clips in one go
    (e.g. separate recordings covering different parts of the classroom).
    Extracts a frame every FRAME_INTERVAL_SECONDS from EACH video, recognizes faces,
    deduplicates results across ALL videos combined, and returns the unique list of
    present students.
    """
    if len(videos) < 1 or len(videos) > MAX_VIDEOS:
        raise HTTPException(status_code=400, detail=f"Please upload between 1 and {MAX_VIDEOS} videos")

    known_list = json.loads(known_encodings)
    known_roll_nos = [item["roll_no"] for item in known_list]
    known_vectors = [item["encoding"] for item in known_list]

    recognized_map = {}  # roll_no -> best confidence seen across all frames of all videos
    total_frames_processed = 0

    for video in videos:
        video_bytes = await video.read()
        frames = extract_frames_from_video(
            video_bytes,
            interval_seconds=FRAME_INTERVAL_SECONDS,
            filename=video.filename or "video.mp4",
        )
        total_frames_processed += len(frames)

        for frame in frames:
            small_frame = resize_for_speed(frame)
            face_locations = detect_faces(small_frame)
            face_encodings = get_face_encodings(small_frame, face_locations)

            for encoding in face_encodings:
                roll_no, confidence = match_face(encoding, known_vectors, known_roll_nos, FACE_MATCH_TOLERANCE)
                if roll_no is not None:
                    if roll_no not in recognized_map or confidence > recognized_map[roll_no]:
                        recognized_map[roll_no] = confidence

    if total_frames_processed == 0:
        raise HTTPException(status_code=400, detail="Could not extract any frames from the uploaded video(s)")

    recognized = [{"roll_no": roll, "confidence": conf} for roll, conf in recognized_map.items()]
    return {"recognized": recognized, "total_frames_processed": total_frames_processed, "videos_processed": len(videos)}
