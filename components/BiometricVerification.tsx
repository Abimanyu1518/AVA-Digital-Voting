import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from './Button.tsx';
import TriColorBorderBox from './TriColorBorderBox.tsx';
import CameraIcon from './icons/CameraIcon.tsx';

interface BiometricVerificationProps {
  registeredUserPhoto: string;
  onSuccess: () => void;
  onNavigateBack: () => void;
}

type VerificationStatus = 'pending' | 'failure';

const BiometricVerification: React.FC<BiometricVerificationProps> = ({ registeredUserPhoto, onSuccess, onNavigateBack }) => {
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isCameraActive) return;
    let stream: MediaStream | null = null;
    const videoElement = videoRef.current;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setCameraError(null);
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        setCameraError("Camera access denied. Enable it in your browser settings.");
        setIsCameraActive(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [isCameraActive]);

  const handleCaptureAndVerify = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !registeredUserPhoto) return;

    // The canvas is still used to "capture" the photo, even if we don't send it anywhere.
    // This maintains the user experience of a photo being taken.
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setIsVerifying(true);
      setErrorMessage('');

      // --- MOCKED VERIFICATION ---
      // Simulate network delay for verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Always return a success result to keep the app flow working
      const result = { isMatch: true, message: 'Biometric verification successful.' };
      // --- END MOCKED VERIFICATION ---
      
      setIsVerifying(false);
      
      if (result.isMatch) {
        onSuccess();
      } else {
        // This path is not currently reachable but kept for logical completeness
        setStatus('failure');
        setErrorMessage(result.message || 'Your face does not match your stored photo. Please ensure you are the correct person and face the camera directly.');
        setIsCameraActive(false);
      }
    }
  }, [registeredUserPhoto, onSuccess]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      handleCaptureAndVerify();
      setCountdown(null);
      return;
    }

    const timerId = setTimeout(() => {
      setCountdown(c => (c ? c - 1 : null));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [countdown, handleCaptureAndVerify]);


  const handleStartVerification = () => {
    if (countdown === null) {
      setCountdown(3);
    }
  };

  const handleRetry = () => {
    setStatus('pending');
    setErrorMessage('');
    setIsCameraActive(true);
  };

  const handleStartCamera = () => {
    setCameraError(null);
    setIsCameraActive(true);
  };
  
  const getBorderState = (): 'success' | 'error' | 'default' => {
      if (isVerifying) return 'default';
      if (status === 'failure') return 'error';
      return 'default';
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-[fadeIn_0.5s_ease-in-out]">
        <h1 className="font-poppins text-5xl font-extrabold text-white mb-4 text-center">Biometric Verification</h1>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl text-center">Please face the camera. We need to verify that your live image matches your registered photo.</p>

        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-6">
          <div className="flex flex-col items-center space-y-4">
            <h2 className="font-poppins text-xl font-bold text-[#FF9933]">Registered Photo</h2>
            <TriColorBorderBox borderStyle="default" className="w-64 h-64 bg-gray-800/50 rounded-lg overflow-hidden">
              <img src={registeredUserPhoto} alt="Registered voter" className="w-full h-full object-cover scale-x-[-1]" />
            </TriColorBorderBox>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <h2 className="font-poppins text-xl font-bold text-[#FF9933]">Live Camera</h2>
            <TriColorBorderBox
              borderStyle={getBorderState()}
              isPulsing={isVerifying}
              className="w-64 h-64 bg-gray-800/50 rounded-lg flex flex-col items-center justify-center p-4 text-center overflow-hidden relative"
            >
              {!isCameraActive && !isVerifying && (
                 <div className="text-center p-4">
                  <CameraIcon className="w-24 h-24 text-gray-400 mx-auto" />
                   {cameraError && <p className="text-red-400 text-sm mt-2">{cameraError}</p>}
                </div>
              )}
              {isCameraActive && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />}
              {isCameraActive && countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <span className="font-poppins text-9xl font-extrabold text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)]" style={{ animation: 'zoom-in-out 1s infinite' }}>
                    {countdown}
                  </span>
                </div>
              )}
              {isVerifying && <p className="font-poppins text-xl">Verifying...</p>}
              {status === 'failure' && <div className="text-6xl">❌</div>}
            </TriColorBorderBox>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
            
        {status === 'failure' && (
            <div className="my-4 p-4 bg-red-900/50 border border-red-500 rounded-lg max-w-lg text-center">
                <p className="text-sm text-red-200">{errorMessage}</p>
            </div>
        )}
        
        <div className="h-14 flex items-center space-x-4 mb-4">
          {status === 'pending' && !isCameraActive && <Button type="button" onClick={handleStartCamera}>Start Camera</Button>}
          {status === 'pending' && isCameraActive && <Button type="button" onClick={handleStartVerification} isLoading={isVerifying} disabled={countdown !== null}>{countdown !== null ? 'Capturing...' : 'Capture & Verify'}</Button>}
          {status === 'failure' && <Button type="button" onClick={handleRetry}>Try Again</Button>}
        </div>
        
        <Button type="button" onClick={onNavigateBack} variant="secondary">Back</Button>
    </div>
  );
};

export default BiometricVerification;