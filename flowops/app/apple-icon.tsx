import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0D2230 0%, #16384E 52%, #1F4D6B 100%)",
          color: "white",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: "-0.08em",
          borderRadius: 36
        }}
      >
        Sc
      </div>
    ),
    size
  );
}
