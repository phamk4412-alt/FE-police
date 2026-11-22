import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  clearChatMessages,
  getChatMessages,
  imageFileToDataUrl,
  sendChatMessage,
  type ChatMessage,
} from "../../services/assistantService";

interface MascotChatProps {
  name: string;
  onAnswer: () => void;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Mình bị lừa chuyển khoản, phải làm gì?",
  "Cách báo cáo sự việc trong app?",
  "Gặp tai nạn giao thông nên làm gì trước?",
];

function MascotChat({ name, onAnswer, onClose }: MascotChatProps) {
  const { isSignedIn, user } = useAuth();
  const { pathname } = useLocation();
  const isOnAuthPage = pathname.startsWith("/login") || pathname.startsWith("/sign-up");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pendingSeq = useRef(0);

  const canChat = isSignedIn && Boolean(user);

  useEffect(() => {
    if (!canChat) {
      return;
    }

    let active = true;
    getChatMessages()
      .then((items) => {
        if (active) {
          setMessages(items);
        }
      })
      .catch(() => {
        if (active) {
          setError("Chưa tải được tin nhắn cũ.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canChat]);

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function send(text: string) {
    const message = text.trim();
    if ((!message && !image) || isSending) {
      return;
    }

    pendingSeq.current += 1;
    const pending: ChatMessage = {
      Content: message || "Bạn xem giúp mình ảnh này với.",
      CreatedAt: "",
      HasImage: Boolean(image),
      Id: `pending-${pendingSeq.current}`,
      Role: "user",
    };

    setMessages((items) => [...items, pending]);
    setDraft("");
    setError(null);
    setIsSending(true);
    const sentImage = image;
    setImage(null);

    try {
      const result = await sendChatMessage(message, sentImage ?? undefined);
      setMessages((items) => [...items.filter((item) => item.Id !== pending.Id), result.Question, result.Answer]);
      onAnswer();
    } catch (sendError) {
      setMessages((items) => items.filter((item) => item.Id !== pending.Id));
      setDraft(message);
      setImage(sentImage);
      setError(sendError instanceof Error ? sendError.message : "Không gửi được, thử lại nhé.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  async function handlePickImage(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setImage(await imageFileToDataUrl(file));
      setError(null);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Không đọc được ảnh.");
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  async function handleClear() {
    if (isSending || messages.length === 0) {
      return;
    }

    try {
      await clearChatMessages();
      setMessages([]);
      setError(null);
    } catch {
      setError("Chưa xoá được, thử lại sau nhé.");
    }
  }

  return (
    <section aria-label={`Chat với ${name}`} className="mascot-chat" role="dialog">
      <header className="mascot-chat-head">
        <div>
          <strong>{name}</strong>
          <span>Trợ lý AI · trả lời có thể chưa chính xác</span>
        </div>
        {canChat && messages.length > 0 ? (
          <button className="mascot-chat-tool" disabled={isSending} onClick={handleClear} type="button">
            Xoá
          </button>
        ) : null}
        <button aria-label="Đóng chat" className="mascot-chat-tool is-close" onClick={onClose} type="button">
          ×
        </button>
      </header>

      {canChat ? (
        <>
          <div aria-live="polite" className="mascot-chat-list" ref={listRef}>
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="mascot-chat-empty">
                <p>Chào {user?.name.trim().split(/\s+/).pop()}, bạn cần mình giúp gì?</p>
                <div className="mascot-chat-suggestions">
                  {SUGGESTIONS.map((item) => (
                    <button disabled={isSending} key={item} onClick={() => void send(item)} type="button">
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isLoadingHistory && messages.length === 0 ? <p className="mascot-chat-note">Đang tải tin nhắn…</p> : null}

            {messages.map((item) => (
              <div className={`mascot-chat-msg is-${item.Role}`} key={item.Id}>
                {item.HasImage ? <span className="mascot-chat-tag">Ảnh đính kèm</span> : null}
                <p>{item.Content}</p>
              </div>
            ))}

            {isSending ? (
              <div className="mascot-chat-msg is-assistant is-typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mascot-chat-error" role="alert">
              {error}
            </p>
          ) : null}

          {image ? (
            <div className="mascot-chat-preview">
              <img alt="Ảnh sắp gửi" src={image} />
              <button aria-label="Bỏ ảnh" onClick={() => setImage(null)} type="button">
                ×
              </button>
            </div>
          ) : null}

          <form className="mascot-chat-form" onSubmit={handleSubmit}>
            <input
              accept="image/*"
              hidden
              onChange={(event) => void handlePickImage(event.target.files?.[0])}
              ref={fileRef}
              type="file"
            />
            <button
              aria-label="Gửi kèm ảnh"
              className="mascot-chat-attach"
              disabled={isSending}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 7h3l2-2h6l2 2h3v12H4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
                <circle cx="12" cy="13" fill="none" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <textarea
              aria-label="Nhập câu hỏi"
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi Bé Còi…"
              ref={inputRef}
              rows={1}
              value={draft}
            />
            <button className="mascot-chat-send" disabled={isSending || (!draft.trim() && !image)} type="submit">
              Gửi
            </button>
          </form>
        </>
      ) : (
        <div className="mascot-chat-empty is-guest">
          <p>Đăng nhập để chat với {name} và lưu lại cuộc trò chuyện nhé.</p>
          {isOnAuthPage ? null : (
            <Link className="mascot-chat-send" onClick={onClose} to="/login">
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default MascotChat;
