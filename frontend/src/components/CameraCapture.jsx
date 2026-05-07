import React, { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Basic OMR detection from an image using Canvas API.
 * Divides image into a grid, detects filled bubbles by dark pixel density.
 * Returns an array of detected answers ['A','B','C','D',''] per question.
 */
function detectOMRFromCanvas(canvas, totalQuestions) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const cols = 4; // A B C D
  const rows = totalQuestions;

  // Define the answer area (skip ~10% margins on each side)
  const marginX = Math.floor(width * 0.1);
  const marginY = Math.floor(height * 0.1);
  const areaW = width - marginX * 2;
  const areaH = height - marginY * 2;

  const cellW = Math.floor(areaW / cols);
  const cellH = Math.floor(areaH / rows);

  const answers = [];
  const OPTIONS = ['A', 'B', 'C', 'D'];

  for (let r = 0; r < rows; r++) {
    let bestOption = '';
    let bestDensity = 0;
    const threshold = 0.25; // 25% dark pixels = filled

    for (let c = 0; c < cols; c++) {
      const x = marginX + c * cellW;
      const y = marginY + r * cellH;
      const imageData = ctx.getImageData(x, y, cellW, cellH);
      const pixels = imageData.data;

      let darkCount = 0;
      const total = cellW * cellH;

      for (let p = 0; p < pixels.length; p += 4) {
        const r2 = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
        const brightness = (r2 + g + b) / 3;
        if (brightness < 128) darkCount++; // dark pixel
      }

      const density = darkCount / total;
      if (density > threshold && density > bestDensity) {
        bestDensity = density;
        bestOption = OPTIONS[c];
      }
    }
    answers.push(bestOption);
  }
  return answers;
}

export default function CameraCapture({ onDetected, totalQuestions, mode = 'camera' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [processing, setProcessing] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
    } catch {
      toast.error('Camera access denied. Please use manual input.');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStreaming(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg'));
    stopCamera();
    processCanvas(canvas);
  };

  const processCanvas = (canvas) => {
    setProcessing(true);
    setTimeout(() => {
      try {
        const answers = detectOMRFromCanvas(canvas, totalQuestions);
        onDetected(answers);
        toast.success(`Detected ${answers.filter(Boolean).length} answers from image`);
      } catch {
        toast.error('OMR detection failed. Please verify answers manually.');
      }
      setProcessing(false);
    }, 800);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setCaptured(url);
      processCanvas(canvas);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!captured && (
        <>
          {mode === 'camera' && (
            <>
              {streaming ? (
                <div className="camera-wrapper">
                  <video ref={videoRef} autoPlay playsInline muted />
                </div>
              ) : (
                <div className="upload-zone" onClick={startCamera}>
                  <div className="upload-icon">📷</div>
                  <p>Click to open camera</p>
                </div>
              )}
              <div className="flex gap-8">
                {streaming && <button className="btn btn-primary btn-full" onClick={capture}>📸 Capture</button>}
                {streaming && <button className="btn btn-secondary" onClick={stopCamera}>✕ Cancel</button>}
              </div>
            </>
          )}

          {mode === 'upload' && (
            <div className="upload-zone" onClick={() => fileRef.current.click()}>
              <div className="upload-icon">🖼️</div>
              <p>Click to upload OMR sheet image</p>
              <p className="text-sm text-muted mt-8">JPG, PNG supported</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
          )}
        </>
      )}

      {captured && (
        <div>
          <img src={captured} alt="Captured OMR" style={{ width: '100%', borderRadius: 'var(--radius)', border: '2px solid var(--accent-light)' }} />
          <button className="btn btn-secondary btn-sm mt-12" onClick={() => setCaptured(null)}>🔄 Retake / Re-upload</button>
        </div>
      )}

      {processing && (
        <div className="flex-center gap-12" style={{ padding: 20, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <span>Processing OMR image...</span>
        </div>
      )}
    </div>
  );
}
