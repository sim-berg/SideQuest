export function getIconPath(id: number, darkMode: boolean): string {
  const variant = darkMode ? 'dark' : 'light';
  return `/icons/OUTLINE ICONS/ui_${variant} out_icon ${id}.png`;
}
