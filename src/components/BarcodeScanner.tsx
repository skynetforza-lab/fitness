import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertCircle, Keyboard, Check } from "lucide-react";

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const READER_ID = "barcode-reader-container";

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  // Use a ref to ignore detections after the first one (single-shot)
  const detectedRef = useRef(false);

  useEffect(() => {
    if (manualMode) return; // skip camera start in manual mode

    let mounted = true;
    // Enable 1D + 2D formats explicitly — needed for packaged-food barcodes.
    // useBarCodeDetectorIfSupported uses the native browser API (much faster).
    const scanner = new Html5Qrcode(READER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    });
    scannerRef.current = scanner;

    // iPhones with multiple rear lenses often have facingMode:"environment"
    // resolve to the ultra-wide lens, which can't focus closely enough to
    // resolve a food barcode's bar widths (QR still works since it tolerates
    // blur via error correction). Prefer the plain "Back Camera" by label.
    async function pickCameraId(): Promise<string | MediaTrackConstraints> {
      try {
        const cameras = await Html5Qrcode.getCameras();
        const back =
          cameras.find((c) => /back camera$/i.test(c.label.trim())) ??
          cameras.find(
            (c) =>
              /back/i.test(c.label) &&
              !/ultra|wide angle|triple|dual|tele/i.test(c.label),
          );
        if (back) return back.id;
      } catch {
        // getCameras() can fail before permission is granted; fall back below.
      }
      return { facingMode: "environment" };
    }

    pickCameraId().then((cameraIdOrConfig) => {
      if (!mounted) return;
      scanner
        .start(
          cameraIdOrConfig,
          {
            fps: 15,
            // Larger scan area improves detection for various barcode sizes
            qrbox: (vw, vh) => {
              const minDim = Math.min(vw, vh);
              return {
                width: Math.floor(minDim * 0.85),
                height: Math.floor(minDim * 0.5),
              };
            },
            aspectRatio: window.innerWidth / window.innerHeight,
          },
          (decoded) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            // Briefly show success before closing camera, so the user
            // sees the barcode value was captured.
            if (mounted) setDetectedCode(decoded);
            setTimeout(() => {
              scanner
                .stop()
                .catch(() => {})
                .finally(() => {
                  if (mounted) onDetected(decoded);
                });
            }, 350);
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
          const lower = msg.toLowerCase();
          if (lower.includes("permission") || lower.includes("denied")) {
            setError(
              "Camera permission denied. On iPhone: Settings → Safari → Camera → Allow.",
            );
          } else if (
            lower.includes("notfound") ||
            lower.includes("no camera")
          ) {
            setError("No camera found on this device.");
          } else {
            setError(`Could not start camera. ${msg}`);
          }
        });
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
  }, [onDetected, manualMode]);

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (!/^\d{8,13}$/.test(code)) {
      setError("Barcode must be 8–13 digits.");
      return;
    }
    setError(null);
    setDetectedCode(code);
    setTimeout(() => onDetected(code), 200);
  }

  // ============================================================
  // Manual entry mode
  // ============================================================
  if (manualMode) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Enter barcode</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Type the 8–13 digit number printed below the barcode lines.
          </p>

          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            autoFocus
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 8901234567890"
            className="input text-center text-base tracking-wider"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setManualMode(false);
                setError(null);
                detectedRef.current = false;
              }}
              className="btn-secondary flex-1"
            >
              <Camera className="h-4 w-4" />
              Use camera
            </button>
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={manualCode.length < 8}
              className="btn-primary flex-1"
            >
              <Check className="h-4 w-4" />
              Lookup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Camera mode
  // ============================================================
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

      {/* Manual entry shortcut */}
      <button
        type="button"
        onClick={() => {
          // Stop scanner before switching to manual mode
          scannerRef.current?.stop().catch(() => {});
          setManualMode(true);
        }}
        className="absolute left-4 top-4 z-10 flex h-11 items-center gap-1.5 rounded-full bg-white/20 px-4 text-sm font-medium text-white backdrop-blur-md active:bg-white/30"
      >
        <Keyboard className="h-4 w-4" />
        Type code
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setManualMode(true);
                }}
                className="btn-secondary flex-1"
              >
                Type code
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detected success flash */}
      {detectedCode && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-500/30">
          <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-2xl">
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-1 text-xs text-slate-500">Detected</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
              {detectedCode}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!starting && !error && !detectedCode && (
        <div className="pointer-events-none absolute bottom-12 left-0 right-0 px-4 text-center">
          <p className="inline-block rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            Hold steady · point at the barcode
          </p>
        </div>
      )}
    </div>
  );
}
