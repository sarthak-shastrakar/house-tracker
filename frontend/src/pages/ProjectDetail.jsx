import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  Activity,
  History,
  TrendingUp,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchProjectById, deleteProject } from '../redux/slices/projectSlice';
import AddEditProject from '../components/AddEditProject';
import MaterialsTab from '../components/MaterialsTab';
import ContractorsTab from '../components/ContractorsTab';
import BillsTab from '../components/BillsTab';

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

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProject, currentProjectStats, loading, error } = useSelector(
    (state) => state.projects
  );
  const { materials } = useSelector((state) => state.materials);

  const [activeTab, setActiveTab] = useState('materials');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch project on mount
  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  const handleDelete = async () => {
    try {
      const resultAction = await dispatch(deleteProject(id));
      if (deleteProject.fulfilled.match(resultAction)) {
        toast.success('Project deleted successfully.');
        navigate('/projects');
      } else {
        toast.error(resultAction.payload || 'Failed to delete project.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center justify-between">
          <div className="h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-40 w-full rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded bg-gray-155 dark:bg-gray-800" />
          <div className="h-24 rounded bg-gray-155 dark:bg-gray-800" />
          <div className="h-24 rounded bg-gray-155 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Ban className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-950 dark:text-white">Project not found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          {error || 'The project details could not be loaded. It may have been deleted.'}
        </p>
        <Link
          to="/projects"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Projects
        </Link>
      </div>
    );
  }

  // Extracted values
  const budget = currentProject.totalBudget || 0;
  const spent = currentProject.amountSpent || 0;
  const percentUsed = currentProjectStats?.percentageUsed || 0;
  const remaining = currentProjectStats?.remaining || 0;
  const budgetStatus = currentProjectStats?.budgetStatus || 'safe';

  // Badge styles
  const statusColorMap = {
    planning: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    on_hold: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
  };

  const getProgressBarColor = (percentage) => {
    if (percentage < 60) return 'bg-emerald-500';
    if (percentage <= 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation and Edit controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 transition-all cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            Edit Project
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50/50 dark:border-rose-950/30 dark:bg-gray-950 dark:text-rose-450 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Project Title Block */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            {currentProject.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 shrink-0 text-gray-400" />
              {currentProject.location}
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-750">•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 shrink-0 text-gray-400" />
              Started: {formatDate(currentProject.startDate)}
            </span>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center rounded-xl border px-3.5 py-1.5 text-sm font-bold uppercase tracking-wider capitalize ${statusColorMap[currentProject.status] || statusColorMap.active}`}>
            {currentProject.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Warning Indicators */}
      {budgetStatus === 'danger' && (
        <div className="flex gap-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 p-4.5 text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-350">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Budget Limit Exceeded</h4>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              The project spent has exceeded 100% of the total budget allocated. Please revise the project budget allocation or audit latest contractor invoices and material logs.
            </p>
          </div>
        </div>
      )}

      {budgetStatus === 'warning' && (
        <div className="flex gap-3.5 rounded-2xl border border-amber-100 bg-amber-50/45 p-4.5 text-amber-800 dark:border-amber-950/40 dark:bg-amber-950/10 dark:text-amber-350">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Budget Warning Threshold Triggered</h4>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              Spent has crossed the warning limit threshold of {currentProject.budgetWarningThreshold}% of the total budget. Current usage is at {percentUsed}%.
            </p>
          </div>
        </div>
      )}

      {/* Main Budget Visualizer Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Budget Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total Budget
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {formatRupee(budget)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Target capitalization limit</span>
          </div>
        </div>

        {/* Spent Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Amount Spent
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {formatRupee(spent)}
            </h3>
          </div>
          {/* Spent Progress Slider */}
          <div className="mt-4 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-850">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(percentUsed)}`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Spent usage</span>
              <span className="font-bold">{percentUsed}%</span>
            </div>
          </div>
        </div>

        {/* Remaining Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Remaining Balance
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {formatRupee(remaining)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-primary-500" />
            <span>Buffer reserves remaining</span>
          </div>
        </div>
      </div>

      {/* Details Row Info */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs text-center">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Land Area</span>
          <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
            {currentProject.landArea ? `${currentProject.landArea.toLocaleString('en-IN')} sq ft` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Built Area</span>
          <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
            {currentProject.constructionArea ? `${currentProject.constructionArea.toLocaleString('en-IN')} sq ft` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Target End</span>
          <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
            {formatDate(currentProject.expectedEndDate)}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Threshold</span>
          <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
            {currentProject.budgetWarningThreshold}%
          </p>
        </div>
      </div>

      {/* Tabs and Tab Panels */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
        {/* Tab Headers */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <nav className="flex flex-wrap gap-2 -mb-px">
            {[
              { id: 'materials', name: 'Materials Ledger', icon: Package, count: materials.length },
              { id: 'contractors', name: 'Contractors', icon: Users, count: currentProjectStats?.contractorCount || 0 },
              { id: 'bills', name: 'Bills & Invoices', icon: Receipt, count: currentProjectStats?.billCount || 0 },
              { id: 'activity', name: 'Budget Revision Log', icon: History, count: currentProject.budgetHistory?.length || 0 },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{tab.name}</span>
                  <span className={`inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400' : 'bg-gray-50 text-gray-400 dark:bg-gray-950 dark:text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {activeTab === 'materials' && (
            <MaterialsTab projectId={id} />
          )}

          {activeTab === 'contractors' && (
            <ContractorsTab projectId={id} />
          )}

          {activeTab === 'bills' && (
            <BillsTab projectId={id} />
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              {currentProject.budgetHistory && currentProject.budgetHistory.length > 0 ? (
                <div className="relative border-l border-gray-100 pl-6 space-y-6 dark:border-gray-800">
                  {currentProject.budgetHistory.map((item, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-gray-950">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                      </span>
                      
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Budget capitalization: {formatRupee(item.amount)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {formatDate(item.changedAt)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="h-9 w-9 text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No budget revision records</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <AddEditProject
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          project={currentProject}
        />
      )}

      {/* Delete Confirmation Alert Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Delete Project?</h3>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-405 leading-relaxed">
              Are you sure you want to delete project "{currentProject.name}"? This will move it to trash and hide all active budget charts. This action is soft-deletable but cannot be undone easily.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-gray-100 px-4.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-500/25 cursor-pointer animate-pulse-once"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
