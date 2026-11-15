export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-card2 text-faint">
          <Icon size={26} strokeWidth={1.8} />
        </span>
      )}
      <h3 className="mt-4 text-[15px] font-bold tracking-tight">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[12.5px] leading-6 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
