import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BarChart2,
  Package,
  HardHat,
  AlertTriangle,
  X,
  RefreshCw,
  ChevronDown,
  Wallet,
  ShieldAlert,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import {
  fetchOverview,
  fetchBudgetOverview,
  fetchMaterialBreakdown,
  fetchContractorSummary,
  fetchMonthlySpending,
  fetchBudgetAlerts,
} from '../redux/slices/analyticsSlice';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ['#3B82F6', '#F97316', '#22C55E', '#EF4444', '#A855F7', '#EAB308', '#14B8A6', '#EC4899'];

const MATERIAL_LABELS = {
  cement: 'Cement', sand: 'Sand', steel: 'Steel', brick: 'Bricks',
  paint: 'Paint', wood: 'Wood', tiles: 'Tiles',
  electrical: 'Electrical', plumbing: 'Plumbing', custom: 'Custom',
};

const WORK_LABELS = {
  civil: 'Civil', electrical: 'Electrical', plumbing: 'Plumbing',
  carpentry: 'Carpentry', painting: 'Painting', tiling: 'Tiling',
  labour: 'Labour', custom: 'Custom',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n) => {
  if (!n) return '₹0';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
};

const tooltipStyle = (dark) => ({
  contentStyle: {
    backgroundColor: dark ? '#111827' : '#ffffff',
    border: `1px solid ${dark ? '#1f2937' : '#e5e7eb'}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: dark ? '#f9fafb' : '#111827',
  },
  labelStyle: { fontWeight: 700, marginBottom: 4 },
});

const RupeeTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${dark ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-900'}`}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmtRupee(p.value)}</p>
      ))}
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ h = 'h-48', cls = '' }) => (
  <div className={`${h} ${cls} rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse`} />
);

// ─── Section Shell ────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, action }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary-500" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Analytics = () => {
  const dispatch = useDispatch();
  const { overview, budgetData, materialData, contractorData, monthlyData, alerts, loading } =
    useSelector((state) => state.analytics);

  const isDark = document.documentElement.classList.contains('dark');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const loadAll = () => {
    dispatch(fetchOverview());
    dispatch(fetchBudgetOverview());
    dispatch(fetchMaterialBreakdown());
    dispatch(fetchContractorSummary());
    dispatch(fetchMonthlySpending(selectedYear));
    dispatch(fetchBudgetAlerts());
  };

  useEffect(() => { loadAll(); }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMonthlySpending(selectedYear));
  }, [dispatch, selectedYear]);

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.projectId?.toString()));

  // ── Stat Cards Config ──
  const statCards = overview
    ? [
        {
          label: 'Total Budget',
          value: fmtRupee(overview.totalBudget),
          icon: Wallet,
          color: 'text-primary-600 dark:text-primary-400',
          bg: 'bg-primary-50 dark:bg-primary-950/30',
        },
        {
          label: 'Total Spent',
          value: fmtRupee(overview.totalSpent),
          icon: TrendingUp,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
        },
        {
          label: 'Budget Utilization',
          value: `${overview.budgetUtilization}%`,
          icon: BarChart2,
          color: overview.budgetUtilization > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
          bg: overview.budgetUtilization > 80 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
        },
        {
          label: 'Material Spending',
          value: fmtRupee(overview.totalMaterialSpent),
          icon: Package,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
          label: 'Contractor Payments',
          value: fmtRupee(overview.totalContractorPaid),
          icon: HardHat,
          color: 'text-violet-600 dark:text-violet-400',
          bg: 'bg-violet-50 dark:bg-violet-950/30',
        },
        {
          label: 'Projects at Risk',
          value: overview.projectsAtRisk,
          icon: ShieldAlert,
          color: overview.projectsAtRisk > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
          bg: overview.projectsAtRisk > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Financial insights across all your projects
          </p>
        </div>
        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── Section 1: Overview Stats ── */}
      {loading.overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} h="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/70"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Section 2: Budget Alerts ── */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.projectId}
              className={`flex items-start justify-between gap-4 rounded-xl border px-5 py-4 ${
                alert.alertLevel === 'danger'
                  ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alert.alertLevel === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${alert.alertLevel === 'danger' ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    {alert.alertLevel === 'danger' ? '🔴 Budget Exceeded' : '⚠️ Budget Warning'} — {alert.projectName}
                  </p>
                  <p className={`text-xs mt-0.5 ${alert.alertLevel === 'danger' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {alert.percentageUsed}% of budget used · Spent {fmtRupee(alert.amountSpent)} of {fmtRupee(alert.totalBudget)} · Threshold: {alert.threshold}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissedAlerts((prev) => [...prev, alert.projectId?.toString()])}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Section 3: Budget Overview Chart ── */}
      <Section title="Budget Overview" icon={BarChart2}>
        {loading.budget ? (
          <Skeleton h="h-72" />
        ) : budgetData.length === 0 ? (
          <EmptyState label="No project budget data available." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} />
              <XAxis
                dataKey="projectName"
                tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtShort}
                tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<RupeeTooltip dark={isDark} />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={(v) => <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>{v}</span>}
              />
              <Bar dataKey="totalBudget" name="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="amountSpent" name="Spent" fill="#F97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" name="Remaining" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Section 4: Two-col — Material Pie + Contractor Bar ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Material Breakdown Pie */}
        <Section title="Material Spending Breakdown" icon={Package}>
          {loading.material ? (
            <Skeleton h="h-64" />
          ) : !materialData?.byType?.length ? (
            <EmptyState label="No material purchase data available." />
          ) : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={materialData.byType}
                    dataKey="totalAmount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={2}
                    label={false}
                  >
                    {materialData.byType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [fmtRupee(v), MATERIAL_LABELS[n] || n]}
                    contentStyle={tooltipStyle(isDark).contentStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {materialData.byType.map((item, i) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{MATERIAL_LABELS[item.type] || item.type}</span>
                      <span className="text-gray-400 dark:text-gray-500">({item.percentage}%)</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtShort(item.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Contractor Work Type Bar */}
        <Section title="Contractor Payments by Work Type" icon={HardHat}>
          {loading.contractor ? (
            <Skeleton h="h-64" />
          ) : !contractorData?.byWorkType?.length ? (
            <EmptyState label="No contractor payment data available." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={contractorData.byWorkType}
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1f2937' : '#f3f4f6'} />
                <XAxis
                  type="number"
                  tickFormatter={fmtShort}
                  tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="workType"
                  tickFormatter={(v) => WORK_LABELS[v] || v}
                  tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<RupeeTooltip dark={isDark} />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(v) => <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>{v}</span>}
                />
                <Bar dataKey="totalPaid" name="Paid" fill="#22C55E" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalPending" name="Pending" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Section 5: Monthly Spending Trend ── */}
      <Section
        title="Monthly Spending Trend"
        icon={TrendingUp}
        action={
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-1.5 pl-3 pr-8 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        }
      >
        {loading.monthly ? (
          <Skeleton h="h-72" />
        ) : monthlyData.every((m) => m.totalSpent === 0) ? (
          <EmptyState label={`No spending data for ${selectedYear}.`} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="gradMat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtShort}
                tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<RupeeTooltip dark={isDark} />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={(v) => <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>{v}</span>}
              />
              <Area type="monotone" dataKey="materialSpent" name="Materials" stroke="#3B82F6" strokeWidth={2} fill="url(#gradMat)" dot={false} />
              <Area type="monotone" dataKey="contractorPaid" name="Contractors" stroke="#F97316" strokeWidth={2} fill="url(#gradCon)" dot={false} />
              <Area type="monotone" dataKey="totalSpent" name="Total" stroke="#A855F7" strokeWidth={2.5} fill="url(#gradTot)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Section 6: Top Spends Tables ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Vendors */}
        <Section title="Top Material Vendors" icon={Package}>
          {loading.material ? (
            <Skeleton h="h-48" />
          ) : !materialData?.topVendors?.length ? (
            <EmptyState label="No vendor data — add vendor names when logging purchases." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">#</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Vendor</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Amount</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Entries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {materialData.topVendors.slice(0, 5).map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/20">
                      <td className="py-3 text-xs text-gray-400 dark:text-gray-600 font-mono">{i + 1}</td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">{v.vendorName}</td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmtRupee(v.totalAmount)}</td>
                      <td className="py-3 text-right text-gray-500 dark:text-gray-400">{v.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Top Contractors */}
        <Section title="Top Contractors" icon={HardHat}>
          {loading.contractor ? (
            <Skeleton h="h-48" />
          ) : !contractorData?.topContractors?.length ? (
            <EmptyState label="No contractor data available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">#</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Name</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Contract</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Paid</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {contractorData.topContractors.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/20">
                      <td className="py-3 text-xs text-gray-400 dark:text-gray-600 font-mono">{i + 1}</td>
                      <td className="py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{WORK_LABELS[c.workType] || c.workType}</p>
                      </td>
                      <td className="py-3 text-right text-gray-700 dark:text-gray-300">{fmtShort(c.contractAmount)}</td>
                      <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmtShort(c.amountPaid)}</td>
                      <td className="py-3 text-right font-semibold text-amber-600 dark:text-amber-400">{fmtShort(c.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <BarChart2 className="h-8 w-8 text-gray-200 dark:text-gray-700 mb-2" />
    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{label}</p>
  </div>
);

export default Analytics;
