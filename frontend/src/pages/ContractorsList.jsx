import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  HardHat,
  Phone,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
} from 'lucide-react';
import { fetchContractors, deleteContractor } from '../redux/slices/contractorSlice';
import { fetchProjects } from '../redux/slices/projectSlice';
import AddEditContractor from '../components/AddEditContractor';
import RecordPayment from '../components/RecordPayment';
import PageHeader from '../components/PageHeader';
import { toast } from 'react-hot-toast';

const formatRupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const statusConfig = {
  active: { label: 'Active', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400', icon: CheckCircle2 },
  terminated: { label: 'Terminated', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400', icon: XCircle },
};

const workTypeLabel = (c) => {
  if (c.workType === 'custom') return c.customWorkType || 'Custom';
  const labels = {
    civil: 'Civil',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    carpentry: 'Carpentry',
    painting: 'Painting',
    tiling: 'Tiling',
    labour: 'Labour',
  };
  return labels[c.workType] || c.workType;
};

const ContractorsList = () => {
  const dispatch = useDispatch();
  const { contractors, loading } = useSelector((state) => state.contractors);
  const { projects } = useSelector((state) => state.projects);

  // Filters
  const [projectId, setProjectId] = useState('');
  const [workType, setWorkType] = useState('');
  const [status, setStatus] = useState('');
  const [searchName, setSearchName] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);
  const [paymentContractor, setPaymentContractor] = useState(null);
  const [deletingContractorId, setDeletingContractorId] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  const loadContractors = () => {
    dispatch(fetchContractors({ projectId, workType, status }));
  };

  useEffect(() => {
    loadContractors();
  }, [dispatch, projectId, workType, status]);

  const handleDelete = async (id) => {
    const result = await dispatch(deleteContractor(id));
    if (deleteContractor.fulfilled.match(result)) {
      toast.success('Contractor removed.');
      setDeletingContractorId(null);
      dispatch(fetchProjects({}));
    } else {
      toast.error(result.payload || 'Failed to remove contractor.');
    }
  };

  const filtered = contractors.filter((c) => {
    if (!searchName.trim()) return true;
    return c.name.toLowerCase().includes(searchName.toLowerCase());
  });

  // Compute summary stats
  const totalContractors = filtered.length;
  const activeCount = filtered.filter((c) => c.status === 'active').length;
  const totalContractValue = filtered.reduce((s, c) => s + (c.contractAmount || 0), 0);
  const totalPaid = filtered.reduce((s, c) => s + (c.amountPaid || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Contractors"
        subtitle="Manage contractor profiles, contracts, work progress and payment history"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Contractor
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Contractors', value: totalContractors, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Contract Value', value: formatRupee(totalContractValue), color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Paid', value: formatRupee(totalPaid), color: 'text-blue-600 dark:text-blue-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/70"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {label}
            </span>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/70 sm:grid-cols-2 lg:grid-cols-4">
        {/* Project */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Work Type */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Work Type
          </label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Types</option>
            {['civil', 'electrical', 'plumbing', 'carpentry', 'painting', 'tiling', 'labour', 'custom'].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Search Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Contractor name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 pl-9 pr-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/70 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-500">
              <HardHat className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">No contractors found</h3>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
              Add your first contractor using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-gray-950/40">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Work Type</th>
                  <th className="px-6 py-4">Contract</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/40">
                {filtered.map((c) => {
                  const status = statusConfig[c.status] || statusConfig.active;
                  const StatusIcon = status.icon;
                  const balanceDue = Math.max(0, (c.contractAmount || 0) - (c.amountPaid || 0));

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 font-bold text-xs">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {c.project?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Briefcase className="h-3 w-3 text-gray-400" />
                          {workTypeLabel(c)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                        {formatRupee(c.contractAmount)}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatRupee(c.amountPaid)}
                      </td>
                      <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-semibold">
                        {formatRupee(balanceDue)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPaymentContractor(c)}
                            title="Record Payment"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingContractor(c)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingContractorId(c._id)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddEditContractor
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            loadContractors();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingContractor && (
        <AddEditContractor
          isOpen={!!editingContractor}
          onClose={() => {
            setEditingContractor(null);
            loadContractors();
          }}
          contractor={editingContractor}
        />
      )}

      {/* Record Payment Modal */}
      {paymentContractor && (
        <RecordPayment
          isOpen={!!paymentContractor}
          onClose={() => {
            setPaymentContractor(null);
            loadContractors();
            dispatch(fetchProjects({}));
          }}
          contractor={paymentContractor}
        />
      )}

      {/* Delete Confirm */}
      {deletingContractorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs"
            onClick={() => setDeletingContractorId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Remove Contractor?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              This will permanently remove the contractor record and deduct any paid amounts from project spend.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingContractorId(null)}
                className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/60"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingContractorId)}
                className="rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-500/25"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorsList;
