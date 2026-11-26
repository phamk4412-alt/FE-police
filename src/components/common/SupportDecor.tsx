import "./supportDecor.css";

export default function SupportDecor() {
  return (
    <div className="vietnam-decor support-decor" aria-hidden="true">
      <svg className="support-drum" viewBox="0 0 480 480" fill="none" stroke="currentColor">
        {[225, 214, 203, 179, 168, 155, 114, 104, 94, 57, 12].map((radius) => <circle key={radius} cx="240" cy="240" r={radius} />)}
        {Array.from({ length: 36 }, (_, index) => (
          <path key={index} d="M221 36l19 23 19-23" transform={`rotate(${index * 10} 240 240)`} />
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <g key={index} transform={`rotate(${index * 30} 240 240)`}>
            <path d="M240 150l15 46h-30z M221 112q19-20 38 0l-12 7 12 8q-20-12-36 2l6-13z" />
            <circle cx="240" cy="73" r="3" />
          </g>
        ))}
      </svg>
      <div className="support-orbits" />
      <svg className="support-lotus" viewBox="0 0 320 150" fill="none" stroke="currentColor">
        <path d="M160 144q-33-58 0-132 33 74 0 132ZM160 144Q82 120 70 48q72 18 90 96Zm0 0q78-24 90-96-72 18-90 96ZM160 144Q79 147 37 91q73-1 123 53Zm0 0q81 3 123-53-73-1-123 53ZM4 145h68m176 0h68" />
      </svg>
    </div>
  );
}
