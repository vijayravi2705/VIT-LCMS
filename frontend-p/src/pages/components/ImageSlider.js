import './ImageSlider.css';  // Correct CSS file
import vit5 from '../assets/images/vit3.png';
import vit7 from '../assets/images/vitsjtv.jpg';
import vit2 from '../assets/images/sjtev1.jpg';
import vit4 from '../assets/images/gv1.jpg';
import vit8 from '../assets/images/fm1.jpg';


import React, { useState, useEffect } from 'react';
const images = [vit5,vit4,vit7,vit2,vit8];

export default function ImageSlider() {
  const [current, setCurrent] = useState(0);

  // Auto slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 2000);  // 4 seconds
    return () => clearInterval(timer);  // Clean up on unmount
  }, []);

  return (
    <div className="slider">
      <img src={images[current]} alt="Campus" className="slider-image fade" />
      <div className="dots">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={current === idx ? 'dot active' : 'dot'}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
}
