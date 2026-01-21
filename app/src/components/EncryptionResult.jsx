import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ImageComparison } from "./ImageComparison";
import { CheckCircle2, Download } from "lucide-react";
import { generateImageDiff, downloadBlob } from "../lib/steg";

export const EncryptionResult = ({ result, onReset }) => {
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      if (!result.originalFile || !result.encodedBlob) {
        setLoading(false);
        return;
      }

      try {
        // Convert blob to File for diff generation
        const encodedFile = new File([result.encodedBlob], "encoded.png", { type: "image/png" });
        const imageData = await generateImageDiff(result.originalFile, encodedFile);

        if (imageData?.ok) {
          setImages(imageData);
        }
      } catch (err) {
        console.error("Failed to generate image diff:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [result]);

  if (!result) return null;

  return (
    <div className="encryption-result">
      <div className="result-header">
        <CheckCircle2 size={24} className="success-icon" />
        <h3>Encryption Successful!</h3>
      </div>

      <div className="result-content">
        <div className="result-section">
          <div className="result-label">Output Image</div>
          <div className="result-value">{result.outputPath}</div>
        </div>

        {images && !loading && <ImageComparison images={images} />}

        {loading && (
          <div className="result-section">
            <div className="result-label">Loading images...</div>
          </div>
        )}

        {result.capacity && (
          <div className="result-section">
            <div className="result-label">Capacity Statistics</div>
            <div className="capacity-stats">
              <div className="stat-item">
                <span className="stat-label">Capacity Used:</span>
                <span className="stat-value">{result.capacity.utilization}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Bits:</span>
                <span className="stat-value">{result.capacity.totalBits?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Used Bits:</span>
                <span className="stat-value">{result.capacity.usedBits?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="result-info">
          <p>Your message has been encrypted with AES-256-GCM and hidden in the image using LSB steganography.</p>
          <p>The entire image capacity has been filled with random data to prevent statistical analysis.</p>
          <p>The encrypted image has been downloaded to your device.</p>
        </div>
      </div>

      <div className="result-actions">
        <Button
          variant="primary"
          onClick={() => downloadBlob(result.encodedBlob, result.outputPath || "encoded.png")}
        >
          <Download size={16} />
          Download Encoded Image
        </Button>
        <Button variant="outline" onClick={onReset}>
          Encrypt Another Message
        </Button>
      </div>
    </div>
  );
};
