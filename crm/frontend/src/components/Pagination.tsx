interface Props {
  page: number;
  lastPage: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, lastPage, onPageChange }: Props) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-outline text-xs"
      >
        Précédent
      </button>
      <span className="text-sm text-gray-500">
        {page} / {lastPage}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= lastPage}
        className="btn-outline text-xs"
      >
        Suivant
      </button>
    </div>
  );
}
