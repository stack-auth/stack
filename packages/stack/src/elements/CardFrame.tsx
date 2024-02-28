import React from "react";

export default function CardFrame({ 
  children, 
  fullPage=true 
}: { 
  children: React.ReactNode, 
  fullPage?: boolean, 
}) {
  const inner = (
    <div className="stack-scope wl_container wl_mx-auto wl_max-w-md wl_font-sans">
      <div className={`wl_py-8 wl_px-4 wl_bg-transparent wl_rounded-xl sm:wl_px-10 sm:wl_bg-base-100 sm:wl_shadow-xl`}>
        {children}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="wl_min-h-screen wl_flex wl_items-center wl_justify-center">
        {inner}
      </div>
    );
  } else {
    return inner;
  }
}
