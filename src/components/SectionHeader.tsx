interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
