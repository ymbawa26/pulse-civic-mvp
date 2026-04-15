export default function Loading() {
  return (
    <div className="page-shell py-16">
      <div className="grid gap-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-white/60" />
        <div className="h-48 animate-pulse rounded-[32px] bg-white/60" />
        <div className="h-48 animate-pulse rounded-[32px] bg-white/60" />
      </div>
    </div>
  );
}
