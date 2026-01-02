function HexNode({
  number = 1,
  size = 100,
  borderWidth = 6,
  borderColor = "#ffffff",
  fillColor = "#111111",
  textColor = "#FF8C32",
}) {
  const innerOffset = borderWidth * 1.5;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 1.1547, // hexagon aspect ratio
      }}
    >
      {/* OUTER (THE BORDER) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: borderColor,
          clipPath:
            "polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)",
        }}
      />

      {/* INNER (THE FILL) */}
      <div
        style={{
          position: "absolute",
          top: innerOffset,
          left: innerOffset,
          right: innerOffset,
          bottom: innerOffset,
          background: fillColor,
          clipPath:
            "polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)",
        }}
      />

      {/* NUMBER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: textColor,
          fontWeight: "700",
          fontSize: size * 0.35,
        }}
      >
        {number}
      </div>
    </div>
  );
}

export default HexNode;
