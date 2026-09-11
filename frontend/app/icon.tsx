import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_JS_PATH } from "@/lib/logoPath";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: LOGO_BG,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <path d={LOGO_JS_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
