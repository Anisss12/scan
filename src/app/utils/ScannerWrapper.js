"use client"; // This must be at the top

import dynamic from "next/dynamic";

const Scanner = dynamic(() => import("./scanner"), {
  ssr: false,
});

const ScannerWrapper = () => {
  return <Scanner />;
};

export default ScannerWrapper;
