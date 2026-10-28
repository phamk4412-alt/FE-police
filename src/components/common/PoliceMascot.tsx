import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const HIDDEN_KEY = "mascot-hidden";
const MASCOT_NAME = "Bé Còi";
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

const OUTLINE = "#3b2a22";
const SKIN = "#ffdcc0";
const SKIN_SHADE = "#f4bf9c";
const HAIR = "#231c22";
const UNIFORM = "#5d7f3f";
const UNIFORM_SHADE = "#4a6831";
const RED = "#d7263d";
const GOLD = "#f2c94c";

interface Look{
  x: number;
  y: number;
}

function shift(look: Look, x: number, y = 0) {
  return { transform: `translate(${(look.x * x).toFixed(2)}px, ${(look.y * y).toFixed(2)}px)` };
}

function MascotHead({ look, isBlinking = false }: { look: Look; isBlinking?: boolean }) {
  const faceClip = `mascot-face-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Parts nearer the viewer move further, so the head seems to turn toward the pointer.
  const turn = {
    transform: `translate(${(look.x * 3).toFixed(2)}px, ${(look.y * 2).toFixed(2)}px) rotate(${(look.x * 7).toFixed(2)}deg)`,
  };

  return (
    <g className="mascot-turn" style={turn}>
      <clipPath id={faceClip}>
        <ellipse cx="60" cy="72" rx="34" ry="31" />
      </clipPath>

      <g className="mascot-part" style={shift(look, -1.5)}>
        <path d="M24 74c-5-28 11-48 36-48s41 20 36 48c-2 8-6 13-10 15H34c-4-2-8-7-10-15z" fill={HAIR} stroke={OUTLINE} strokeWidth="2" />
      </g>

      <g className="mascot-part" style={shift(look, -2.5)}>
        <ellipse cx="26" cy="76" fill={SKIN} rx="6" ry="8" stroke={OUTLINE} strokeWidth="1.8" />
        <ellipse cx="94" cy="76" fill={SKIN} rx="6" ry="8" stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M25 72q3 4 0 8M95 72q-3 4 0 8" fill="none" stroke={SKIN_SHADE} strokeLinecap="round" strokeWidth="1.6" />
      </g>

      <ellipse cx="60" cy="72" fill={SKIN} rx="34" ry="31" stroke={OUTLINE} strokeWidth="2" />
      <path d="M29 82c5 12 17 19 31 19s26-7 31-19c-6 8-17 13-31 13s-25-5-31-13z" fill={SKIN_SHADE} opacity="0.7" />

      <g clipPath={`url(#${faceClip})`}>
        <g className="mascot-part" style={shift(look, 5, 3.5)}>
          <path d="M40 64q6-4 12-1M68 63q6-3 12 1" fill="none" stroke={HAIR} strokeLinecap="round" strokeWidth="2.4" />

          <g className={isBlinking ? "mascot-eyes is-blinking" : "mascot-eyes"}>
            <g className="mascot-part" style={shift(look, 1.5, 1.5)}>
              <ellipse cx="46" cy="75" fill="#2a1913" rx="6" ry="7.5" />
              <ellipse cx="74" cy="75" fill="#2a1913" rx="6" ry="7.5" />
              <ellipse cx="46" cy="77.5" fill="#6e4128" rx="4" ry="4.2" />
              <ellipse cx="74" cy="77.5" fill="#6e4128" rx="4" ry="4.2" />
              <circle cx="48.2" cy="72" fill="#ffffff" r="2.3" />
              <circle cx="76.2" cy="72" fill="#ffffff" r="2.3" />
              <circle cx="44.2" cy="78.6" fill="#ffffff" opacity="0.8" r="1" />
              <circle cx="72.2" cy="78.6" fill="#ffffff" opacity="0.8" r="1" />
            </g>
          </g>
          <g className="mascot-dizzy-eyes">
            <path d="M41 70l10 10M51 70l-10 10M69 70l10 10M79 70l-10 10" stroke="#2a1913" strokeLinecap="round" strokeWidth="3" />
          </g>

          <path d="M58.5 82.5q1.5 1.6 3 0" fill="none" stroke="#d99a7a" strokeLinecap="round" strokeWidth="1.6" />
          <ellipse cx="37" cy="86" fill="#ff8f8f" opacity="0.5" rx="6" ry="3.5" />
          <ellipse cx="83" cy="86" fill="#ff8f8f" opacity="0.5" rx="6" ry="3.5" />
          <path className="mascot-mouth" d="M54 88q6 6 12 0" fill="none" stroke="#7a3b2e" strokeLinecap="round" strokeWidth="2.4" />
          <g className="mascot-mouth-open">
            <path d="M53.5 87q6.5 10 13 0z" fill="#7a3b2e" stroke="#5c2a20" strokeLinejoin="round" strokeWidth="1.2" />
            <path d="M56.5 91.5q3.5-2.5 7 0q-3.5 2.5-7 0z" fill="#ff8f8f" />
          </g>
      </g>
      </g>

      <g className="mascot-part" style={shift(look, 3, 1.5)}>
        <path
          d="M27 54c-1 6 1 10 5 12 3-2 5-5 6-8 3 4 7 6 12 6 2-2 3-5 3-8 4 4 9 6 15 5 2-2 3-4 3-7 4 4 8 5 13 4 3-3 4-7 3-12z"
          fill={HAIR}
          stroke={OUTLINE}
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="M27 62c-1 6 0 10 2 13l3-1c-1-4-1-8 0-12zM93 62c1 6 0 10-2 13l-3-1c1-4 1-8 0-12z" fill={HAIR} />
        <path d="M37 57q5-2 9 0" fill="none" stroke="#51434e" strokeLinecap="round" strokeWidth="1.4" />
      </g>

      <g className="mascot-part" style={shift(look, 2.5, 1)}>
        <path d="M20 40c0-16 18-28 40-28s40 12 40 28c0 4-4 6-8 6H28c-4 0-8-2-8-6z" fill={UNIFORM} stroke={OUTLINE} strokeWidth="2" />
        <path d="M21 41c1 3 4 5 7 5h64c3 0 6-2 7-5-8 2-18 3-39 3s-31-1-39-3z" fill={UNIFORM_SHADE} />
        <path d="M33 24c7-5 15-7 25-7" fill="none" opacity="0.35" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
        <path d="M27 45h66v8H27z" fill={RED} stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M28 53c10 6 54 6 64 0l-1.5 5.5c-14 6-47 6-61 0z" fill="#2c3622" stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M36 56c10 2 38 2 48 0" fill="none" opacity="0.35" stroke="#9fb08a" strokeLinecap="round" strokeWidth="1.2" />
        <circle cx="60" cy="31" fill={GOLD} r="9" stroke={OUTLINE} strokeWidth="1.6" />
        <circle cx="60" cy="31" fill="none" r="6.4" stroke="#d9a62b" strokeWidth="1.2" />
        <path d="M60 25.2l1.7 3.7 4.1.4-3.1 2.7 1 4-3.7-2.1-3.7 2.1 1-4-3.1-2.7 4.1-.4z" fill={RED} />
      </g>
    </g>
  );
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

  // The head turns toward the mouse or finger.
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
        setLook({ x: (dx / distance) * strength, y: (dy / distance) * strength });
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

  // On phones: the head follows the tilt of the device, shaking makes the mascot dizzy.
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
        x: clamp(event.gamma / 30, -1, 1),
        y: clamp((event.beta - 45) / 30, -1, 1),
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
          <ellipse className="mascot-shadow" cx="60" cy="146" rx="32" ry="4" />

          <g className="mascot-figure">
            {/* Body */}
            <path d="M52 94h16v16H52z" fill={SKIN_SHADE} stroke={OUTLINE} strokeWidth="1.8" />
            <path d="M20 144c0-22 16-36 40-36s40 14 40 36c0 2-2 4-4 4H24c-2 0-4-2-4-4z" fill={UNIFORM} stroke={OUTLINE} strokeWidth="2" />
            <path d="M21 144c0-21 14-34 37-35-12 6-20 20-21 39H24c-2 0-3-2-3-4z" fill={UNIFORM_SHADE} />
            <path d="M24 128c4-6 10-10 16-12l2 5c-6 2-11 5-14 10zM96 128c-4-6-10-10-16-12l-2 5c6 2 11 5 14 10z" fill={UNIFORM_SHADE} stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.4" />
            <path d="M48 109l12 16 12-16" fill="#f1ead0" stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.6" />
            <path d="M47 109l-7 12 10 3zM73 109l7 12-10 3z" fill={RED} stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.4" />
            <path d="M40 132h10v8H40z" fill={UNIFORM_SHADE} stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.2" />
            <path d="M72 130h8v4c0 3-2 5-4 6-2-1-4-3-4-6z" fill={GOLD} stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.2" />
            <circle cx="60" cy="134" fill={GOLD} r="1.6" stroke={OUTLINE} strokeWidth="0.8" />
            <circle cx="60" cy="142" fill={GOLD} r="1.6" stroke={OUTLINE} strokeWidth="0.8" />

            {/* Right arm, waves */}
            <g className="mascot-arm">
              <path d="M92 128c8-5 12-13 13-24" fill="none" stroke={OUTLINE} strokeLinecap="round" strokeWidth="13" />
              <path d="M92 128c8-5 12-13 13-24" fill="none" stroke={UNIFORM} strokeLinecap="round" strokeWidth="9.5" />
              <circle cx="105" cy="100" fill={SKIN} r="6" stroke={OUTLINE} strokeWidth="1.8" />
            </g>

            <g className="mascot-head">
              <MascotHead isBlinking={isBlinking} look={look} />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}

function MascotFace() {
  return (
    <svg aria-hidden="true" viewBox="16 8 88 100">
      <MascotHead look={{ x: 0, y: 0 }} />
    </svg>
  );
}

export default PoliceMascot;
