import { Button, Tooltip } from '@heroui/react';
import { MinusIcon, XIcon } from 'lucide-react';

export const WindowControls = () => {
  return (
    <>
      <Tooltip>
        <Tooltip.Trigger>
          <Button variant="ghost" isIconOnly className="min-w-12 rounded-none">
            <MinusIcon className="text-lg text-default-500" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>最小化</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>
          <Button variant="ghost" isIconOnly className="min-w-12 rounded-none">
            <XIcon className="text-lg text-default-500" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>关闭</Tooltip.Content>
      </Tooltip>
    </>
  );
};
