import React from 'react';
import toast from 'react-hot-toast';
import { Icon, ICONS } from './Ui';
import { api } from './api';


const AlertIcon = () => <Icon path={ICONS.alert} cls="w-12 h-12 text-rose-500 mb-3" />;

const DangerZone = () => {
  const handleDelete = async (type) => {
    const url = type === 'Users' ? 'users' : 'proposals';
    try { await api.delete(url); toast.success(`${type} deleted successfully.`); }
    catch { toast.error(`Failed to delete ${type}.`); }
  };

  const confirm = (type) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3 min-w-[280px] p-4 bg-white rounded-lg">
        <AlertIcon />
        <h3 className="font-bold text-gray-800 text-lg">Confirm Deletion</h3>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          Are you absolutely sure? This will permanently delete ALL {type}. This action cannot be undone.
        </p>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { toast.dismiss(t.id); handleDelete(type); }} className="flex-1 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md hover:shadow-lg transition-all">Yes, Delete</button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-center' });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Icon path={ICONS.trash} /></div>
        <h3 className="font-bold text-slate-800">Danger Zone</h3>
      </div>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed relative z-10">
        Irreversible actions. Deleting users or submissions cannot be undone.
      </p>
      <div className="space-y-3 relative z-10">
        {['Users', 'Submissions'].map(type => (
          <button key={type} onClick={() => confirm(type)}
            className="w-full py-3 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-sm"
          >
            Reset All {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DangerZone;