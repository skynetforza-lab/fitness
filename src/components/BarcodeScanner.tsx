import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const READER_ID = "barcode-reader-container";

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  // Use a ref to ignore detections after the first one (debounce/single-shot)
  const detectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 140 },
          aspectRatio: 1.6,
        },
        (decoded) => {
          if (detectedRef.current) return;
          detectedRef.current = true;
          // Stop scanner before firing callback so camera releases cleanly
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              if (mounted) onDetected(decoded);
            });
        },
        () => {
          // ignore per-frame "not found" errors
        },
      )
      .then(() => {
        if (mounted) setStarting(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setStarting(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("permission")) {
          setError(
            "Camera permission denied. Enable camera access in your browser settings and try again.",
          );
        } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to start the camera. Try refreshing the page.");
        }
      });

    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .catch(() => {})
          .finally(() => {
            try {
              s.clear();
            } catch {
              // ignore
            }
          });
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md active:bg-white/30"
        aria-label="Close scanner"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Scanner viewport */}
      <div id={READER_ID} className="h-full w-full" />

      {/* Loading state */}
      {starting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Camera className="mb-3 h-10 w-10 animate-pulse" />
          <p className="text-sm">Starting camera…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-xs space-y-4 rounded-2xl bg-white p-5 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="text-sm text-slate-700">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!starting && !error && (
        <div className="pointer-events-none absolute bottom-12 left-0 right-0 px-4 text-center">
          <p className="inline-block rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            Point camera at a barcode
          </p>
        </div>
      )}
    </div>
  );
}
