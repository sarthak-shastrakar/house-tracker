import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, HardHat, Phone, Briefcase, IndianRupee, Calendar, FileText, Loader2 } from 'lucide-react';
import { createContractor, updateContractor } from '../redux/slices/contractorSlice';
import { toast } from 'react-hot-toast';

const workTypeOptions = [
  { value: 'civil', label: 'Civil Work' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'tiling', label: 'Tiling' },
  { value: 'labour', label: 'Labour' },
  { value: 'custom', label: 'Custom' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
];

const fieldCls =
  'w-full rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary-500';

const AddEditContractor = ({ isOpen, onClose, contractor = null }) => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const { loading } = useSelector((state) => state.contractors);

  const isEdit = !!contractor;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    workType: 'civil',
    customWorkType: '',
    project: '',
    contractAmount: '',
    status: 'active',
    startDate: '',
    expectedEndDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && contractor) {
      setForm({
        name: contractor.name || '',
        phone: contractor.phone || '',
        alternatePhone: contractor.alternatePhone || '',
        workType: contractor.workType || 'civil',
        customWorkType: contractor.customWorkType || '',
        project: contractor.project?._id || contractor.project || '',
        contractAmount: contractor.contractAmount || '',
        status: contractor.status || 'active',
        startDate: contractor.startDate ? contractor.startDate.slice(0, 10) : '',
        expectedEndDate: contractor.expectedEndDate ? contractor.expectedEndDate.slice(0, 10) : '',
        notes: contractor.notes || '',
      });
    }
  }, [isEdit, contractor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Contractor name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.workType) newErrors.workType = 'Work type is required';
    if (form.workType === 'custom' && !form.customWorkType.trim())
      newErrors.customWorkType = 'Please specify the work type';
    if (!form.project) newErrors.project = 'Select a project';
    if (!form.contractAmount || Number(form.contractAmount) <= 0)
      newErrors.contractAmount = 'Enter a valid contract amount';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim(),
      workType: form.workType,
      customWorkType: form.workType === 'custom' ? form.customWorkType.trim() : '',
      project: form.project,
      contractAmount: Number(form.contractAmount),
      status: form.status,
      startDate: form.startDate || undefined,
      expectedEndDate: form.expectedEndDate || undefined,
      notes: form.notes.trim(),
    };

    let result;
    if (isEdit) {
      result = await dispatch(updateContractor({ id: contractor._id, data: payload }));
      if (updateContractor.fulfilled.match(result)) {
        toast.success('Contractor updated successfully!');
        onClose();
      } else {
        toast.error(result.payload || 'Update failed.');
      }
    } else {
      result = await dispatch(createContractor(payload));
      if (createContractor.fulfilled.match(result)) {
        toast.success('Contractor added successfully!');
        onClose();
      } else {
        toast.error(result.payload || 'Failed to add contractor.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
              <HardHat className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Contractor' : 'Add Contractor'}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {isEdit ? 'Update contractor details' : 'Register a new contractor for a project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name + Phone row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <HardHat className="inline h-3 w-3 mr-1" />
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Ramesh Kumar"
                className={fieldCls}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Phone className="inline h-3 w-3 mr-1" />
                Phone <span className="text-rose-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g., 9876543210"
                className={fieldCls}
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
            </div>
          </div>

          {/* Alternate Phone + Work Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Alternate Phone
              </label>
              <input
                name="alternatePhone"
                value={form.alternatePhone}
                onChange={handleChange}
                placeholder="Optional"
                className={fieldCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Briefcase className="inline h-3 w-3 mr-1" />
                Work Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="workType"
                value={form.workType}
                onChange={handleChange}
                className={fieldCls}
              >
                {workTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.workType && <p className="mt-1 text-xs text-rose-500">{errors.workType}</p>}
            </div>
          </div>

          {/* Custom Work Type (conditional) */}
          {form.workType === 'custom' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Custom Work Type <span className="text-rose-500">*</span>
              </label>
              <input
                name="customWorkType"
                value={form.customWorkType}
                onChange={handleChange}
                placeholder="e.g., Waterproofing, Excavation"
                className={fieldCls}
              />
              {errors.customWorkType && <p className="mt-1 text-xs text-rose-500">{errors.customWorkType}</p>}
            </div>
          )}

          {/* Project + Contract Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                name="project"
                value={form.project}
                onChange={handleChange}
                className={fieldCls}
                disabled={isEdit}
              >
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {errors.project && <p className="mt-1 text-xs text-rose-500">{errors.project}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <IndianRupee className="inline h-3 w-3 mr-1" />
                Contract Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                name="contractAmount"
                type="number"
                min="0"
                value={form.contractAmount}
                onChange={handleChange}
                placeholder="e.g., 250000"
                className={fieldCls}
              />
              {errors.contractAmount && <p className="mt-1 text-xs text-rose-500">{errors.contractAmount}</p>}
            </div>
          </div>

          {/* Status + Start Date + Expected End Date */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={fieldCls}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Calendar className="inline h-3 w-3 mr-1" />
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className={fieldCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Calendar className="inline h-3 w-3 mr-1" />
                Expected End Date
              </label>
              <input
                name="expectedEndDate"
                type="date"
                value={form.expectedEndDate}
                onChange={handleChange}
                className={fieldCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <FileText className="inline h-3 w-3 mr-1" />
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional remarks, terms, scope details..."
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
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 disabled:opacity-60 transition-all active:scale-95"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Contractor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditContractor;
