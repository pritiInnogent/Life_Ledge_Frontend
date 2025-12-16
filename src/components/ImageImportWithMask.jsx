import React, { useEffect, useRef, useState } from "react";

export default function ImageImportWithMask({ file, cropArea, onMaskedReady }) {
  const canvasRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) return;

    const img = new Image();
    img.onload = () => maskImage(img);
    img.src = URL.createObjectURL(file);

    return () => {
      URL.revokeObjectURL(img.src);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, cropArea]);

  const maskImage = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // keep original resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,0,0,0.95)";

    if (cropArea) {
      // cropArea is in original image pixels (from react-easy-crop)
      const { x, y, width, height } = cropArea;
      ctx.fillRect(x, y, width, height);
    } else {
      // fallback: mask top header if no crop provided
      const HEADER_RATIO = 0.27;
      const maskHeight = canvas.height * HEADER_RATIO;
      ctx.fillRect(0, 0, canvas.width, maskHeight);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        const maskedFile = new File([blob], "masked.png", {
          type: "image/png",
        });

        onMaskedReady(maskedFile);
      },
      "image/png",
      1.0
    );
  };

  return (
    <div className="mt-4">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {previewUrl && (
        <div className="mt-2 border border-gray-200 rounded-2xl p-3">
          <p className="text-sm text-gray-600 mb-2">
            Preview (account number area hidden):
          </p>
          <img
            src={previewUrl}
            alt="Masked statement preview"
            className="w-full rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
