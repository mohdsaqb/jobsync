import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_JS_PATH } from "@/lib/logoPath";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: LOGO_BG,
        }}
      >
        <svg width="180" height="180" viewBox="0 0 40 40" fill="none">
          <path d={LOGO_JS_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
