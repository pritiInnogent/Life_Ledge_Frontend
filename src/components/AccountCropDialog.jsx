import React, { useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function getCroppedImage(image, crop) {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(
        new File([blob], "transactions.png", { type: "image/png" })
      );
    }, "image/png");
  });
}

export default function AccountCropDialog({ imageFile, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 80,
    height: 60,
    x: 10,
    y: 20,
  });

  const [imageRef, setImageRef] = useState(null);

  const handleConfirm = async () => {
    if (!imageRef || !crop?.width || !crop?.height) return;
    const croppedFile = await getCroppedImage(imageRef, crop);
    onConfirm(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[100vw] max-w-6xl p-6">
        <h2 className="text-xl font-bold mb-2">
          Crop Transaction Area
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Drag and resize the box so that only transaction details remain.
          Header and personal information must be excluded.
        </p>

        <div className="max-h-[420px] overflow-auto rounded-xl border">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            keepSelection
          >
            <img
              src={URL.createObjectURL(imageFile)}
              onLoad={(e) => setImageRef(e.currentTarget)}
              alt="Crop transactions"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-3 mt-4">
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
