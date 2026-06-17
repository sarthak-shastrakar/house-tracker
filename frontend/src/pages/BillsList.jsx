import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Plus,
  Receipt,
  FileText,
  ExternalLink,
  Edit,
  Trash2,
  IndianRupee,
  Calendar,
  Building2,
  HardDrive,
} from 'lucide-react';
import { fetchBills, deleteBill } from '../redux/slices/billSlice';
import { fetchProjects } from '../redux/slices/projectSlice';
import UploadBill from '../components/UploadBill';
import EditBill from '../components/EditBill';
import { BillCard } from '../components/BillsTab';
import PageHeader from '../components/PageHeader';
import { toast } from 'react-hot-toast';

const formatRupee = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const BILL_TYPES = [
  { value: 'material_invoice', label: 'Material Invoice' },
  { value: 'contractor_bill', label: 'Contractor Bill' },
  { value: 'labour_bill', label: 'Labour Bill' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'permit_fee', label: 'Permit Fee' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const BillsList = () => {
  const dispatch = useDispatch();
  const { bills, loading } = useSelector((state) => state.bills);
  const { projects } = useSelector((state) => state.projects);

  // Filters (server-side)
  const [projectId, setProjectId] = useState('');
  const [billType, setBillType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Client-side search
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deletingBillId, setDeletingBillId] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  const loadBills = () => {
    dispatch(fetchBills({ projectId, billType, startDate, endDate }));
  };

  useEffect(() => {
    loadBills();
  }, [dispatch, projectId, billType, startDate, endDate]);

  const handleDelete = async (id) => {
    const result = await dispatch(deleteBill(id));
    if (deleteBill.fulfilled.match(result)) {
      toast.success('Bill removed.');
      setDeletingBillId(null);
    } else {
      toast.error(result.payload || 'Failed to remove bill.');
    }
  };

  // Client-side search filter
  const filtered = bills.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title?.toLowerCase().includes(q) ||
      b.vendorName?.toLowerCase().includes(q) ||
      b.project?.name?.toLowerCase().includes(q)
    );
  });

  // Summary stats
  const totalBills = filtered.length;
  const totalAmount = filtered.reduce((s, b) => s + (b.amount || 0), 0);
  const totalSize = filtered.reduce((s, b) => s + (b.fileSize || 0), 0);
  const now = new Date();
  const thisMonthBills = filtered.filter((b) => {
    const d = new Date(b.billDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Bills & Invoices"
        subtitle="Manage and organize uploaded invoices, bills, permits and receipts across all projects"
        action={
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Upload Bill
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Bills', value: totalBills, color: 'text-primary-600 dark:text-primary-400', icon: Receipt },
          { label: 'Total Amount', value: formatRupee(totalAmount), color: 'text-emerald-600 dark:text-emerald-400', icon: IndianRupee },
          { label: 'This Month', value: thisMonthBills, color: 'text-amber-600 dark:text-amber-400', icon: Calendar },
          { label: 'Storage Used', value: formatBytes(totalSize), color: 'text-violet-600 dark:text-violet-400', icon: HardDrive },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/70"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900/70 sm:grid-cols-2 lg:grid-cols-5">
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

        {/* Bill Type */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Bill Type
          </label>
          <select
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Types</option>
            {BILL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 px-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
          />
        </div>

        {/* Search */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Title, vendor, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 pl-9 pr-3 text-sm outline-none dark:border-gray-800 dark:bg-gray-950"
            />
          </div>
        </div>
      </div>

      {/* Bills Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/30">
            <Receipt className="h-7 w-7 text-primary-500" />
          </div>
          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">No bills uploaded yet</h3>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
            Upload your first invoice or bill using the button above.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Upload Bill
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bill) => (
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
            loadBills();
          }}
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
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs"
            onClick={() => setDeletingBillId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Remove Bill?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              The record will be hidden. The file in cloud storage is kept intact and not deleted.
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

export default BillsList;
