"use client";

import React, { useState, useEffect, useRef } from "react";

const QRBarcodeScanner = () => {
  const [activeTab, setActiveTab] = useState("scan");
  const [scanning, setScanning] = useState(false);
  const [barcodeDetector, setBarcodeDetector] = useState(null);
  const [outputText, setOutputText] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const videoRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Barcode Detector API
  useEffect(() => {
    if ("BarcodeDetector" in window) {
      setBarcodeDetector(
        new BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13"] })
      );
    } else {
      showToast(
        "Barcode Detector API not supported. Use a library like QuaggaJS."
      );
    }
  }, []);

  // Function to show toast messages
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  };

  // Start Scanner
  const requestCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: "camera" });

      if (permission.state === "denied") {
        showToast("Camera access is blocked. Enable it in browser settings.");
        return;
      }

      startScanner(); // Start scanner only if permission is allowed
    } catch (err) {
      showToast("Failed to check permission: " + err.message);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: "camera" });

      if (permission.state === "denied") {
        showToast("Camera access is blocked. Enable it in browser settings.");
        return;
      }

      startScanner(); // Start scanner only if permission is granted
    } catch (err) {
      showToast("Failed to check permission: " + err.message);
    }
  };

  const startScanner = async () => {
    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
        setScanning(true);
        scanBarcode();
      }
    } catch (err) {
      showToast("Camera access denied: " + err.message);
    }
  };

  // Call requestCameraPermission() instead of startScanner()

  // Call requestCameraPermission() instead of startScanner()

  // Scan Barcode
  const scanBarcode = async () => {
    if (!scanning || !barcodeDetector || !videoRef.current) return;

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    try {
      let barcodes = await barcodeDetector.detect(canvas);
      if (barcodes.length > 0) {
        showOutput(barcodes[0].rawValue);
        return;
      }
    } catch (err) {
      console.error("Barcode scanning error:", err);
    }

    requestAnimationFrame(scanBarcode);
  };

  // Show Output after Scanning
  const showOutput = (result) => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setOutputText("Scanned: " + result);
    showToast("Scan successful!");
  };

  // Manual Image Scan
  const scanImage = (event) => {
    let file = event.target.files[0];
    if (!file) return;

    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        let barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          showOutput(barcodes[0].rawValue);
        } else {
          showToast("No QR or Barcode detected.");
        }
      } catch (err) {
        console.error("Image scanning error:", err);
      }
    };
  };

  // Copy Output to Clipboard
  const copyOutput = () => {
    if (!outputText) return;
    navigator.clipboard
      .writeText(outputText.replace("Scanned: ", ""))
      .then(() => showToast("Copied to clipboard!"))
      .catch((err) => showToast("Copy failed: " + err));
  };

  // Add Scanned Item to List
  const addToList = () => {
    let text = outputText.replace("Scanned: ", "");
    if (!text) return;
    setScannedItems([...scannedItems, text]);
    showToast("Added to list!");
  };

  return (
    <div className="wrapper">
      <h1 className="heading">QR & Barcode Scanner</h1>

      {/* Scanner */}
      {activeTab === "scan" && (
        <div id="scannerContainer" ref={scannerContainerRef}>
          <div className="scan-line"></div>
          <video ref={videoRef} autoPlay playsInline></video>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={scanImage}
      />

      {outputText && (
        <div>
          <p>{outputText}</p>
          <button className="btn" onClick={copyOutput}>
            Copy Output
          </button>
          <button className="btn" onClick={addToList}>
            Add to List
          </button>
        </div>
      )}

      {/* Scanned Items List */}
      {scannedItems.length > 0 && (
        <div id="scannedList">
          <h3>Scanned Items:</h3>
          <ul>
            {scannedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && <div id="toast">{toastMessage}</div>}

      {/* Bottom Tab Bar */}
      <div className="bottombar">
        <label className="round" onClick={() => setActiveTab("home")}>
          <i
            className={`fa-solid fa-house tab ${
              activeTab === "home" ? "active" : ""
            }`}
          ></i>
          <p>Home</p>
        </label>

        <label className="round" onClick={() => fileInputRef.current.click()}>
          <i className="fa-regular fa-image tab"></i>
          <p>Image</p>
        </label>

        <label className="round" onClick={startScanner}>
          <i
            className={`fa-solid fa-qrcode tab ${
              activeTab === "scan" ? "active" : ""
            }`}
          ></i>
          <p>Scan</p>
        </label>

        <label className="round" onClick={() => setActiveTab("list")}>
          <i
            className={`fa-regular fa-rectangle-list tab ${
              activeTab === "list" ? "active" : ""
            }`}
          ></i>
          <p>List</p>
        </label>
      </div>
    </div>
  );
};

export default QRBarcodeScanner;
