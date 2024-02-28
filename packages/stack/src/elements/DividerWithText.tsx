export default function DividerWithText({ text }: { text: string }) {
  const lineStyle = "wl_flex-grow wl_bg-neutral wl_h-px";
  return (
    <div className="wl_flex wl_items-center wl_my-4">
      <div className={lineStyle}></div>
      <span className="wl_px-4 wl_text-sm wl_text-neutral">{text}</span>
      <div className={lineStyle}></div>
    </div>
  );
}
