import React, { useState, useCallback } from "react";
import Cropper from 'react-easy-crop';
import axiosInstance from '../../utils/axios';
import "./ImageCropper.css";

function ImageCropper({ imageToCrop, onImageCropped, onCancel }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set width and height to make the output a square
        const size = Math.min(image.width, image.height);
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            size,
            size
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            setLoading(true);
            setError(null);

            // Get the cropped image as blob
            const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);

            // Create FormData and append the cropped image
            const formData = new FormData();
            formData.append('profile_pic', croppedImage, 'profile.jpg');

            // Send to server
            const response = await axiosInstance.post('/comms/profile_pic_update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                onImageCropped(URL.createObjectURL(croppedImage));
                setLoading(false);
            }
        } catch (err) {
            setError(err.message || 'Failed to process image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cropper-container">
            <div className="cropper-content">
                <h3>Crop Profile Picture</h3>
                <div className="cropper-wrapper">
                    <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>
                <div className="cropper-controls">
                    <div className="zoom-control">
                        <label>Zoom</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="button-group">
                        <button 
                            className="cancel-button" 
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            className="save-button" 
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageCropper;