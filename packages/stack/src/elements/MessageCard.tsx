import React from "react";
import CardFrame from "./CardFrame";

export default function MessageCard(
  { children, title, fullPage=false }: 
  { children?: React.ReactNode, title: string, fullPage?: boolean}
) {
  return (
    <CardFrame fullPage={fullPage}>
      <div className='wl_text-center'>
        <h1 className="wl_text-2xl wl_mb-6">{title}</h1>
        {children}
      </div>
    </CardFrame>
  );
}
