import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const HIDDEN_KEY = "mascot-hidden";
const MASCOT_NAME = "Bé Còi";
const EYE_RANGE = 3;
const SHAKE_THRESHOLD = 22;

type Mood = "idle" | "wave" | "jump" | "dizzy";

interface OrientationPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

function getTips(pathname: string, name?: string): string[] {
  const hello = name ? `Chào ${name}!` : "Xin chào!";

  if (pathname.startsWith("/login") || pathname.startsWith("/sign-up")) {
    return [
      `${hello} Mình là ${MASCOT_NAME}, trợ lý nhỏ của bạn.`,
      "Đăng nhập bằng Google cho nhanh, khỏi nhớ mật khẩu nhé.",
      "Chưa có tài khoản? Bấm Đăng ký, chỉ mất vài giây thôi.",
      "Chọc mình thêm lần nữa xem nào!",
    ];
  }

  if (pathname.startsWith("/user/news")) {
    return [
      "Tin mới và cảnh báo của khu vực đều ở đây.",
      "Bấm vào một bài để đọc chi tiết nhé.",
      "Thấy tin đáng ngờ? Báo cho cảnh sát ngay ở trang chủ.",
    ];
  }

  if (pathname.startsWith("/user")) {
    return [
      `${hello} Gặp sự việc gì cứ báo cho mình nhé.`,
      "Chọn loại sự việc, mô tả ngắn gọn rồi chụp ảnh hiện trường.",
      "Nhớ cập nhật vị trí để cảnh sát tìm đến bạn nhanh hơn.",
      "Khẩn cấp thì gọi 113 ngay, đừng chần chừ!",
      "Lắc điện thoại thử xem, mình sẽ chóng mặt đấy.",
    ];
  }

  if (pathname.startsWith("/police")) {
    return [
      `${hello} Chúc đồng chí một ca trực an toàn.`,
      "Các vụ việc được phân công nằm trong danh sách bên dưới.",
      "Xem bản đồ để biết vụ nào gần mình nhất.",
    ];
  }

  if (pathname.startsWith("/support")) {
    return [
      `${hello} Có báo cáo mới đang chờ xử lý đấy.`,
      "Chọn một báo cáo để xem ảnh và vị trí chi tiết.",
      "Đừng quên đăng tin cảnh báo cho người dân nhé.",
    ];
  }

  if (pathname.startsWith("/admin")) {
    return [
      `${hello} Mọi tài khoản đều nằm trong tay bạn.`,
      "Lọc theo vai trò để tìm tài khoản nhanh hơn.",
      "Khoá tài khoản đáng ngờ trước khi xoá nhé.",
    ];
  }

  return [`${hello} Mình là ${MASCOT_NAME}.`];
}

function readHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHidden(hidden: boolean) {
  try {
    if (hidden) {
      localStorage.setItem(HIDDEN_KEY, "1");
    } else {
      localStorage.removeItem(HIDDEN_KEY);
    }
  } catch {
    // Storage blocked: the choice just lasts for this visit.
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PoliceMascot() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.trim().split(/\s+/).pop() : undefined;
  const tips = useMemo(() => getTips(pathname, firstName), [pathname, firstName]);

  const [isHidden, setIsHidden] = useState(readHidden);
  const [tipIndex, setTipIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("wave");
  const [isBlinking, setIsBlinking] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const moodTimer = useRef<number | undefined>(undefined);
  const bubbleTimer = useRef<number | undefined>(undefined);
  const askedSensors = useRef(false);

  const say = useCallback((text: string, nextMood: Mood = "wave") => {
    setMessage(text);
    setMood(nextMood);
    window.clearTimeout(moodTimer.current);
    window.clearTimeout(bubbleTimer.current);
    moodTimer.current = window.setTimeout(() => setMood("idle"), 1400);
    bubbleTimer.current = window.setTimeout(() => setMessage(null), 7000);
  }, []);

  // Greet with the first tip whenever the page changes.
  useEffect(() => {
    if (isHidden) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTipIndex(1);
      say(tips[0]);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isHidden, say, tips]);

  useEffect(
    () => () => {
      window.clearTimeout(moodTimer.current);
      window.clearTimeout(bubbleTimer.current);
    },
    [],
  );

  // Blink every few seconds.
  useEffect(() => {
    if (isHidden) {
      return;
    }

    let closeTimer: number | undefined;
    const timer = window.setInterval(() => {
      setIsBlinking(true);
      closeTimer = window.setTimeout(() => setIsBlinking(false), 160);
    }, 3800);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(closeTimer);
    };
  }, [isHidden]);

  // Eyes follow the mouse or finger.
  useEffect(() => {
    if (isHidden) {
      return;
    }

    let frame = 0;
    function handlePointer(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = svgRef.current?.getBoundingClientRect();
        if (!box) {
          return;
        }

        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height * 0.45);
        const distance = Math.hypot(dx, dy) || 1;
        const strength = Math.min(1, distance / 160);
        setLook({ x: (dx / distance) * EYE_RANGE * strength, y: (dy / distance) * EYE_RANGE * strength });
      });
    }

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("pointerdown", handlePointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("pointerdown", handlePointer);
    };
  }, [isHidden]);

  // On phones: eyes follow the tilt of the device, shaking makes the mascot dizzy.
  useEffect(() => {
    if (isHidden) {
      return;
    }

    let lastShake = 0;
    function handleOrientation(event: DeviceOrientationEvent) {
      if (event.gamma === null || event.beta === null) {
        return;
      }

      setLook({
        x: clamp(event.gamma / 30, -1, 1) * EYE_RANGE,
        y: clamp((event.beta - 45) / 30, -1, 1) * EYE_RANGE,
      });
    }

    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) {
        return;
      }

      const force = Math.hypot(acc.x, acc.y, acc.z);
      const now = Date.now();
      if (force > SHAKE_THRESHOLD && now - lastShake > 2500) {
        lastShake = now;
        say("Ối ối, đừng lắc nữa, chóng mặt quá!", "dizzy");
      }
    }

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isHidden, say]);

  function askSensorPermission() {
    if (askedSensors.current) {
      return;
    }

    askedSensors.current = true;
    // iOS only delivers tilt and motion after the user allows it from a tap.
    const orientation = window.DeviceOrientationEvent as unknown as OrientationPermission | undefined;
    const motion = window.DeviceMotionEvent as unknown as OrientationPermission | undefined;
    orientation?.requestPermission?.().catch(() => undefined);
    motion?.requestPermission?.().catch(() => undefined);
  }

  function handlePoke() {
    askSensorPermission();
    setIsBlinking(true);
    window.setTimeout(() => setIsBlinking(false), 160);
    say(tips[tipIndex % tips.length], "jump");
    setTipIndex((index) => index + 1);
  }

  function handleHide() {
    writeHidden(true);
    setIsHidden(true);
    setMessage(null);
  }

  function handleShow() {
    writeHidden(false);
    setIsHidden(false);
  }

  if (isHidden) {
    return (
      <button aria-label={`Gọi ${MASCOT_NAME}`} className="mascot-restore" onClick={handleShow} type="button">
        <MascotFace />
      </button>
    );
  }

  return (
    <div className={`mascot is-${mood}`}>
      {message ? (
        <div className="mascot-bubble" role="status">
          <span className="mascot-bubble-name">{MASCOT_NAME}</span>
          <p>{message}</p>
        </div>
      ) : null}

      <button aria-label={`Ẩn ${MASCOT_NAME}`} className="mascot-close" onClick={handleHide} type="button">
        ×
      </button>

      <button aria-label={`Chọc ${MASCOT_NAME} để nghe mẹo`} className="mascot-body" onClick={handlePoke} type="button">
        <svg aria-hidden="true" className="mascot-svg" ref={svgRef} viewBox="0 0 120 150">
          <ellipse className="mascot-shadow" cx="60" cy="144" rx="30" ry="5" />

          <g className="mascot-figure">
            {/* Body */}
            <path d="M34 112c0-14 11-22 26-22s26 8 26 22v22a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" fill="#1f3366" />
            <path d="M47 91l13 15 13-15z" fill="#d6e6fb" />
            <path d="M57.5 96h5l1.5 4-4 12-4-12z" fill="#0d1a3d" />
            <path d="M47 91l-5 10 9 3zM73 91l5 10-9 3z" fill="#2a4380" />
            <path d="M36 99c4-4 9-6 14-6l-1 5c-5 0-9 1-13 3zM84 99c-4-4-9-6-14-6l1 5c5 0 9 1 13 3z" fill="#13224a" />
            <path d="M70 110h8v3.5c0 3-1.8 4.8-4 6-2.2-1.2-4-3-4-6z" fill="#f2c94c" />
            <rect fill="#0b1226" height="6" rx="2" width="52" x="34" y="124" />
            <rect fill="#c9d3e3" height="8" rx="2" width="10" x="55" y="123" />
            <circle cx="60" cy="116" fill="#c9d3e3" r="1.6" />
            <path d="M42 108h9v6h-9z" fill="#2a4380" />

            {/* Left arm */}
            <path d="M36 104c-8 6-10 16-6 24" fill="none" stroke="#1f3366" strokeLinecap="round" strokeWidth="9" />
            <circle cx="30" cy="129" fill="#ffd6b0" r="5" />

            {/* Right arm, waves */}
            <g className="mascot-arm">
              <path d="M84 104c8-4 13-12 14-22" fill="none" stroke="#1f3366" strokeLinecap="round" strokeWidth="9" />
              <circle cx="98" cy="79" fill="#ffd6b0" r="5.5" />
            </g>

            {/* Head */}
            <g className="mascot-head">
              <path d="M26 66c-3-22 12-38 34-38s37 16 34 38c-2-4-5-7-8-8H34c-3 1-6 4-8 8z" fill="#1a1a22" />
              <circle cx="60" cy="64" fill="#ffd6b0" r="32" />
              <ellipse cx="28" cy="66" fill="#ffc79b" rx="5" ry="7" />
              <ellipse cx="92" cy="66" fill="#ffc79b" rx="5" ry="7" />
              <path d="M29 52h62c1 5-1 9-3 11-2-3-5-4-8-4-3 2-7 3-11 2-4 2-9 2-13 0-4 2-8 2-12 0-3 1-6 2-9 1-3-2-5-6-6-10z" fill="#1a1a22" />
              <path d="M30 56c-2 5-2 10 0 14l3-1c-1-4-1-8 0-12zM90 56c2 5 2 10 0 14l-3-1c1-4 1-8 0-12z" fill="#1a1a22" />

              {/* Cap */}
              <path d="M17 38c0-14 19-25 43-25s43 11 43 25c0 4-4 6-9 6H26c-5 0-9-2-9-6z" fill="#1c2b5c" />
              <path d="M30 22c8-5 18-7 30-7" fill="none" opacity="0.35" stroke="#ffffff" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M26 43h68v10H26z" fill="#0d1633" />
              <path d="M26 46h68v1.6H26z" fill="#f2c94c" />
              <path d="M28 53c10 7 54 7 64 0l-1 6c-14 6-48 6-62 0z" fill="#0a1433" />
              <path d="M36 57c12 3 36 3 48 0" fill="none" opacity="0.45" stroke="#5f79b8" strokeLinecap="round" strokeWidth="1.4" />
              <path d="M60 25l9 3.5v6c0 5-4 8.5-9 10.5-5-2-9-5.5-9-10.5v-6z" fill="#f2c94c" />
              <path
                d="M60 29.5l1.5 3.3 3.6.3-2.7 2.4.8 3.5-3.2-1.9-3.2 1.9.8-3.5-2.7-2.4 3.6-.3z"
                fill="#1c2b5c"
              />

              {/* Eyes */}
              <g className={isBlinking ? "mascot-eyes is-blinking" : "mascot-eyes"}>
                <g transform={`translate(${look.x.toFixed(2)} ${look.y.toFixed(2)})`}>
                  <ellipse cx="47" cy="68" fill="#1d1d24" rx="5" ry="6" />
                  <ellipse cx="73" cy="68" fill="#1d1d24" rx="5" ry="6" />
                  <circle cx="48.8" cy="65.6" fill="#ffffff" r="1.8" />
                  <circle cx="74.8" cy="65.6" fill="#ffffff" r="1.8" />
                </g>
              </g>
              <g className="mascot-dizzy-eyes">
                <path d="M42 63l10 10M52 63l-10 10M68 63l10 10M78 63l-10 10" stroke="#1d1d24" strokeLinecap="round" strokeWidth="3" />
              </g>

              <ellipse cx="38" cy="78" fill="#ff8a8a" opacity="0.55" rx="6" ry="3.5" />
              <ellipse cx="82" cy="78" fill="#ff8a8a" opacity="0.55" rx="6" ry="3.5" />
              <path className="mascot-mouth" d="M53 81q7 7 14 0" fill="none" stroke="#7a3b2e" strokeLinecap="round" strokeWidth="2.6" />
              <ellipse className="mascot-mouth-open" cx="60" cy="83" fill="#7a3b2e" rx="5" ry="4" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}

function MascotFace() {
  return (
    <svg aria-hidden="true" viewBox="16 10 88 90">
      <path d="M26 66c-3-22 12-38 34-38s37 16 34 38c-2-4-5-7-8-8H34c-3 1-6 4-8 8z" fill="#1a1a22" />
      <circle cx="60" cy="64" fill="#ffd6b0" r="32" />
      <path d="M29 52h62c1 5-1 9-3 11-2-3-5-4-8-4-3 2-7 3-11 2-4 2-9 2-13 0-4 2-8 2-12 0-3 1-6 2-9 1-3-2-5-6-6-10z" fill="#1a1a22" />
      <path d="M17 38c0-14 19-25 43-25s43 11 43 25c0 4-4 6-9 6H26c-5 0-9-2-9-6z" fill="#1c2b5c" />
      <path d="M26 43h68v10H26z" fill="#0d1633" />
      <path d="M28 53c10 7 54 7 64 0l-1 6c-14 6-48 6-62 0z" fill="#0a1433" />
      <path d="M60 25l9 3.5v6c0 5-4 8.5-9 10.5-5-2-9-5.5-9-10.5v-6z" fill="#f2c94c" />
      <ellipse cx="47" cy="70" fill="#1d1d24" rx="5" ry="6" />
      <ellipse cx="73" cy="70" fill="#1d1d24" rx="5" ry="6" />
      <path d="M53 82q7 7 14 0" fill="none" stroke="#7a3b2e" strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}

export default PoliceMascot;
