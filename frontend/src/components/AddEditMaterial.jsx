import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createMaterial, updateMaterial } from '../redux/slices/materialSlice';
import { fetchProjects } from '../redux/slices/projectSlice';

// Helper to convert date to YYYY-MM-DD
const formatDateString = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Helper to format currency in Indian format
const formatRupee = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const AddEditMaterial = ({ isOpen, onClose, purchase = null, defaultProjectId = '' }) => {
  const dispatch = useDispatch();
  const isEditMode = !!purchase;
  
  const { projects } = useSelector((state) => state.projects);

  // Form State
  const [formData, setFormData] = useState({
    project: defaultProjectId,
    materialType: 'cement',
    customMaterialName: '',
    quantity: '',
    unit: 'bags',
    customUnit: '',
    rate: '',
    totalAmount: 0,
    purchaseDate: formatDateString(new Date()),
    vendorName: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load projects if not loaded
  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjects({}));
    }
  }, [dispatch, projects.length]);

  // Pre-fill state if editing
  useEffect(() => {
    if (purchase) {
      setFormData({
        project: purchase.project?._id || purchase.project || '',
        materialType: purchase.materialType || 'cement',
        customMaterialName: purchase.customMaterialName || '',
        quantity: purchase.quantity || '',
        unit: purchase.unit || 'bags',
        customUnit: purchase.customUnit || '',
        rate: purchase.rate || '',
        totalAmount: purchase.totalAmount || 0,
        purchaseDate: formatDateString(purchase.purchaseDate),
        vendorName: purchase.vendorName || '',
        notes: purchase.notes || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        project: defaultProjectId || (projects.length > 0 ? projects[0]._id : ''),
        materialType: 'cement',
        customMaterialName: '',
        quantity: '',
        unit: 'bags',
        customUnit: '',
        rate: '',
        totalAmount: 0,
        purchaseDate: formatDateString(new Date()),
        vendorName: '',
        notes: '',
      }));
    }
    setFormErrors({});
  }, [purchase, isOpen, defaultProjectId, projects]);

  // Auto-calculate totalAmount on quantity or rate change
  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    setFormData((prev) => ({
      ...prev,
      totalAmount: parseFloat((qty * rate).toFixed(2)),
    }));
  }, [formData.quantity, formData.rate]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.project) errors.project = 'Project is required.';
    if (!formData.materialType) errors.materialType = 'Material type is required.';
    
    if (formData.materialType === 'custom' && !formData.customMaterialName.trim()) {
      errors.customMaterialName = 'Custom material name is required.';
    }

    if (!formData.quantity) {
      errors.quantity = 'Quantity is required.';
    } else if (Number(formData.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than zero.';
    }

    if (!formData.unit) errors.unit = 'Unit is required.';
    
    if (formData.unit === 'custom' && !formData.customUnit.trim()) {
      errors.customUnit = 'Custom unit label is required.';
    }

    if (!formData.rate) {
      errors.rate = 'Rate is required.';
    } else if (Number(formData.rate) < 0) {
      errors.rate = 'Rate cannot be negative.';
    }

    if (!formData.purchaseDate) errors.purchaseDate = 'Purchase date is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const submitData = {
      ...formData,
      quantity: Number(formData.quantity),
      rate: Number(formData.rate),
      totalAmount: Number(formData.totalAmount),
      purchaseDate: new Date(formData.purchaseDate),
    };

    try {
      if (isEditMode) {
        const actionResult = await dispatch(updateMaterial({ id: purchase._id, data: submitData }));
        if (updateMaterial.fulfilled.match(actionResult)) {
          toast.success('Purchase logged updated.');
          // Dispatch project refresh so detail pages get updated amountSpent
          dispatch(fetchProjects({}));
          onClose();
        } else {
          toast.error(actionResult.payload || 'Failed to update record.');
        }
      } else {
        const actionResult = await dispatch(createMaterial(submitData));
        if (createMaterial.fulfilled.match(actionResult)) {
          toast.success('Purchase recorded successfully.');
          dispatch(fetchProjects({}));
          onClose();
        } else {
          toast.error(actionResult.payload || 'Failed to log purchase.');
        }
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-xs" onClick={onClose} />

      {/* Modal box */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-950 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-950 dark:text-white">
            {isEditMode ? 'Edit Purchase Details' : 'Record Material Purchase'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-650 dark:hover:bg-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 custom-scrollbar">
          {/* Project Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Project *
            </label>
            <select
              name="project"
              value={formData.project}
              onChange={handleInputChange}
              disabled={isEditMode || !!defaultProjectId}
              className={`w-full rounded-xl border py-2.5 px-3 text-sm outline-hidden dark:bg-gray-900 ${
                formErrors.project ? 'border-rose-350 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <option value="">Select Associated Project</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
            {formErrors.project && <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.project}</p>}
          </div>

          {/* Material Type Dropdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Material Type *
              </label>
              <select
                name="materialType"
                value={formData.materialType}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-100 py-2.5 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-900"
              >
                <option value="cement">Cement</option>
                <option value="sand">Sand</option>
                <option value="steel">Steel</option>
                <option value="brick">Bricks</option>
                <option value="paint">Paint</option>
                <option value="wood">Wood</option>
                <option value="tiles">Tiles</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="custom">Custom (Specify)</option>
              </select>
            </div>

            {/* Custom Name */}
            {formData.materialType === 'custom' && (
              <div className="animate-slide-down">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Custom Material Name *
                </label>
                <input
                  type="text"
                  name="customMaterialName"
                  placeholder="e.g. Marble Slab"
                  value={formData.customMaterialName}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border py-2.5 px-3 text-sm outline-hidden dark:bg-gray-900 ${
                    formErrors.customMaterialName ? 'border-rose-350 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                  }`}
                />
                {formErrors.customMaterialName && (
                  <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.customMaterialName}</p>
                )}
              </div>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                name="quantity"
                placeholder="e.g. 150"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3 text-sm outline-hidden dark:bg-gray-900 ${
                  formErrors.quantity ? 'border-rose-350 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.quantity && <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-100 py-2.5 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-900"
              >
                <option value="bags">Bags</option>
                <option value="tons">Tons</option>
                <option value="kg">Kg</option>
                <option value="pieces">Pieces</option>
                <option value="sqft">Sq Ft</option>
                <option value="rft">Rft</option>
                <option value="litre">Litres</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Custom Unit Input */}
          {formData.unit === 'custom' && (
            <div className="animate-slide-down">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Custom Unit Label *
              </label>
              <input
                type="text"
                name="customUnit"
                placeholder="e.g. Brass, Trucks"
                value={formData.customUnit}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden dark:bg-gray-900 ${
                  formErrors.customUnit ? 'border-rose-350 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.customUnit && <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.customUnit}</p>}
            </div>
          )}

          {/* Rate and Computed Total */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Rate per Unit (₹) *
              </label>
              <input
                type="number"
                name="rate"
                placeholder="e.g. 450"
                value={formData.rate}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3 text-sm outline-hidden dark:bg-gray-900 ${
                  formErrors.rate ? 'border-rose-355 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.rate && <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.rate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Total Amount (Auto)
              </label>
              <div className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-2.5 px-3.5 text-sm font-bold text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                {formatRupee(formData.totalAmount)}
              </div>
            </div>
          </div>

          {/* Date and Vendor */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Purchase Date *
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2 px-3 text-sm outline-hidden dark:bg-gray-900 ${
                  formErrors.purchaseDate ? 'border-rose-350 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.purchaseDate && <p className="mt-1 text-xs text-rose-500 font-semibold">{formErrors.purchaseDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Supplier/Vendor Name
              </label>
              <input
                type="text"
                name="vendorName"
                placeholder="e.g. UltraTech Cement Agency"
                value={formData.vendorName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-100 py-2.5 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Delivered directly to site B storage unit..."
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-100 py-2 px-3.5 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-900"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-100 px-4.5 py-2.5 text-sm font-semibold text-gray-655 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/60 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 shadow-md shadow-primary-500/25 transition-all duration-200 active:scale-95 disabled:opacity-55 cursor-pointer"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditMaterial;
