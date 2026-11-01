export default function EKGLine() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      className="w-full h-5 mt-1"
      style={{ opacity: 0.8 }}
    >
      <polyline
        points="0,10 30,10 35,10 38,4 42,16 46,10 80,10 85,10 88,2 92,18 96,10 130,10 135,10 138,6 142,14 146,10 200,10"
        fill="none"
        stroke="#3fb950"
        strokeWidth="1.5"
        className="ekg-path"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="200"
          to="0"
          dur="2s"
          repeatCount="indefinite"
        />
      </polyline>
      <style>{`
        .ekg-path {
          stroke-dasharray: 200;
        }
      `}</style>
    </svg>
  )
}
