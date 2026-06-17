import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Edit2,
  IndianRupee,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react';
import { updateBill } from '../redux/slices/billSlice';
import { toast } from 'react-hot-toast';

const BILL_TYPES = [
  { value: 'material_invoice', label: 'Material Invoice' },
  { value: 'contractor_bill', label: 'Contractor Bill' },
  { value: 'labour_bill', label: 'Labour Bill' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'permit_fee', label: 'Permit Fee' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const fieldCls =
  'w-full rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary-500';

const EditBill = ({ isOpen, onClose, bill }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.bills);

  const [form, setForm] = useState({
    title: '',
    billType: 'material_invoice',
    amount: '',
    billDate: '',
    vendorName: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (bill) {
      setForm({
        title: bill.title || '',
        billType: bill.billType || 'material_invoice',
        amount: bill.amount != null ? String(bill.amount) : '',
        billDate: bill.billDate ? bill.billDate.slice(0, 10) : '',
        vendorName: bill.vendorName || '',
        notes: bill.notes || '',
      });
    }
  }, [bill]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.billDate) errs.billDate = 'Bill date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      title: form.title.trim(),
      billType: form.billType,
      amount: form.amount !== '' ? Number(form.amount) : '',
      billDate: form.billDate,
      vendorName: form.vendorName.trim(),
      notes: form.notes.trim(),
    };

    const result = await dispatch(updateBill({ id: bill._id, data: payload }));
    if (updateBill.fulfilled.match(result)) {
      toast.success('Bill updated successfully!');
      onClose();
    } else {
      toast.error(result.payload || 'Failed to update bill.');
    }
  };

  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Edit2 className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit Bill</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Update metadata only — file cannot be changed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current file info */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-900 p-3 border border-gray-100 dark:border-gray-800">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bill.fileType === 'pdf' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
              {bill.fileType === 'pdf'
                ? <span className="text-xs font-bold text-red-600 dark:text-red-400">PDF</span>
                : <span className="text-xs font-bold text-blue-600 dark:text-blue-400">IMG</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{bill.originalFileName || 'Uploaded file'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">File cannot be changed after upload</p>
            </div>
            <a
              href={bill.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0"
            >
              View
            </a>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Tag className="inline h-3 w-3 mr-1" />
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Bill title"
              className={fieldCls}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
          </div>

          {/* Bill Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bill Type
            </label>
            <select name="billType" value={form.billType} onChange={handleChange} className={fieldCls}>
              {BILL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Amount + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <IndianRupee className="inline h-3 w-3 mr-1" />
                Amount (₹)
              </label>
              <input
                name="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={handleChange}
                placeholder="Optional"
                className={fieldCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Calendar className="inline h-3 w-3 mr-1" />
                Bill Date <span className="text-rose-500">*</span>
              </label>
              <input
                name="billDate"
                type="date"
                value={form.billDate}
                onChange={handleChange}
                className={fieldCls}
              />
              {errors.billDate && <p className="mt-1 text-xs text-rose-500">{errors.billDate}</p>}
            </div>
          </div>

          {/* Vendor + Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vendor / Supplier Name
            </label>
            <input
              name="vendorName"
              value={form.vendorName}
              onChange={handleChange}
              placeholder="Optional"
              className={fieldCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Optional remarks"
              className={`${fieldCls} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-500 disabled:opacity-60 transition-all active:scale-95"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBill;
