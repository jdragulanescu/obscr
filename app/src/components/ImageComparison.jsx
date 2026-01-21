import React from "react";

export const ImageComparison = ({ images }) => {
  if (!images) return null;

  return (
    <>
      <div className="result-section">
        <div className="result-label">Image Comparison</div>
        <div className="diff-info">
          <span className="diff-stat">
            Average pixel difference: {images.averageDifference} / 255
          </span>
        </div>
        <div className="image-comparison">
          <div className="image-item">
            <div className="image-item-label">Original</div>
            <img src={images.original} alt="Original" className="result-thumbnail" />
          </div>
          <div className="image-item">
            <div className="image-item-label">Encoded</div>
            <img src={images.encoded} alt="Encoded" className="result-thumbnail" />
          </div>
        </div>
      </div>

      <div className="result-section">
        <div className="result-label">Visual Difference (Amplified)</div>
        <div className="diff-info">
          <span className="diff-stat">
            Green areas show modified pixels. Brighter = larger changes.
            {parseFloat(images.averageDifference) < 0.5 &&
              " Very low average difference - changes are nearly invisible!"
            }
          </span>
        </div>
        <div className="diff-container">
          <img src={images.diff} alt="Difference visualization" className="result-diff" />
        </div>
      </div>
    </>
  );
};
