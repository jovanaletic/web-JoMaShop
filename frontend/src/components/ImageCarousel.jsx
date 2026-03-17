import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../css/ImageCarousel.css';

const ImageCarousel = ({ images, height = "300px" }) => {
  if (!images || images.length === 0) {
    return (
      <div className="no-image-placeholder" style={{ height }}>
        <p>Nema slika</p>
      </div>
    );
  }

  return (
    <div className="image-carousel-container" style={{ height }}>
      <Carousel
        showArrows={true}
        showThumbs={images.length > 1}
        infiniteLoop={true}
        dynamicHeight={false}
        emulateTouch={true}
        showStatus={false}
        useKeyboardArrows={true}
        swipeable={true}
      >
        {images.map((image, index) => {
          // ISPRAVKA: Proveri da li URL već počinje sa http
          let imageUrl;
          if (image.startsWith('blob:') || image.startsWith('http://') || image.startsWith('https://')) {
            imageUrl = image;
          } else {
            imageUrl = `http://localhost:5000${image}`;
          }
          
          return (
            <div key={index} style={{ height }}>
              <img
                src={imageUrl}
                alt={`Slika ${index + 1}`}
                style={{ height, objectFit: 'contain' }}
              />
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default ImageCarousel;