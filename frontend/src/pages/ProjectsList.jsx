import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MapPin, Calendar, IndianRupee, ArrowRight, FolderClosed } from 'lucide-react';
import { fetchProjects } from '../redux/slices/projectSlice';
import PageHeader from '../components/PageHeader';
import AddEditProject from '../components/AddEditProject';

// Helper to format currency in Indian format
const formatRupee = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper to format dates
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const ProjectsList = () => {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector((state) => state.projects);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch projects on filter change
  useEffect(() => {
    dispatch(fetchProjects({ search: searchTerm, status: statusFilter }));
  }, [dispatch, searchTerm, statusFilter]);

  // Color map for status badges
  const statusColorMap = {
    planning: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    on_hold: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
  };

  // Helper to determine budget bar progress color
  const getProgressBarColor = (percentage) => {
    if (percentage < 60) return 'bg-emerald-500';
    if (percentage <= 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Helper to determine budget text color based on spent percentage
  const getProgressTextColor = (percentage) => {
    if (percentage < 60) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage <= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Projects"
        subtitle="Manage and track your active construction projects, budgets, and expenses"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Project
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 pl-11 pr-4 text-sm outline-hidden focus:border-primary-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-primary-500 dark:focus:bg-gray-950"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full sm:w-60">
          <Filter className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 pl-11 pr-10 text-sm outline-hidden focus:border-primary-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:focus:border-primary-500 dark:focus:bg-gray-950"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        // Shimmer Loading Skeleton Grid
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex items-center justify-between">
                <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="mt-2 h-4 w-1/3 rounded bg-gray-100 dark:bg-gray-850" />
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-1/4 rounded bg-gray-250 dark:bg-gray-850" />
                  <div className="h-4 w-1/4 rounded bg-gray-250 dark:bg-gray-850" />
                </div>
                <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-800" />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800/50">
                <div className="h-4 w-1/3 rounded bg-gray-150 dark:bg-gray-850" />
                <div className="h-4 w-4 rounded bg-gray-150 dark:bg-gray-850" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
            <FolderClosed className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
            No projects found
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {searchTerm || statusFilter
              ? "No projects match your current filters. Try refining your search query."
              : "Get started by adding your first construction project to track budgets and costs."}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add First Project
            </button>
          )}
        </div>
      ) : (
        // Real Project Cards Grid
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project) => {
            const budget = project.totalBudget || 0;
            const spent = project.amountSpent || 0;
            const percentUsed = project.percentageUsed || 0;
            
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:shadow-none"
              >
                <div>
                  {/* Title and status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                      {project.name}
                    </h3>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider capitalize ${statusColorMap[project.status] || statusColorMap.active}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{project.location}</span>
                  </div>

                  {/* Budget details */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-500">
                        Spent: <strong className="text-gray-900 dark:text-white">{formatRupee(spent)}</strong>
                      </span>
                      <span className={getProgressTextColor(percentUsed)}>
                        {percentUsed}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-850">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(percentUsed)}`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
                      <span>Total Budget: {formatRupee(budget)}</span>
                      <span>Remaining: {formatRupee(Math.max(0, budget - spent))}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Details */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800/50 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Start: {formatDate(project.startDate)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400">
                    Details
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <AddEditProject
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default ProjectsList;
