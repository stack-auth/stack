import { CirclePlus } from 'lucide-react';

type Props = {
  onClick: () => void,
};

export default function DividerButton({ onClick }: Props) {
  return (
    <button
      className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 p-1 rounded-full z-10 bg-white shadow"
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
    >
      <CirclePlus className="h-5 w-5" />
    </button>
  );
}
