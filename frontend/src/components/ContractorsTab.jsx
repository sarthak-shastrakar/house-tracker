import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  Phone,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Users,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { fetchContractors, deleteContractor, deletePayment, fetchContractors as refetchContractors } from '../redux/slices/contractorSlice';
import { fetchProjects } from '../redux/slices/projectSlice';
import AddEditContractor from './AddEditContractor';
import RecordPayment from './RecordPayment';
import { toast } from 'react-hot-toast';

const formatRupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusConfig = {
  active: { label: 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400', icon: CheckCircle2 },
  terminated: { label: 'Terminated', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400', icon: XCircle },
};

const workTypeLabel = (c) => {
  if (c.workType === 'custom') return c.customWorkType || 'Custom';
  return c.workType.charAt(0).toUpperCase() + c.workType.slice(1);
};

const paymentModeLabel = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  other: 'Other',
};

const ContractorsTab = ({ projectId }) => {
  const dispatch = useDispatch();
  const { contractors, loading, paymentLoading } = useSelector((state) => state.contractors);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);
  const [paymentContractor, setPaymentContractor] = useState(null);
  const [deletingContractorId, setDeletingContractorId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null); // { contractorId, paymentId }

  const projectContractors = contractors.filter(
    (c) => (c.project?._id || c.project) === projectId
  );

  useEffect(() => {
    if (projectId) {
      dispatch(fetchContractors({ projectId }));
    }
  }, [dispatch, projectId]);

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

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    const result = await dispatch(
      deletePayment({ contractorId: deletingPayment.contractorId, paymentId: deletingPayment.paymentId })
    );
    if (deletePayment.fulfilled.match(result)) {
      toast.success('Payment removed.');
      setDeletingPayment(null);
      dispatch(fetchContractors({ projectId }));
      dispatch(fetchProjects({}));
    } else {
      toast.error(result.payload || 'Failed to remove payment.');
    }
  };

  // Summary totals
  const totalContractValue = projectContractors.reduce((s, c) => s + (c.contractAmount || 0), 0);
  const totalPaid = projectContractors.reduce((s, c) => s + (c.amountPaid || 0), 0);
  const totalBalance = totalContractValue - totalPaid;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Contract Value', value: formatRupee(totalContractValue), color: 'text-primary-600 dark:text-primary-400', icon: Briefcase },
          { label: 'Total Amount Paid', value: formatRupee(totalPaid), color: 'text-emerald-600 dark:text-emerald-400', icon: Banknote },
          { label: 'Balance Outstanding', value: formatRupee(totalBalance), color: 'text-amber-600 dark:text-amber-400', icon: AlertCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/70">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {projectContractors.length} Contractor{projectContractors.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Contractor
        </button>
      </div>

      {/* Contractor Cards */}
      {loading && projectContractors.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : projectContractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30">
            <Users className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">No contractors yet</h3>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
            Add contractors to this project to track work and payments.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add First Contractor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projectContractors.map((c) => {
            const status = statusConfig[c.status] || statusConfig.active;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === c._id;
            const balanceDue = Math.max(0, (c.contractAmount || 0) - (c.amountPaid || 0));
            const progressPct = c.contractAmount > 0 ? Math.min(100, ((c.amountPaid || 0) / c.contractAmount) * 100) : 0;

            return (
              <div
                key={c._id}
                className="rounded-xl border border-gray-100 bg-white overflow-hidden dark:border-gray-800 dark:bg-gray-900/70"
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 font-bold text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{c.name}</h4>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {workTypeLabel(c)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Paid {formatRupee(c.amountPaid)} of {formatRupee(c.contractAmount)}</span>
                        <span className={`font-semibold ${progressPct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {progressPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
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
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c._id)}
                      title={isExpanded ? 'Collapse' : 'View Payments'}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: Payment History */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Payment History ({c.payments?.length || 0})
                      </span>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Balance: {formatRupee(balanceDue)}
                      </span>
                    </div>

                    {!c.payments || c.payments.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                        No payments recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {c.payments.map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                <IndianRupee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatRupee(p.amount)}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                  <span>{formatDate(p.paymentDate)}</span>
                                  <span>·</span>
                                  <span>{paymentModeLabel[p.paymentMode] || p.paymentMode}</span>
                                  {p.note && <><span>·</span><span className="truncate max-w-[120px]">{p.note}</span></>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeletingPayment({ contractorId: c._id, paymentId: p._id })}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dates & Notes */}
                    {(c.startDate || c.expectedEndDate || c.notes) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {c.startDate && <p><span className="font-medium text-gray-600 dark:text-gray-300">Start:</span> {formatDate(c.startDate)}</p>}
                        {c.expectedEndDate && <p><span className="font-medium text-gray-600 dark:text-gray-300">Expected End:</span> {formatDate(c.expectedEndDate)}</p>}
                        {c.notes && <p><span className="font-medium text-gray-600 dark:text-gray-300">Notes:</span> {c.notes}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddEditContractor
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            dispatch(fetchContractors({ projectId }));
            dispatch(fetchProjects({}));
          }}
        />
      )}

      {/* Edit Modal */}
      {editingContractor && (
        <AddEditContractor
          isOpen={!!editingContractor}
          onClose={() => {
            setEditingContractor(null);
            dispatch(fetchContractors({ projectId }));
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
            dispatch(fetchContractors({ projectId }));
            dispatch(fetchProjects({}));
          }}
          contractor={paymentContractor}
        />
      )}

      {/* Delete Contractor Confirm */}
      {deletingContractorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setDeletingContractorId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Remove Contractor?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              This will remove the contractor from this project. Any amount already paid will be deducted from project spend.
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

      {/* Delete Payment Confirm */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setDeletingPayment(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Delete Payment?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              This will remove this payment record and adjust the contractor's paid amount and project spend accordingly.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingPayment(null)}
                className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={paymentLoading}
                className="rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-500/25 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorsTab;
