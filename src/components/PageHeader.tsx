interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 lg:mb-10">
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm lg:text-base text-muted-foreground/80">{subtitle}</p>}
    </div>
  );
}
