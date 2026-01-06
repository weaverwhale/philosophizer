import { MultiSelect } from './ui/MultiSelect';

interface PhilosopherMultiSelectProps {
  philosophers: Array<{ id: string; name: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  openUpward?: boolean;
}

export function PhilosopherMultiSelect({
  philosophers,
  selected,
  onChange,
  openUpward = false,
}: PhilosopherMultiSelectProps) {
  return (
    <MultiSelect
      options={philosophers}
      selected={selected}
      onChange={onChange}
      placeholder="Philosophers"
      emptyText="All Philosophers"
      showSelectAll={true}
      openUpward={openUpward}
    />
  );
}
