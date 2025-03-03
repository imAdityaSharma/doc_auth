import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';

const SecureImage = ({ src, alt, style }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true; // Flag to prevent setting state if component unmounts

    // Skip API call if src is empty or a data URL
    if (!src || src.startsWith('data:')) {
      setImageSrc(src);
      return;
    }

    // Skip API call if src is the default profile picture
    if (src === '/default-profile.png') {
      setImageSrc(src);
      return;
    }

    const loadImage = async () => {
      try {
        // Only make API call if src starts with /uploads/
        if (src.startsWith('/uploads/')) {
          const response = await axiosInstance.get(src, {
            responseType: 'blob'
          });
          if (isMounted) {
            const imageUrl = URL.createObjectURL(response.data);
            setImageSrc(imageUrl);
          }
        } else {
          if (isMounted) {
            setImageSrc(src);
          }
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent setting state after unmount
      if (imageSrc && !imageSrc.startsWith('data:') && !imageSrc.startsWith('/')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]); // Remove imageSrc from dependencies

  if (error || !imageSrc) {
    return (
      <img 
        src="/default-profile.png" 
        alt={alt} 
        style={style}
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop
          e.target.src = '/default-profile.png';
        }}
      />
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      style={style}
      onError={(e) => {
        setError(true);
      }}
    />
  );
};

export default SecureImage;