export default function CardHeader(
  { children, title }: 
  { children?: React.ReactNode, title: string }
) {
  return (
    <div className="wl_text-center wl_mb-6 wl_space-y-2 md:wl_space-y-3">
      <h2 className="wl_text-2xl">{title}</h2>
      {children}
    </div>
  );
}