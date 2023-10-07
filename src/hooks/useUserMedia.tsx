import { useState, useCallback, useMemo, useEffect } from "react";

type MediaStreamConstraints = {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
};

const DEFAULT_VIDEO_CONSTRAINTS = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
};

const DEFAULT_AUDIO_CONSTRAINTS = {
    noiseSuppression: true,
    echoCancellation: true
};

function getGetUserMedia() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    } else if ((navigator as any).webkitGetUserMedia) {
        return (navigator as any).webkitGetUserMedia.bind(navigator);
    } else if ((navigator as any).mozGetUserMedia) {
        return (navigator as any).mozGetUserMedia.bind(navigator);
    } else if ((navigator as any).getUserMedia) {
        return (navigator as any).getUserMedia.bind(navigator);
    } else {
        return null;
    }
}

export const useUserMedia = (constraints: MediaStreamConstraints) => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const computedConstraints = useMemo(
        () => ({
            audio: constraints.audio ?? DEFAULT_AUDIO_CONSTRAINTS,
            video: constraints.video ?? DEFAULT_VIDEO_CONSTRAINTS
        }),
        [constraints]
    );

    const initiate = useCallback(async () => {
        setIsLoading(true);
        const getUserMedia = getGetUserMedia();
        try {
            if (!getUserMedia) {
                throw new Error("Your browser doesn't support getUserMedia.");
            }
            const stream = await getUserMedia(computedConstraints);
            setMediaStream(stream);
            setPermissionDenied(false);
        } catch (err) {
            if (err instanceof Error) {
                switch (err.name) {
                    case "NotAllowedError":
                    case "PermissionDeniedError":
                        setPermissionDenied(true);
                        setError(new Error("Please allow access to continue."));
                        break;
                    case "OverconstrainedError":
                        setError(new Error("Cannot satisfy the constraints."));
                        break;
                    case "NotFoundError":
                        setError(new Error("No media device found."));
                        break;
                    case "NotReadableError":
                        setError(new Error("Media device is already in use."));
                        break;
                    default:
                        setError(new Error("An issue occurred. Please try again."));
                        break;
                }
            } else {
                setError(new Error("An unexpected error occurred."));
            }
        } finally {
            setIsLoading(false);
        }
    }, [computedConstraints]);

    useEffect(() => {
        return () => {
            mediaStream?.getTracks().forEach((track) => track.stop());
        };
    }, [mediaStream]);

    return { mediaStream, error, isLoading, initiate, permissionDenied };
};
