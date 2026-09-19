import type { ArtworkTone } from "../types/blog";

interface ArtworkProps {
  tone: ArtworkTone;
  variant?: "hero" | "thumbnail" | "detail";
}

export function Artwork({ tone, variant = "thumbnail" }: ArtworkProps) {
  const className = `artwork artwork-${tone} artwork-${variant}`;

  if (tone === "mountain") {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 720 420" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mountainSky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#bcd5f3" />
              <stop offset="0.48" stopColor="#e9decd" />
              <stop offset="1" stopColor="#c3d5e4" />
            </linearGradient>
            <linearGradient id="mountainRock" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#58708e" />
              <stop offset="1" stopColor="#223854" />
            </linearGradient>
          </defs>
          <rect width="720" height="420" fill="url(#mountainSky)" />
          <ellipse cx="544" cy="80" rx="112" ry="24" fill="#fff" opacity=".34" />
          <path d="M0 258 110 188 177 232 273 167 382 236 474 185 720 265V420H0Z" fill="#9db2cf" opacity=".78" />
          <path d="M0 307 120 234 213 281 333 223 431 288 554 225 720 299V420H0Z" fill="#8199ba" opacity=".67" />
          <path d="M0 350 166 292 266 336 404 276 552 340 720 285V420H0Z" fill="#627b9d" opacity=".7" />
          <path d="M400 420 473 315 523 298 566 347 611 365 720 387V420Z" fill="url(#mountainRock)" />
          <path d="m497 332 22-63 17 2 8 61Z" fill="#203047" />
          <circle cx="527" cy="257" r="11" fill="#1c293d" />
          <path d="m516 272 9 46 17-1 3-43-7-12-15 1Z" fill="#173659" />
          <path d="m522 317-7 45M540 317l9 43" stroke="#17263a" strokeWidth="7" strokeLinecap="round" />
          <path d="m517 278-20 24M541 279l20 21" stroke="#263b55" strokeWidth="6" strokeLinecap="round" />
          <path d="M445 379c38-20 74-25 123-17" fill="none" stroke="#d8e5ef" strokeWidth="2" opacity=".6" />
        </svg>
        {variant === "hero" && <span className="artwork-caption">更好的自己，<br />一直在路上。</span>}
      </div>
    );
  }

  if (tone === "desk") {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
          <rect width="520" height="300" fill="#eee9df" />
          <rect y="206" width="520" height="94" fill="#c7ad8d" />
          <rect x="48" y="83" width="214" height="126" rx="8" fill="#394a5d" />
          <rect x="59" y="94" width="192" height="104" rx="4" fill="#d9e4ec" />
          <path d="M73 160h112M73 176h77" stroke="#98a9b7" strokeWidth="8" strokeLinecap="round" />
          <path d="M278 228h128" stroke="#6f503b" strokeWidth="7" strokeLinecap="round" opacity=".75" />
          <rect x="293" y="140" width="80" height="70" rx="7" fill="#faf7f1" />
          <path d="M373 157c28 0 28 37 0 38" fill="none" stroke="#faf7f1" strokeWidth="11" />
          <path d="M423 86c-28 26-36 71-32 119M418 121c25-4 39-17 45-39M411 146c-26-4-41-18-48-41" stroke="#5f8062" strokeWidth="8" strokeLinecap="round" fill="none" />
          <ellipse cx="419" cy="211" rx="44" ry="11" fill="#879087" opacity=".25" />
        </svg>
      </div>
    );
  }

  if (tone === "coast") {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
          <rect width="520" height="300" fill="#bfe2ff" />
          <path d="M0 147c97-15 183 19 263 4 86-16 154-4 257 20v129H0Z" fill="#4ba4d5" />
          <path d="M0 205c74-22 137-8 207 8 91 21 177 9 313-13v100H0Z" fill="#79c0df" />
          <path d="M0 240c133-21 212-7 318 16 73 16 137 8 202 1v43H0Z" fill="#d7bc83" />
          <path d="M0 212c56-24 86-64 130-72 52-9 76 36 116 48v112H0Z" fill="#5b9a73" />
          <path d="M206 220 520 253" stroke="#f1f0e7" strokeWidth="13" />
          <path d="M318 232v-56" stroke="#536778" strokeWidth="4" /><circle cx="318" cy="166" r="8" fill="#f39b62" />
          <path d="m309 178 10 25 15-26" fill="none" stroke="#394b60" strokeWidth="5" strokeLinecap="round" />
          <circle cx="170" cy="68" r="30" fill="#fff4bd" opacity=".78" />
        </svg>
      </div>
    );
  }

  if (tone === "code") {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
          <rect width="520" height="300" fill="#c6d1d2" />
          <rect x="66" y="42" width="388" height="215" rx="11" fill="#1f2e43" />
          <rect x="79" y="58" width="362" height="179" rx="4" fill="#111d2c" />
          <circle cx="95" cy="73" r="4" fill="#eb756d" /><circle cx="108" cy="73" r="4" fill="#efc15f" /><circle cx="121" cy="73" r="4" fill="#72bf7c" />
          <path d="M104 105h80M104 129h124M104 153h63M104 177h154M104 201h104" stroke="#6e92ae" strokeWidth="7" strokeLinecap="round" />
          <path d="M210 105h53M251 129h98M191 153h146M282 177h64M235 201h111" stroke="#90bd9b" strokeWidth="7" strokeLinecap="round" />
          <path d="M160 257h200" stroke="#667d84" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (tone === "forest") {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
          <rect width="520" height="300" fill="#dce7d7" />
          <circle cx="401" cy="74" r="45" fill="#f5e6b0" />
          <path d="M0 244 72 128l55 116M74 244l91-160 84 160M184 244l76-126 70 126M283 244l89-151 104 151M388 244l61-104 71 104" fill="#66846c" opacity=".78" />
          <path d="M0 246c115-27 205-18 298 0 79 15 151 7 222-5v59H0Z" fill="#8ea995" />
          <path d="M0 272c129-17 251-8 356 5 61 7 113 6 164 0v23H0Z" fill="#b2c4af" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice">
        <rect width="520" height="300" fill="#20304d" />
        <circle cx="395" cy="74" r="45" fill="#dbe6ff" opacity=".82" />
        <circle cx="116" cy="78" r="2" fill="#fff" /><circle cx="182" cy="49" r="2" fill="#fff" /><circle cx="278" cy="83" r="2" fill="#fff" /><circle cx="330" cy="42" r="2" fill="#fff" />
        <path d="M0 229 87 145l59 57 92-103 95 108 71-73 116 105v61H0Z" fill="#344a69" />
        <path d="M0 260c126-22 214-7 306 6 83 12 147 5 214-2v36H0Z" fill="#5a6d84" />
        <path d="M140 224c76-38 158-47 253-26" fill="none" stroke="#8ca4c0" strokeWidth="3" strokeDasharray="7 8" opacity=".75" />
      </svg>
    </div>
  );
}

export function AuthorAvatar() {
  return (
    <div className="author-avatar" aria-hidden="true">
      <svg viewBox="0 0 96 96">
        <defs>
          <linearGradient id="avatarBg" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#a4c9ef" />
            <stop offset="1" stopColor="#ead8c5" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="48" fill="url(#avatarBg)" />
        <path d="M0 72 24 55l17 11 21-23 34 29v24H0Z" fill="#6f8cab" opacity=".58" />
        <circle cx="53" cy="31" r="10" fill="#23354f" />
        <path d="M41 42c8-7 22-7 29 2l6 30H35Z" fill="#21324b" />
        <path d="m42 50 11 8 13-10 4 27H37Z" fill="#314966" />
      </svg>
    </div>
  );
}
