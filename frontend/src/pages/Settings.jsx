import { useEffect, useState } from 'react';
import { SettingAPI } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner, EmptyState } from '../components/UI';
import { IconSettings, IconPlus, IconTrash } from '../components/Icons';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const load = () => {
    setLoading(true);
    SettingAPI.list().then((r) => { setSettings(r.data); setDraft(r.data); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const changed = Object.fromEntries(Object.entries(draft).filter(([k, v]) => settings[k] !== v));
      if (Object.keys(changed).length === 0) { toast.info('Nothing to save.'); setSaving(false); return; }
      await SettingAPI.bulkUpdate({ settings: changed });
      toast.success('Settings saved.');
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const addSetting = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      await SettingAPI.update(newKey.trim(), { value: newValue });
      toast.success('Setting added.');
      setNewKey(''); setNewValue('');
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  const entries = Object.entries(settings || {});

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Settings</h2>
          <div className="desc">Workspace configuration key/value pairs.</div>
        </div>
        {isAdmin && <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={IconSettings} title="No settings configured yet" desc={isAdmin ? 'Add your first setting below.' : 'Check back once an administrator configures the workspace.'} />
      ) : (
        <div className="card">
          {entries.map(([key, value]) => (
            <div className="field" key={key}>
              <label className="mono">{key}</label>
              <input value={draft[key] ?? ''} disabled={!isAdmin} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <div><h2 style={{ fontSize: 14 }}>Add setting</h2></div>
          </div>
          <form onSubmit={addSetting} className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="field"><label>Key</label><input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. company_name" /></div>
            <div className="field"><label>Value</label><input value={newValue} onChange={(e) => setNewValue(e.target.value)} /></div>
            <button className="btn btn-ghost" style={{ marginBottom: 14 }} disabled={saving}><IconPlus /> Add</button>
          </form>
        </div>
      )}
    </>
  );
}
