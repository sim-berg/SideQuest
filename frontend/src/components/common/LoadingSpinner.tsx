export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyber-border border-t-neon-cyan dark:border-cyber-border dark:border-t-neon-cyan" />
    </div>
  );
}
