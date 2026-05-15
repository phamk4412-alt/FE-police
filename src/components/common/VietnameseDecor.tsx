export type VietnameseDecorVariant =
  | "admin"
  | "auth"
  | "police"
  | "support-duty"
  | "support-news"
  | "user-home"
  | "user-map"
  | "user-news"
  | "user-news-detail";

type MotifName = "bamboo" | "cloud" | "crane" | "dongson" | "dragon" | "drum" | "lotus" | "rice" | "roof" | "waves";

interface Motif {
  name: MotifName;
  slot: "corner-a" | "corner-b" | "corner-c" | "field";
}

const motifsByVariant: Record<VietnameseDecorVariant, Motif[]> = {
  admin: [
    { name: "dongson", slot: "corner-a" },
    { name: "drum", slot: "corner-b" },
    { name: "cloud", slot: "field" },
  ],
  auth: [
    { name: "roof", slot: "corner-a" },
    { name: "cloud", slot: "corner-b" },
    { name: "waves", slot: "field" },
  ],
  police: [
    { name: "dragon", slot: "corner-a" },
    { name: "drum", slot: "corner-b" },
    { name: "dongson", slot: "field" },
  ],
  "support-duty": [
    { name: "bamboo", slot: "corner-a" },
    { name: "waves", slot: "corner-b" },
    { name: "dongson", slot: "field" },
  ],
  "support-news": [
    { name: "bamboo", slot: "corner-b" },
    { name: "cloud", slot: "corner-a" },
    { name: "lotus", slot: "field" },
  ],
  "user-home": [
    { name: "lotus", slot: "corner-a" },
    { name: "waves", slot: "corner-b" },
    { name: "cloud", slot: "field" },
  ],
  "user-map": [
    { name: "rice", slot: "corner-a" },
    { name: "waves", slot: "corner-b" },
    { name: "lotus", slot: "field" },
  ],
  "user-news": [
    { name: "crane", slot: "corner-a" },
    { name: "cloud", slot: "corner-b" },
    { name: "dongson", slot: "field" },
  ],
  "user-news-detail": [
    { name: "crane", slot: "corner-b" },
    { name: "lotus", slot: "corner-a" },
    { name: "waves", slot: "field" },
  ],
};

function MotifSvg({ name }: { name: MotifName }) {
  switch (name) {
    case "bamboo":
      return (
        <svg viewBox="0 0 180 220" fill="none" aria-hidden="true">
          <path d="M60 216V18M96 218V38M131 216V8" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <path d="M45 72h32M80 128h32M113 64h35M118 154h28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M62 55c-27-18-43-18-56-8 20 3 37 12 56 28M95 98c29-24 53-27 75-18-27 7-48 21-75 44M132 47c-24-18-46-22-66-15 23 8 41 21 66 41" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 260 150" fill="none" aria-hidden="true">
          <path d="M21 86h69c25 0 25-42 0-42-7 0-15 2-20 7C61 27 24 35 24 66c0 8 2 14 7 20M99 88h79c24 0 30-35 7-43-7-31-52-31-62-2-16-10-39 1-39 22 0 9 5 17 15 23ZM154 111h82" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M39 119h95M171 66h67" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "crane":
      return (
        <svg viewBox="0 0 220 210" fill="none" aria-hidden="true">
          <path d="M39 122c45-57 91-67 141-30-41-4-73 9-94 40 20-10 40-8 58 5-39 4-72 21-99 52" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M101 85c12-41 41-62 88-65-24 17-40 37-47 61M88 133c-2 30 8 50 31 62M107 137c19 15 42 20 70 15" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dongson":
      return (
        <svg viewBox="0 0 220 220" fill="none" aria-hidden="true">
          <circle cx="110" cy="110" r="86" stroke="currentColor" strokeWidth="7" />
          <circle cx="110" cy="110" r="50" stroke="currentColor" strokeWidth="5" />
          <path d="M110 31l12 55 42-37-25 51 55-9-49 29 49 29-55-9 25 51-42-37-12 55-12-55-42 37 25-51-55 9 49-29-49-29 55 9-25-51 42 37 12-55Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
          <path d="M54 110h112M110 54v112" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "dragon":
      return (
        <svg viewBox="0 0 300 220" fill="none" aria-hidden="true">
          <path d="M30 151c33-68 88-40 119-78 29-36 76-50 119-16-44-2-66 16-78 42 28-8 52-2 72 18-45-6-71 8-88 31-28 39-80 48-144 3Z" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M183 69l21-34 10 39 35-20-17 36M89 145c30 6 54-1 72-20M61 119c23-20 48-25 75-14" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M247 66l24-18M232 90l35 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "drum":
      return (
        <svg viewBox="0 0 210 210" fill="none" aria-hidden="true">
          <circle cx="105" cy="105" r="72" stroke="currentColor" strokeWidth="8" />
          <circle cx="105" cy="105" r="31" stroke="currentColor" strokeWidth="5" />
          <path d="M105 29v38M105 143v38M29 105h38M143 105h38M51 51l27 27M132 132l27 27M159 51l-27 27M78 132l-27 27" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M105 72l9 23h25l-20 15 8 24-22-15-22 15 8-24-20-15h25l9-23Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case "lotus":
      return (
        <svg viewBox="0 0 220 180" fill="none" aria-hidden="true">
          <path d="M110 153C92 117 94 81 110 31c16 50 18 86 0 122Z" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
          <path d="M106 153C70 132 53 99 51 54c38 22 60 52 55 99ZM114 153c36-21 53-54 55-99-38 22-60 52-55 99Z" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
          <path d="M94 150C54 150 25 130 12 93c41 2 70 21 82 57ZM126 150c40 0 69-20 82-57-41 2-70 21-82 57ZM44 164h132" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rice":
      return (
        <svg viewBox="0 0 240 180" fill="none" aria-hidden="true">
          <path d="M24 145c39-45 73-66 104-64 37 1 62 26 88 70" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <path d="M52 144c18-23 38-35 61-37M88 149c17-19 34-28 52-27M126 151c16-13 32-18 49-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 81c-9-30-1-52 23-67 9 34 1 56-23 67ZM142 87c14-25 34-37 61-36-17 28-37 40-61 36ZM95 92c-22-20-30-43-20-69 25 23 32 46 20 69" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );
    case "roof":
      return (
        <svg viewBox="0 0 260 160" fill="none" aria-hidden="true">
          <path d="M20 89c36-4 69-21 98-51 5-5 12-5 17 0 29 30 62 47 105 51-40 12-77 7-111-15-34 22-70 27-109 15Z" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
          <path d="M56 103h148M75 103v42M185 103v42M99 103v30M161 103v30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case "waves":
      return (
        <svg viewBox="0 0 280 120" fill="none" aria-hidden="true">
          <path d="M16 39c22-22 43-22 65 0s43 22 65 0 43-22 65 0 43 22 65 0M16 74c22-22 43-22 65 0s43 22 65 0 43-22 65 0 43 22 65 0" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
  }
}

function VietnameseDecor({ variant }: { variant: VietnameseDecorVariant }) {
  return (
    <div className={`vietnam-decor vietnam-decor-${variant}`} aria-hidden="true">
      {motifsByVariant[variant].map((motif, index) => (
        <span className={`vietnam-motif vietnam-motif-${motif.name} vietnam-motif-${motif.slot}`} key={`${motif.name}-${index}`}>
          <MotifSvg name={motif.name} />
        </span>
      ))}
    </div>
  );
}

export default VietnameseDecor;
