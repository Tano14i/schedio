import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512
};

export default function Icon() {
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
          fontSize: 144,
          fontWeight: 700,
          letterSpacing: "-0.06em"
        }}
      >
        Sc
      </div>
    ),
    size
  );
}
