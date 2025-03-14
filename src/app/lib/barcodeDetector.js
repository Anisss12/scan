export async function initBarcodeDetector() {
  if ("BarcodeDetector" in window) {
    return new BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13"] });
  } else {
    alert("Barcode Detector API is not supported in this browser.");
    return null;
  }
}
