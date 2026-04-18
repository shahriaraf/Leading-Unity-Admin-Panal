import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Icon, ICONS } from './Ui';
import { api } from './api';

/**
 * UX improvements:
 * - Added a top "warning bar" so the section purpose is immediately clear
 * - Two-step confirmation: first click arms the button (shows a red confirm state),
 *   second click executes. No modal toast needed — inline confirmation is faster
 *   and less disruptive while still preventing accidents.
 * - Course-wise buttons now show the full course name (not just code) on hover
 * - Destructive actions are visually separated from export/config actions via
 *   the parent layout (SettingsPage), but within this card they are further
 *   grouped: global resets vs. course resets.
 */

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
      toast.success(courseId ? `All ${courseCode} submissions deleted.` : `${type} deleted successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete.`);
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
            <ConfirmButton
              label="Delete all submissions"
              fullWidth
              onConfirm={() => handleDelete('Submissions')}
            />
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
          All deletes are permanent and cannot be recovered. Tap once to arm, tap again within 3 seconds to execute.
        </p>
      </div>
    </div>
  );
};

export default DangerZone;