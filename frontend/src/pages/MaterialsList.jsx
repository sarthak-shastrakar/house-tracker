import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, Calendar, IndianRupee, Trash2, Edit, Plus, PackageOpen, HelpCircle } from 'lucide-react';
import { fetchMaterials, deleteMaterial } from '../redux/slices/materialSlice';
import { fetchProjects } from '../redux/slices/projectSlice';
import PageHeader from '../components/PageHeader';
import AddEditMaterial from '../components/AddEditMaterial';
import { toast } from 'react-hot-toast';

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

const MaterialsList = () => {
  const dispatch = useDispatch();
  const { materials, loading } = useSelector((state) => state.materials);
  const { projects } = useSelector((state) => state.projects);

  // Filter States
  const [projectId, setProjectId] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchVendor, setSearchVendor] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  // Load projects & materials on mount/filter change
  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  const loadMaterials = () => {
    dispatch(
      fetchMaterials({
        projectId,
        materialType,
        startDate,
        endDate,
      })
    );
  };

  useEffect(() => {
    loadMaterials();
  }, [dispatch, projectId, materialType, startDate, endDate]);

  const handleDelete = async (id) => {
    try {
      const actionResult = await dispatch(deleteMaterial(id));
      if (deleteMaterial.fulfilled.match(actionResult)) {
        toast.success('Purchase record deleted.');
        setDeletingMaterialId(null);
        // Dispatch fetch projects again since project spent was modified
        dispatch(fetchProjects({}));
      } else {
        toast.error(actionResult.payload || 'Failed to delete record.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    }
  };

  // Filter materials client-side for vendor search
  const filteredMaterials = materials.filter((item) => {
    if (!searchVendor.trim()) return true;
    return item.vendorName?.toLowerCase().includes(searchVendor.toLowerCase());
  });

  // Calculate dynamic summaries from the active list
  const totalSpent = filteredMaterials.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalEntries = filteredMaterials.length;

  const getMostUsedMaterial = () => {
    if (filteredMaterials.length === 0) return 'N/A';
    const counts = {};
    filteredMaterials.forEach((item) => {
      const type = item.materialType === 'custom' ? item.customMaterialName : item.materialType;
      counts[type] = (counts[type] || 0) + 1;
    });
    let maxType = 'N/A';
    let maxCount = 0;
    Object.keys(counts).forEach((key) => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        maxType = key;
      }
    });
    return maxType;
  };

  const mostUsedMaterial = getMostUsedMaterial();

  const materialTypeLabels = {
    cement: 'Cement',
    sand: 'Sand',
    steel: 'Steel',
    brick: 'Bricks',
    paint: 'Paint',
    wood: 'Wood',
    tiles: 'Tiles',
    electrical: 'Electricals',
    plumbing: 'Plumbing',
    custom: 'Custom',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Material Ledger"
        subtitle="Track material purchases, quantities, rates, and suppliers across your projects"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Material Purchase
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Total Material Spent
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-450 sm:text-3xl">
            {formatRupee(totalSpent)}
          </h3>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Sum of filtered purchase logs</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Purchase Logs
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-primary-600 dark:text-primary-450 sm:text-3xl">
            {totalEntries}
          </h3>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Total recorded transactions</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Most Purchased Type
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-450 sm:text-3xl capitalize">
            {mostUsedMaterial}
          </h3>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Highest transaction occurrence</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/70 shadow-xs sm:grid-cols-2 lg:grid-cols-5">
        {/* Project Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Filter Project
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Projects</option>
            {projects.map((proj) => (
              <option key={proj._id} value={proj._id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Material Type filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Material Type
          </label>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-950"
          >
            <option value="">All Types</option>
            {Object.entries(materialTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-950"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 px-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-950"
          />
        </div>

        {/* Search Supplier/Vendor */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Vendor Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Supplier name..."
              value={searchVendor}
              onChange={(e) => setSearchVendor(e.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2.5 pl-9 pr-3 text-sm outline-hidden dark:border-gray-800 dark:bg-gray-950"
            />
          </div>
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/70 overflow-hidden">
        {loading ? (
          // Shimmer loading table skeleton
          <div className="p-6 space-y-4 animate-pulse">
            <div className="grid grid-cols-7 gap-4 border-b border-gray-100 pb-4 dark:border-gray-850">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-850 rounded" />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-7 gap-4 pb-1">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <div key={col} className="h-6 bg-gray-100 dark:bg-gray-850 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/45 dark:text-amber-400">
              <PackageOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">No purchases logged</h3>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 max-w-xs">
              No material transactions match your criteria. Add new records using the action button.
            </p>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-gray-950/40">
                <tr>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/40">
                {filteredMaterials.map((item) => {
                  const typeLabel = item.materialType === 'custom' ? item.customMaterialName : materialTypeLabels[item.materialType] || item.materialType;
                  const formattedUnit = item.unit === 'custom' ? item.customUnit : item.unit;
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10">
                      <td className="px-6 py-4.5 font-semibold text-gray-900 dark:text-white capitalize">
                        {typeLabel}
                      </td>
                      <td className="px-6 py-4.5 text-gray-500 dark:text-gray-405">
                        {item.project?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4.5 text-gray-700 dark:text-gray-300">
                        {item.quantity} <span className="text-xs text-gray-400 capitalize">{formattedUnit}</span>
                      </td>
                      <td className="px-6 py-4.5 text-gray-700 dark:text-gray-300">
                        {formatRupee(item.rate)}
                      </td>
                      <td className="px-6 py-4.5 font-bold text-gray-900 dark:text-white">
                        {formatRupee(item.totalAmount)}
                      </td>
                      <td className="px-6 py-4.5 text-gray-550 dark:text-gray-400">
                        {formatDate(item.purchaseDate)}
                      </td>
                      <td className="px-6 py-4.5 text-gray-550 dark:text-gray-400 truncate max-w-[120px]">
                        {item.vendorName || '-'}
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMaterial(item)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-750 dark:hover:bg-gray-900 dark:hover:text-gray-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingMaterialId(item._id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 transition-colors"
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

      {/* Modals */}
      {showAddModal && (
        <AddEditMaterial
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            loadMaterials();
          }}
        />
      )}

      {editingMaterial && (
        <AddEditMaterial
          isOpen={!!editingMaterial}
          onClose={() => {
            setEditingMaterial(null);
            loadMaterials();
          }}
          purchase={editingMaterial}
        />
      )}

      {/* Delete Confirmation Alert Modal */}
      {deletingMaterialId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setDeletingMaterialId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-base font-bold text-gray-950 dark:text-white font-sans">Delete Record?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Are you sure you want to delete this material purchase record? This will subtract the item cost from the project's amount spent.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingMaterialId(null)}
                className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingMaterialId)}
                className="rounded-xl bg-rose-650 px-4.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-500/25 cursor-pointer"
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

export default MaterialsList;
