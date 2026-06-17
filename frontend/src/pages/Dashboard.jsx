import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import {
  Briefcase,
  TrendingUp,
  CreditCard,
  Users,
  Plus,
  FolderPlus,
  PackagePlus,
  UserPlus,
  Receipt,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  FolderClosed,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import projectService from '../services/projectService';
import AddEditProject from '../components/AddEditProject';

// Helper to format currency in Indian format
const formatRupee = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper to format relative time
const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Helper to render activity styles
const getActivityIconDetails = (module) => {
  switch (module) {
    case 'project':
      return {
        icon: Briefcase,
        bg: 'bg-blue-50 dark:bg-blue-950/45',
        text: 'text-blue-600 dark:text-blue-400',
      };
    case 'bill':
      return {
        icon: Receipt,
        bg: 'bg-emerald-50 dark:bg-emerald-950/45',
        text: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'contractor':
      return {
        icon: Users,
        bg: 'bg-indigo-50 dark:bg-indigo-950/45',
        text: 'text-indigo-600 dark:text-indigo-400',
      };
    case 'material':
      return {
        icon: PackagePlus,
        bg: 'bg-amber-50 dark:bg-amber-950/45',
        text: 'text-amber-600 dark:text-amber-400',
      };
    default:
      return {
        icon: Activity,
        bg: 'bg-primary-50 dark:bg-primary-950/45',
        text: 'text-primary-600 dark:text-primary-400',
      };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Data States
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // Fetch Dashboard details from real API
  const loadDashboardData = async () => {
    try {
      const statsRes = await projectService.getDashboardStats();
      const overviewRes = await projectService.getDashboardBudgetOverview();
      const activityRes = await projectService.getDashboardRecentActivity();

      setStats(statsRes.data);
      setChartData(overviewRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick Action triggers
  const handleQuickAction = (actionName) => {
    if (actionName === 'Add Project') {
      setShowAddProjectModal(true);
    } else {
      toast.success(`Action "${actionName}" triggered!`, {
        description: 'Integration modules coming in subsequent releases.',
        icon: '⚙️',
      });
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-14 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
        <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-850" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-gray-200 lg:col-span-2 dark:bg-gray-800" />
          <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  // Spent Percentage calculations
  const spentPercent =
    stats?.totalBudget > 0
      ? parseFloat(((stats.totalSpent / stats.totalBudget) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Builder'}!`}
        subtitle={`Here is the financial overview of your construction projects for ${formattedDate}`}
        action={
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            New Project
          </button>
        }
      />

      {/* Grid: 4 Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          icon={Briefcase}
          trend={{ value: 'Real-time', type: 'up', label: 'active tracking' }}
          colorClass="primary"
        />
        <StatsCard
          title="Total Budget"
          value={formatRupee(stats?.totalBudget || 0)}
          icon={TrendingUp}
          trend={{ value: 'Capitalized', type: 'neutral', label: 'aggregate budget' }}
          colorClass="green"
        />
        <StatsCard
          title="Total Spent"
          value={formatRupee(stats?.totalSpent || 0)}
          icon={CreditCard}
          trend={{ value: `${spentPercent}%`, type: 'neutral', label: 'used budget' }}
          colorClass="amber"
        />
        <StatsCard
          title="Active Contractors"
          value={stats?.activeContractors || 6}
          icon={Users}
          trend={{ value: 'Directory', type: 'up', label: 'active records' }}
          colorClass="rose"
        />
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            onClick={() => handleQuickAction('Add Project')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center text-gray-700 hover:border-primary-100 hover:bg-primary-50/20 dark:border-gray-800 dark:text-gray-300 dark:hover:border-primary-900/30 dark:hover:bg-primary-950/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/45 dark:text-primary-400 group-hover:scale-110 transition-transform">
              <FolderPlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Add Project</span>
          </button>

          <button
            onClick={() => handleQuickAction('Add Material')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center text-gray-700 hover:border-amber-100 hover:bg-amber-50/20 dark:border-gray-800 dark:text-gray-300 dark:hover:border-amber-900/30 dark:hover:bg-amber-950/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <PackagePlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Add Material</span>
          </button>

          <button
            onClick={() => handleQuickAction('Add Contractor')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center text-gray-700 hover:border-rose-100 hover:bg-rose-50/20 dark:border-gray-800 dark:text-gray-300 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Add Contractor</span>
          </button>

          <button
            onClick={() => handleQuickAction('Upload Bill')}
            className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center text-gray-700 hover:border-emerald-100 hover:bg-emerald-50/20 dark:border-gray-800 dark:text-gray-300 dark:hover:border-emerald-900/30 dark:hover:bg-emerald-950/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Upload Bill</span>
          </button>
        </div>
      </div>

      {/* Grid: Charts + Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Column */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-950 dark:text-white">
                Budget Allocation vs Spent
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Detailed cost comparison per project
              </p>
            </div>
            {chartData.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-400">
                <ArrowUpRight className="h-3 w-3" /> Live
              </span>
            )}
          </div>

          <div className="h-80 w-full flex-1 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-center py-10">
                <FolderClosed className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No chart data available</p>
                <p className="text-xs text-gray-400 mt-1">Add a project to see the financial visualization</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#f1f5f9'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 100000}L`}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)' }}
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [formatRupee(value), '']}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: '12px',
                      paddingBottom: '20px',
                    }}
                  />
                  <Bar
                    dataKey="Budget"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="Spent"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity Column */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Financial and updates audit
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[340px] custom-scrollbar">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <Activity className="h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs font-semibold text-gray-650 dark:text-gray-400">No activities logged yet</p>
              </div>
            ) : (
              activities.map((activity) => {
                const { icon: Icon, bg, text } = getActivityIconDetails(activity.module);
                return (
                  <div key={activity._id} className="flex gap-3 text-sm">
                    {/* Activity Icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white capitalize truncate">
                          {activity.action} {activity.module}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap mt-0.5">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <AddEditProject
          isOpen={showAddProjectModal}
          onClose={() => {
            setShowAddProjectModal(false);
            // Refresh dashboard data on close
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
