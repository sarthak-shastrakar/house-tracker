import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Receipt,
  FileText,
  Image,
  IndianRupee,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { fetchBills, deleteBill } from '../redux/slices/billSlice';
import { fetchProjects } from '../redux/slices/projectSlice';
import UploadBill from './UploadBill';
import EditBill from './EditBill';
import { toast } from 'react-hot-toast';

const formatRupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const BILL_TYPE_LABELS = {
  material_invoice: 'Material Invoice',
  contractor_bill: 'Contractor Bill',
  labour_bill: 'Labour Bill',
  utility_bill: 'Utility Bill',
  permit_fee: 'Permit Fee',
  miscellaneous: 'Miscellaneous',
};

const BILL_TYPE_COLORS = {
  material_invoice: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  contractor_bill: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
  labour_bill: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  utility_bill: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
  permit_fee: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  miscellaneous: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const BillsTab = ({ projectId }) => {
  const dispatch = useDispatch();
  const { bills, loading } = useSelector((state) => state.bills);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deletingBillId, setDeletingBillId] = useState(null);

  const projectBills = bills.filter(
    (b) => (b.project?._id || b.project) === projectId
  );

  useEffect(() => {
    if (projectId) {
      dispatch(fetchBills({ projectId }));
    }
  }, [dispatch, projectId]);

  const handleDelete = async (id) => {
    const result = await dispatch(deleteBill(id));
    if (deleteBill.fulfilled.match(result)) {
      toast.success('Bill removed.');
      setDeletingBillId(null);
    } else {
      toast.error(result.payload || 'Failed to remove bill.');
    }
  };

  const totalAmount = projectBills.reduce((s, b) => s + (b.amount || 0), 0);
  const totalSize = projectBills.reduce((s, b) => s + (b.fileSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Bills', value: projectBills.length, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Total Amount', value: formatRupee(totalAmount), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Storage Used', value: formatBytes(totalSize), color: 'text-amber-600 dark:text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/70">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
            <p className={`mt-1.5 text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {projectBills.length} Bill{projectBills.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Upload Bill
        </button>
      </div>

      {/* Bills Grid */}
      {loading && projectBills.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : projectBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30">
            <Receipt className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">No bills uploaded</h3>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
            Upload invoices, bills, and permits for this project.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Upload First Bill
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectBills.map((bill) => (
            <BillCard
              key={bill._id}
              bill={bill}
              onEdit={() => setEditingBill(bill)}
              onDelete={() => setDeletingBillId(bill._id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadBill
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            dispatch(fetchBills({ projectId }));
          }}
          preselectedProjectId={projectId}
        />
      )}

      {editingBill && (
        <EditBill
          isOpen={!!editingBill}
          onClose={() => setEditingBill(null)}
          bill={editingBill}
        />
      )}

      {/* Delete Confirm */}
      {deletingBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setDeletingBillId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Remove Bill?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              The record will be removed from view. The file in cloud storage is retained.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingBillId(null)}
                className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/60"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingBillId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-500/25"
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

// ─── Reusable Bill Card ────────────────────────────────────────────────────────
export const BillCard = ({ bill, onEdit, onDelete }) => {
  const isPdf = bill.fileType === 'pdf';
  const typeLabel = BILL_TYPE_LABELS[bill.billType] || bill.billType;
  const typeCls = BILL_TYPE_COLORS[bill.billType] || BILL_TYPE_COLORS.miscellaneous;

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70">
      {/* File Preview Area */}
      <div className="relative h-36 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {!isPdf && bill.fileUrl ? (
          <img
            src={bill.fileUrl}
            alt={bill.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
              <FileText className="h-7 w-7 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-widest">PDF</span>
          </div>
        )}

        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-gray-950/0 group-hover:bg-gray-950/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <a
            href={bill.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-gray-700 hover:bg-white shadow-sm transition-colors"
            title="View file"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-gray-700 hover:bg-white shadow-sm transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-rose-600 hover:bg-white shadow-sm transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Type Badge */}
        <span className={`self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeCls}`}>
          {typeLabel}
        </span>

        {/* Title */}
        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">{bill.title}</h4>

        {/* Meta info */}
        <div className="mt-auto space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{formatDate(bill.billDate)}</span>
          </div>
          {bill.vendorName && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{bill.vendorName}</span>
            </div>
          )}
          {bill.amount != null && bill.amount > 0 && (
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-3 w-3 flex-shrink-0" />
              <span>{new Intl.NumberFormat('en-IN').format(bill.amount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillsTab;
