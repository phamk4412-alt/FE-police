import { apiFetch } from "./api";

export interface ChatMessage {
  Id: string;
  Role: "user" | "assistant";
  Content: string;
  HasImage: boolean;
  CreatedAt: string;
}

export interface AssistantChatResult {
  Question: ChatMessage;
  Answer: ChatMessage;
  Model: string;
}

// A local model can take a while to answer, so allow more than the usual 30 s.
const CHAT_TIMEOUT_MS = 150000;

export function getChatMessages(limit = 50) {
  return apiFetch<ChatMessage[]>(`/api/assistant/messages?limit=${limit}`);
}

export async function sendChatMessage(message: string, imageBase64?: string) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    return await apiFetch<AssistantChatResult>("/api/assistant/chat", {
      body: JSON.stringify({ Message: message, ImageBase64: imageBase64 ?? null }),
      method: "POST",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export function clearChatMessages() {
  return apiFetch<{ deleted: number }>("/api/assistant/messages", { method: "DELETE" });
}

// Shrink photos before sending: phone pictures are often several MB.
export function imageFileToDataUrl(file: File, maxSide = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(url);

      if (!context) {
        reject(new Error("Không đọc được ảnh."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh này."));
    };

    image.src = url;
  });
}
