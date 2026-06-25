interface Props {
  online: boolean;
}

export default function StatusBadge({ online }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${online ? 'text-emerald-600' : 'text-gray-400'}`}>
      <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
      {online ? 'En ligne' : 'Hors ligne'}
    </span>
  );
}
