interface Props {
  title: string;
  subtitle: string;
}

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-5">
      <h2 className="text-[22px] font-bold text-white tracking-tight">{title}</h2>
      <p className="mt-1 text-[13px] text-slate-400">{subtitle}</p>
    </div>
  );
}
