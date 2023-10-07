import React, { useRef, useEffect } from "react";
import { useUserMedia } from "./hooks/useUserMedia";

const App: React.FC = () => {
  const { mediaStream, error, isLoading, initiate } = useUserMedia({
    audio: true,
    video: true
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasInitiatedRef = useRef(false);
  useEffect(() => {
    if (!hasInitiatedRef.current) {
      initiate();
      hasInitiatedRef.current = true;
    }
  }, [initiate]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.play();
    }
    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaStream]);

  console.log("MediaStream:", mediaStream);

  return (
    <div>
      {mediaStream ? (
        <video autoPlay playsInline ref={videoRef} />
      ) : (
        <button onClick={initiate}>Access Camera and Microphone</button>
      )}
      {error && <div>{error.message}</div>}
      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default App;
