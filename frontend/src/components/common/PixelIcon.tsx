import { useUIStore } from '../../stores/useUIStore';
import { getIconPath } from '../../utils/icons';

interface PixelIconProps {
  id: number;
  size?: number;
  alt?: string;
  className?: string;
}

export default function PixelIcon({ id, size = 24, alt = '', className = '' }: PixelIconProps) {
  const darkMode = useUIStore((s) => s.darkMode);
  const src = getIconPath(id, darkMode);

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className || undefined}
      draggable={false}
    />
  );
}
