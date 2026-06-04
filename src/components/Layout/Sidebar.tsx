import { Button } from '@heroui/react';
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { NavLink } from 'react-router';

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
      <nav className="flex-1 flex flex-col gap-1 p-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-primary-100 text-primary' : 'text-default-500 hover:bg-default-100'
            } ${expanded ? '' : 'justify-center px-0'}`
          }
        >
          <Search className="size-5 shrink-0" />
          {expanded && <span className="text-sm">基金查询</span>}
        </NavLink>
      </nav>
      <Button variant="ghost" isIconOnly className="m-2" onPress={onToggle}>
        {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>
    </aside>
  );
};
