export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatReward(amount: number): string {
  return `${amount} XP`;
}

export function formatTimeRemaining(isoDate: string): string {
  const target = new Date(isoDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Abgelaufen';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
