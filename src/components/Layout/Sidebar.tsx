import { Button } from '@heroui/react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ expanded, onToggle }: SidebarProps) => {
  return (
    <aside
      className={`flex flex-col h-full bg-default-50 border-r border-divider transition-all duration-300 ${
        expanded ? 'w-[200px]' : 'w-[60px]'
      }`}
    >
      <div className="flex-1 flex items-center justify-center">{/* 占位区 */}</div>
      <Button variant="ghost" isIconOnly className="m-2" onPress={onToggle}>
        {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>
    </aside>
  );
};
