import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Loader2,
  Check,
  Sparkles,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import type { CustomFood, FoodLog } from "@/lib/types";
import { addFoodLog, fetchCustomFoods } from "@/lib/db";

interface Props {
  initialMealType: FoodLog["meal_type"];
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

interface AttachedImage {
  data: string; // base64, no data: prefix
  mediaType: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: AttachedImage;
}

interface AIItem {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface AIResponse {
  message: string;
  items: AIItem[];
  needs_clarification: boolean;
  clarification_question: string | null;
}

const MEAL_LABELS: Record<FoodLog["meal_type"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const MEAL_KEYS: FoodLog["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

/**
 * Resize the image to fit within maxDim on the longest side and re-encode as
 * JPEG. Phone photos are typically 4-8 MB; this brings them down to ~100-300 KB
 * which keeps API requests fast and well under Claude's 5MB image limit.
 */
async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.85,
): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Could not create canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(url);
        const data = dataUrl.split(",")[1];
        resolve({ data, mediaType: "image/jpeg" });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };
    img.src = url;
  });
}

export default function ChatFoodModal({
  initialMealType,
  date,
  onAdded,
  onClose,
}: Props) {
  const [mealType, setMealType] = useState<FoodLog["meal_type"]>(initialMealType);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<AttachedImage | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<AIItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileCameraRef = useRef<HTMLInputElement>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchCustomFoods()
      .then(setCustomFoods)
      .catch(() => setCustomFoods([]));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingItems]);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProcessingImage(true);
    try {
      const img = await compressImage(file);
      setAttached(img);
    } catch (e) {
      setError(`Couldn't read image: ${(e as Error).message}`);
    } finally {
      setProcessingImage(false);
    }
  }

  function buildApiPayload(history: ChatMessage[]) {
    return history.map((m) => {
      if (m.role === "assistant" || !m.image) {
        return { role: m.role, content: m.content };
      }
      return {
        role: m.role,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: m.image.mediaType,
              data: m.image.data,
            },
          },
          {
            type: "text" as const,
            text: m.content || "Identify the food in this photo and log it.",
          },
        ],
      };
    });
  }

  async function send() {
    const text = input.trim();
    if ((!text && !attached) || loading) return;

    const newMessage: ChatMessage = {
      role: "user",
      content: text,
      image: attached || undefined,
    };
    const next = [...messages, newMessage];
    setMessages(next);
    setInput("");
    setAttached(null);
    setLoading(true);
    setError(null);
    setPendingItems([]);

    try {
      const res = await fetch("/api/chat-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: buildApiPayload(next),
          customFoods: customFoods.map((cf) => ({
            name: cf.name,
            calories_per_100g: cf.calories_per_100g,
            protein_per_100g: cf.protein_per_100g,
            carbs_per_100g: cf.carbs_per_100g,
            fat_per_100g: cf.fat_per_100g,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AIResponse;
      setMessages([
        ...next,
        { role: "assistant", content: data.message || "(no response)" },
      ]);
      if (!data.needs_clarification && data.items.length > 0) {
        setPendingItems(data.items);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Sorry, I ran into an error: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmLog() {
    if (pendingItems.length === 0) return;
    setLogging(true);
    try {
      for (const item of pendingItems) {
        await addFoodLog({
          date,
          meal_type: mealType,
          food_name: item.food_name,
          quantity: item.quantity,
          unit: item.unit || "g",
          calories: Math.round(item.calories * 10) / 10,
          protein_g: Math.round(item.protein_g * 100) / 100,
          carbs_g: Math.round(item.carbs_g * 100) / 100,
          fat_g: Math.round(item.fat_g * 100) / 100,
        });
      }
      onAdded();
      onClose();
    } catch (e) {
      setError(`Failed to log: ${(e as Error).message}`);
      setLogging(false);
    }
  }

  const totals = pendingItems.reduce(
    (a, i) => ({
      cals: a.cals + i.calories,
      p: a.p + i.protein_g,
      c: a.c + i.carbs_g,
      f: a.f + i.fat_g,
    }),
    { cals: 0, p: 0, c: 0, f: 0 },
  );

  const canSend = (!!input.trim() || !!attached) && !loading && !processingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <div>
              <h2 className="text-base font-semibold">AI Quick Log</h2>
              <p className="text-xs text-slate-500">
                Adding to{" "}
                <select
                  value={mealType}
                  onChange={(e) =>
                    setMealType(e.target.value as FoodLog["meal_type"])
                  }
                  className="font-medium text-brand-700 underline-offset-2 hover:underline"
                >
                  {MEAL_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {MEAL_LABELS[k]}
                    </option>
                  ))}
                </select>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              <p className="mb-2">👋 Tell me what you ate — or take a photo!</p>
              <p className="text-xs leading-relaxed">
                Try things like:
                <br />
                <span className="italic">
                  "200g chicken breast, 2 rotis, 1 small bowl dal"
                </span>
                <br />
                <span className="italic">
                  📷 Photo of your plate
                </span>
                <br />
                <span className="italic">
                  Photo + "the rice bowl is the small one"
                </span>
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] overflow-hidden rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.image && (
                  <img
                    src={`data:${m.image.mediaType};base64,${m.image.data}`}
                    alt="Uploaded food"
                    className="max-h-56 w-full object-cover"
                  />
                )}
                {m.content && (
                  <div className="whitespace-pre-wrap px-3 py-2">
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                thinking…
              </div>
            </div>
          )}

          {pendingItems.length > 0 && (
            <div className="space-y-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Ready to log to {MEAL_LABELS[mealType]}
              </div>
              <ul className="space-y-1 text-sm">
                {pendingItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="min-w-0 text-slate-800">
                      <span className="break-words">{item.food_name}</span>{" "}
                      <span className="text-slate-500">
                        ({item.quantity}
                        {item.unit})
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-600">
                      {Math.round(item.calories)} kcal
                    </span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-4 gap-1.5 border-t border-emerald-200 pt-2 text-center text-xs">
                <div>
                  <div className="font-bold tabular-nums text-slate-900">
                    {Math.round(totals.cals)}
                  </div>
                  <div className="text-slate-500">kcal</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-emerald-700">
                    {Math.round(totals.p)}g
                  </div>
                  <div className="text-slate-500">protein</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-amber-700">
                    {Math.round(totals.c)}g
                  </div>
                  <div className="text-slate-500">carbs</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-violet-700">
                    {Math.round(totals.f)}g
                  </div>
                  <div className="text-slate-500">fat</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div ref={endRef} />
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-slate-200 px-4 py-3">
          {pendingItems.length > 0 && (
            <button
              type="button"
              onClick={confirmLog}
              disabled={logging}
              className="btn-primary w-full"
            >
              {logging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Log all {pendingItems.length} item
              {pendingItems.length > 1 ? "s" : ""} to{" "}
              {MEAL_LABELS[mealType]}
            </button>
          )}

          {/* Attached image preview */}
          {attached && (
            <div className="relative inline-block">
              <img
                src={`data:${attached.mediaType};base64,${attached.data}`}
                alt="Selected"
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={() => setAttached(null)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={fileGalleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {/* Input row */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileCameraRef.current?.click()}
              disabled={processingImage || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50"
              aria-label="Take photo"
              title="Take photo"
            >
              {processingImage ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => fileGalleryRef.current?.click()}
              disabled={processingImage || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50"
              aria-label="Choose from gallery"
              title="Choose from gallery"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                attached ? "Add notes (optional)…" : "What did you eat?"
              }
              disabled={loading}
              className="input flex-1 text-base"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="btn-primary px-4"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
