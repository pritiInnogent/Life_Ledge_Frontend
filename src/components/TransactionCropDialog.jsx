import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function getCroppedImage(imageSrc, cropPixels) {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;

      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    };
  });
}

export default function TransactionCropDialog({
  file,
  onCancel,
  onConfirm,
}) {
  const imageUrl = URL.createObjectURL(file);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);

  const onCropComplete = useCallback((_, pixels) => {
    setCropPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    const blob = await getCroppedImage(imageUrl, cropPixels);
    const croppedFile = new File([blob], "transactions.png", {
      type: "image/png",
    });
    onConfirm(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[90vw] max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-2">
          Crop Transaction Area
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Crop the image so only transaction details remain.
          Remove account number and personal info for privacy.
        </p>

        <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={null}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
