import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const MAX_IMAGES = 50;
const MAX_VIDEOS = 3;

export default function TakeAttendance() {
  const { classSessionId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState("images");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  const isLiveMode = mode === "live-photo" || mode === "live-video";

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setError("");
    } catch (err) {
      setError("Could not access camera. Allow camera permission and make sure no other app is using it.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isLiveMode) startCamera(); else stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const capturePhoto = () => {
    if (capturedPhotos.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} photos allowed. Remove one before capturing another.`);
      return;
    }
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const previewUrl = URL.createObjectURL(blob);
      setCapturedPhotos((prev) => [...prev, { blob, previewUrl }]);
    }, "image/jpeg", 0.92);
  };

  const removePhoto = (index) => {
    setCapturedPhotos((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedVideo(null);
    setRecordSeconds(0);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      setRecordedVideo({ blob, previewUrl: URL.createObjectURL(blob) });
      clearInterval(timerRef.current);
    };
    recorder.start();
    setIsRecording(true);
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    if (recordedVideo) URL.revokeObjectURL(recordedVideo.previewUrl);
    setRecordedVideo(null);
    setRecordSeconds(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      let url = "";
      if (mode === "images") {
        if (images.length < 1 || images.length > MAX_IMAGES) {
          setError(`Please select 1 to ${MAX_IMAGES} images`); setLoading(false); return;
        }
        for (let i = 0; i < images.length; i++) formData.append("images", images[i]);
        url = `/teacher/class/${classSessionId}/attendance/images`;
      } else if (mode === "video") {
        if (videos.length < 1 || videos.length > MAX_VIDEOS) {
          setError(`Please select 1 to ${MAX_VIDEOS} video files`); setLoading(false); return;
        }
        for (let i = 0; i < videos.length; i++) formData.append("videos", videos[i]);
        url = `/teacher/class/${classSessionId}/attendance/video`;
      } else if (mode === "live-photo") {
        if (capturedPhotos.length < 1) { setError("Please capture at least 1 photo"); setLoading(false); return; }
        capturedPhotos.forEach((p, i) => formData.append("images", p.blob, `capture-${i + 1}.jpg`));
        url = `/teacher/class/${classSessionId}/attendance/images`;
      } else if (mode === "live-video") {
        if (!recordedVideo) { setError("Please record a video first"); setLoading(false); return; }
        formData.append("videos", recordedVideo.blob, "live-recording.webm");
        url = `/teacher/class/${classSessionId}/attendance/video`;
      }
      const res = await api.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
      stopCamera();
    } catch (err) {
      setError(err.response?.data?.error || "Attendance processing failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => { setMode(newMode); setError(""); setResult(null); };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand"><span className="mark">A</span> Attendance Register</div>
      </div>
      <div className="page" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 20 }}>Take attendance</h2>

        <div className="tabbar">
          <button className={`tab ${mode === "images" ? "active" : ""}`} onClick={() => switchMode("images")}>Upload images</button>
          <button className={`tab ${mode === "video" ? "active" : ""}`} onClick={() => switchMode("video")}>Upload video</button>
          <button className={`tab ${mode === "live-photo" ? "active" : ""}`} onClick={() => switchMode("live-photo")}>📷 Live photo</button>
          <button className={`tab ${mode === "live-video" ? "active" : ""}`} onClick={() => switchMode("live-video")}>🎥 Live video</button>
        </div>

        <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
          Larger uploads take longer to process — a 2–3 minute video with several faces can take a minute or more.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="card section-gap">
          {mode === "images" && (
            <div className="field"><label>Classroom images (1–{MAX_IMAGES})</label>
              <input className="input" type="file" accept="image/*" multiple
                onChange={(e) => setImages(Array.from(e.target.files))} />
              {images.length > 0 && <div className="text-muted" style={{ marginTop: 6 }}>{images.length} image(s) selected</div>}
            </div>
          )}

          {mode === "video" && (
            <div className="field"><label>Classroom video(s) — up to {MAX_VIDEOS}</label>
              <input className="input" type="file" accept="video/*" multiple
                onChange={(e) => setVideos(Array.from(e.target.files).slice(0, MAX_VIDEOS))} />
              {videos.length > 0 && (
                <div className="text-muted" style={{ marginTop: 6 }}>
                  {videos.map((v) => v.name).join(", ")}
                </div>
              )}
            </div>
          )}

          {mode === "live-photo" && (
            <div>
              <div className="camera-frame"><video ref={videoRef} autoPlay playsInline muted /></div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <button type="button" className="btn btn-primary btn-block"
                onClick={capturePhoto} disabled={!cameraActive || capturedPhotos.length >= MAX_IMAGES}>
                📸 Capture photo ({capturedPhotos.length}/{MAX_IMAGES})
              </button>
              {capturedPhotos.length > 0 && (
                <div className="thumb-row">
                  {capturedPhotos.map((p, i) => (
                    <div key={i} className="thumb">
                      <img src={p.previewUrl} alt={`capture-${i}`} />
                      <button type="button" className="btn btn-ghost-danger" onClick={() => removePhoto(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "live-video" && (
            <div>
              {!recordedVideo ? (
                <>
                  <div className="camera-frame"><video ref={videoRef} autoPlay playsInline muted /></div>
                  {!isRecording ? (
                    <button type="button" className="btn btn-danger btn-block" onClick={startRecording} disabled={!cameraActive}>
                      ⏺ Start recording
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline btn-block" onClick={stopRecording}>
                      ⏹ Stop recording ({recordSeconds}s)
                    </button>
                  )}
                </>
              ) : (
                <>
                  <video src={recordedVideo.previewUrl} controls style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />
                  <button type="button" className="btn btn-outline btn-block" onClick={retakeVideo}>🔄 Retake video</button>
                </>
              )}
              <p className="text-muted" style={{ marginTop: 10 }}>Live video capture records one clip at a time — for multiple clips, use "Upload video" instead.</p>
            </div>
          )}

          <button className="btn btn-brass btn-block" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? "Processing… this can take a while for video" : "Process attendance"}
          </button>
        </form>

        {result && (
          <div className="card">
            <div className="card-title">Result</div>
            <p className="text-muted" style={{ marginBottom: 16 }}>
              Total {result.totalStudents} · Present {result.presentCount} · Absent {result.absentCount}
            </p>

            <table className="ledger" style={{ marginBottom: 20 }}>
              <thead><tr><th>Roll</th><th>Name</th><th>Status</th><th>Confidence</th></tr></thead>
              <tbody>
                {result.presentStudents.map((s) => (
                  <tr key={s.rollNo}>
                    <td className="roll">{s.rollNo}</td><td>{s.name}</td>
                    <td><span className="stamp stamp-present">Present</span></td>
                    <td className="mono">{s.confidenceScore != null ? (s.confidenceScore * 100).toFixed(1) + "%" : "—"}</td>
                  </tr>
                ))}
                {result.absentStudents.map((s) => (
                  <tr key={s.rollNo}>
                    <td className="roll">{s.rollNo}</td><td>{s.name}</td>
                    <td><span className="stamp stamp-absent">Absent</span></td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="btn btn-outline" onClick={() => navigate("/teacher")}>Back to dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
