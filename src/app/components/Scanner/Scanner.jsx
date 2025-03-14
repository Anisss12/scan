"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./scanner.module.css";
import jsQR from "jsqr";
import Quagga from "quagga";

export default function Scanner() {
  const videoRef = useRef(null);
  const [output, setOutput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);

  useEffect(() => {
    if (scanning) {
      startScanner();
    }
  }, [scanning]);

  const startScanner = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Camera access is not supported in this browser. Please use Chrome, Firefox, or Edge."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      scanFrame();
      setTimeout(() => pauseScanning(), 10000);
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError") {
        alert(
          "Camera access denied. Please allow camera permissions in your browser settings."
        );
      } else if (err.name === "NotFoundError") {
        alert("No camera found on this device.");
      } else {
        alert("Unable to access the camera. Please try again.");
      }
    }
  };

  const scanFrame = () => {
    if (!scanning) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR codes
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    if (qrCode) {
      showOutput(qrCode.data);
      return;
    }

    // Scan for barcodes using Quagga
    Quagga.decodeSingle(
      {
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
          ],
        },
        locate: true,
        src: canvas.toDataURL(),
      },
      (result) => {
        if (result && result.codeResult) {
          showOutput(result.codeResult.code);
        } else {
          requestAnimationFrame(scanFrame);
        }
      }
    );
  };

  const showOutput = (result) => {
    setScanning(false);
    setOutput(`Scanned: ${result}`);
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const pauseScanning = () => {
    if (scanning) {
      setPaused(true);
      setScanning(false);
    }
  };

  const handleScanAgain = () => {
    setOutput("");
    setScanning(true);
    setPaused(false);
  };

  const handleAddToList = () => {
    setScannedItems([...scannedItems, output.replace("Scanned: ", "")]);
  };

  const handleCopyOutput = () => {
    navigator.clipboard
      .writeText(output.replace("Scanned: ", ""))
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Copy failed:", err));
  };

  const scanImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode) {
        showOutput(qrCode.data);
      } else {
        alert("No QR code detected in the image.");
      }
    };
  };

  return (
    <div className={styles.container}>
      <h1>QR & Barcode Scanner</h1>
      <button className={styles.btn} onClick={() => setScanning(true)}>
        Start Scanner
      </button>
      <button
        className={styles.btn}
        onClick={() => document.getElementById("fileInput").click()}
      >
        Upload Image
      </button>
      <input
        type="file"
        id="fileInput"
        accept="image/*"
        style={{ display: "none" }}
        onChange={scanImage}
      />

      <div
        id="scannerContainer"
        className={`${styles.scannerContainer} ${paused ? styles.paused : ""}`}
      >
        <div className={styles.scanLine}></div>
        <video ref={videoRef} autoPlay></video>
        {paused && <div className={styles.pausedMessage}>Paused Scanning</div>}
      </div>

      <div id="output" className={styles.output}>
        {output}
      </div>
      {output && (
        <>
          <button className={styles.btn} onClick={handleCopyOutput}>
            Copy Output
          </button>
          <button className={styles.btn} onClick={handleAddToList}>
            Add to List
          </button>
          <button className={styles.btn} onClick={handleScanAgain}>
            Scan Again
          </button>
        </>
      )}

      <div id="scannedList" className={styles.scannedList}>
        <h3>Scanned Items:</h3>
        <ul>
          {scannedItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
