
const StatsCard = ({ title, value, icon: Icon, trend, colorClass = 'primary' }) => {
  // Define color styles based on custom theme colors or defaults
  const colorMap = {
    primary: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 border-primary-100 dark:border-primary-900/50',
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50',
  };

  const selectedColor = colorMap[colorClass] || colorMap.primary;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-none">
      {/* Background ambient glow on hover */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary-500/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-primary-500/10" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 ${selectedColor}`}>
            <Icon className="h-6 w-6 stroke-[1.75]" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <span
            className={`inline-flex items-center font-semibold ${
              trend.type === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend.type === 'down'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {trend.type === 'up' && '↑'}
            {trend.type === 'down' && '↓'}
            {trend.value}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
