import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Icon, ICONS } from './Ui';
import { api } from './api';

// ── Two-step confirm button (red — destructive) ───────────────────────────────
const ConfirmButton = ({ label, onConfirm, fullWidth = false }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (!armed) { setArmed(true); return; }
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${fullWidth ? 'w-full' : ''}
        py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95
        ${armed
          ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200 animate-pulse'
          : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
        }
      `}
    >
      {armed ? `Tap again to confirm` : label}
    </button>
  );
};

// ── Two-step confirm button (amber — archive action) ─────────────────────────
const ArchiveButton = ({ label, onConfirm, fullWidth = false }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (!armed) { setArmed(true); return; }
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${fullWidth ? 'w-full' : ''}
        py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95
        ${armed
          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 animate-pulse'
          : 'bg-white border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400'
        }
      `}
    >
      {armed ? `Tap again to confirm` : label}
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DangerZone = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('courses')
      .then(({ data }) => setCourses(data))
      .catch(err => console.error("Failed to fetch courses for danger zone", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (type, courseId = null, courseCode = '') => {
    let url = type === 'Users' ? 'users' : 'proposals';
    if (courseId) url = `proposals/course/${courseId}`;
    try {
      await api.delete(url);
      toast.success(courseId
        ? `All ${courseCode} submissions deleted.`
        : `${type} deleted successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete.`);
    }
  };

  const handleArchiveAll = async () => {
    try {
      const { data } = await api.post('proposals/archive');
      toast.success(
        `Archived ${data.archived} submission${data.archived !== 1 ? 's' : ''} and removed them from active records.`,
        { duration: 5000 }
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Archive failed.');
    }
  };

  return (
    <div className="rounded-2xl border border-rose-200 overflow-hidden">
      {/* Warning header bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-rose-600">
        <Icon path={ICONS.alert} cls="w-4 h-4 text-white shrink-0" />
        <span className="text-xs font-bold text-white tracking-wide uppercase">Danger Zone — irreversible actions</span>
      </div>

      <div className="p-5 bg-white space-y-5">
        {/* Global resets */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Global resets</p>
          <div className="space-y-2">
            <ConfirmButton
              label="Delete all users"
              fullWidth
              onConfirm={() => handleDelete('Users')}
            />

            {/* Archive button — amber, sits above delete for visual hierarchy */}
            <ArchiveButton
              label="📦  Archive all submissions"
              fullWidth
              onConfirm={handleArchiveAll}
            />

            <ConfirmButton
              label="Delete all submissions"
              fullWidth
              onConfirm={() => handleDelete('Submissions')}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Archive info box */}
        <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-amber-500 text-base shrink-0">📦</span>
          <div>
            <p className="text-[11px] font-bold text-amber-700 mb-0.5">About archiving</p>
            <p className="text-[11px] text-amber-600 leading-relaxed">
              Archive saves a complete snapshot of every submission into a separate archive
              database, then removes them from the active list. <strong>Important:</strong> if
              you use the Carry Forward feature, always carry forward first, then archive.
              Freshly carried-forward proposals with no marks yet are automatically protected
              from archiving.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Course-wise resets */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Course-wise submission reset</p>
          {loading ? (
            <p className="text-[11px] text-slate-400 italic">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No courses found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {courses.map(course => (
                <ConfirmButton
                  key={course._id}
                  label={`Reset ${course.courseCode}`}
                  onConfirm={() => handleDelete('Course', course._id, course.courseCode)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
          Deletes are permanent and cannot be recovered. Archives are permanent snapshots. Tap once to arm, tap again within 3 seconds to execute.
        </p>
      </div>
    </div>
  );
};

export default DangerZone;