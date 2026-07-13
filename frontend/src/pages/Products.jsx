import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductAPI, CategoryAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState, money } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconBox, IconImage, IconBarcode, IconX } from '../components/Icons';
import { api } from '../api/client';

const emptyForm = {
  name: '', description: '', sellingPrice: '', costPrice: '', minimumStock: 10,
  unit: '', categoryId: '', barcode: '', sku: '', isActive: true,
};

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const [searchParams] = useSearchParams();

  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(
    ProductAPI.list,
    { sortBy: 'name', sortOrder: 'asc', lowStock: searchParams.get('lowStock') === 'true' || undefined }
  );

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    CategoryAPI.list({ limit: 100, isActive: true }).then((r) => setCategories(Array.isArray(r.data) ? r.data : []));
  }, []);

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };
  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '', sellingPrice: p.sellingPrice, costPrice: p.costPrice,
      minimumStock: p.minimumStock, unit: p.unit, categoryId: p.categoryId, barcode: p.barcode || '', sku: p.sku, isActive: p.isActive,
    });
    setModal({ mode: 'edit', data: p });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        minimumStock: Number(form.minimumStock),
      };
      if (modal.mode === 'create') {
        await ProductAPI.create(payload);
        toast.success('Product created.');
      } else {
        delete payload.sku;
        await ProductAPI.update(modal.data.id, payload);
        toast.success('Product updated.');
      }
      setModal(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await ProductAPI.remove(toDelete.id);
      toast.success('Product deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openImages = async (p) => {
    const fresh = await ProductAPI.get(p.id);
    setImageModal(fresh.data);
  };

  const uploadImages = async (files) => {
    if (!files.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      await ProductAPI.uploadImages(imageModal.id, fd);
      toast.success('Images uploaded.');
      const fresh = await ProductAPI.get(imageModal.id);
      setImageModal(fresh.data);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = async (imageId) => {
    await ProductAPI.setPrimaryImage(imageModal.id, imageId).catch((e) => toast.error(e.message));
    const fresh = await ProductAPI.get(imageModal.id);
    setImageModal(fresh.data);
  };

  const removeImage = async (imageId) => {
    await ProductAPI.deleteImage(imageModal.id, imageId).catch((e) => toast.error(e.message));
    const fresh = await ProductAPI.get(imageModal.id);
    setImageModal(fresh.data);
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Products</h2>
          <div className="desc">Your full catalog, pricing and stock thresholds.</div>
        </div>
        {isAdmin && <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New product</button>}
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search by name, SKU or barcode…" />
        <div className="filter-row">
          <select value={params.categoryId || ''} onChange={(e) => setParams({ categoryId: e.target.value || undefined })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={params.isActive ?? ''} onChange={(e) => setParams({ isActive: e.target.value || undefined })}>
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <label className="checkbox-row" style={{ padding: '0 4px' }}>
            <input type="checkbox" checked={!!params.lowStock} onChange={(e) => setParams({ lowStock: e.target.checked || undefined })} />
            <span style={{ fontSize: 12.5 }}>Low stock only</span>
          </label>
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconBox} title="No products found" desc="Adjust your filters, or add a new product to get started." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th className="mono">SKU</th><th>Category</th><th className="text-right">Sell price</th><th className="text-right">Cost</th><th className="text-right">Min. stock</th><th>Status</th>{isAdmin && <th />}</tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-strong">{p.name}</div>
                    <div className="cell-sub">{p.unit}{p.barcode ? ` · ${p.barcode}` : ''}</div>
                  </td>
                  <td className="mono">{p.sku}</td>
                  <td className="text-muted">{p.category?.name || '—'}</td>
                  <td className="text-right num">{money(p.sellingPrice)}</td>
                  <td className="text-right num text-muted">{money(p.costPrice)}</td>
                  <td className="text-right num">{p.minimumStock}</td>
                  <td><Badge tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  {isAdmin && (
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openImages(p)} title="Images"><IconImage /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit"><IconEdit /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(p)} title="Delete"><IconTrash /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'New product' : 'Edit product'}
        wide
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
        </>}
      >
        <form onSubmit={submit}>
          <div className="field"><label>Product name</label><input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="field"><label>Category</label>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Unit</label><input required placeholder="pcs, kg, box…" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Selling price</label><input required type="number" step="0.01" min="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></div>
            <div className="field"><label>Cost price</label><input required type="number" step="0.01" min="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Minimum stock</label><input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} /></div>
            <div className="field"><label>Barcode</label><input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Optional" /></div>
          </div>
          {modal?.mode === 'create' && (
            <div className="field"><label>SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if left blank" /></div>
          )}
          <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {modal?.mode === 'edit' && (
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span>Active</span></label>
          )}
        </form>
      </Modal>

      <Modal open={!!imageModal} onClose={() => setImageModal(null)} title={`Images · ${imageModal?.name || ''}`}>
        {imageModal && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {(imageModal.productImages || []).map((img) => (
                <div key={img.id} style={{ position: 'relative', border: img.isPrimary ? '2px solid var(--amber-500)' : '1px solid var(--ink-200)', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={`${api.BASE_URL}${img.url.startsWith('/') ? '' : '/'}${img.url}`} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => removeImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(18,22,31,0.7)', border: 'none', color: 'white', borderRadius: 6, width: 20, height: 20, cursor: 'pointer' }}>
                    <IconX style={{ width: 12, height: 12 }} />
                  </button>
                  {!img.isPrimary && (
                    <button onClick={() => setPrimary(img.id)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', bottom: 4, left: 4, right: 4, fontSize: 10, padding: '3px 6px', background: 'white' }}>
                      Set primary
                    </button>
                  )}
                  {img.isPrimary && <span className="badge badge-amber" style={{ position: 'absolute', bottom: 4, left: 4 }}>Primary</span>}
                </div>
              ))}
              {(!imageModal.productImages || imageModal.productImages.length === 0) && (
                <div style={{ gridColumn: '1 / -1' }}><EmptyState icon={IconImage} title="No images yet" desc="Upload up to 5 photos for this product." /></div>
              )}
            </div>
            <label className="field">
              <label>Upload images (up to 5)</label>
              <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => uploadImages(e.target.files)} />
            </label>
          </>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete product" desc={`Delete "${toDelete?.name}"? This cannot be undone.`} />
    </>
  );
}
