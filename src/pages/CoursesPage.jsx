import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import CourseModal from '../components/CourseModal';

const API_BASE = 'https://leading-unity-nest-backend.vercel.app/api';

const getAuthHeader = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
};

// --- Icons ---
const SearchIcon  = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon    = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const EditIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const TransferIcon= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BookIcon    = () => <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

// ── Transfer Confirm Modal ─────────────────────────────────────────────────────
const TransferModal = ({ preview, onConfirm, onCancel, isLoading }) => {
  if (!preview) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 m-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TransferIcon />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Carry Forward Proposals</h2>
            <p className="text-xs text-gray-400">Review before confirming</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 font-mono">
            {preview.fromCourse.courseCode}
          </span>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 font-mono">
            {preview.toCourse.courseCode}
          </span>
          <span className="text-xs text-gray-500 ml-1">{preview.toCourse.courseTitle}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{preview.toTransferCount}</p>
            <p className="text-xs text-indigo-500 mt-0.5">Will be transferred</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{preview.skippedCount}</p>
            <p className="text-xs text-amber-500 mt-0.5">Already transferred</p>
          </div>
        </div>

        {/* What carries over / what resets */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="font-bold text-emerald-700 mb-1.5">✓ Carries over</p>
            {['Title & description', 'Team members', 'Leader', 'Supervisor assignment'].map(i => (
              <p key={i} className="text-emerald-600">{i}</p>
            ))}
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <p className="font-bold text-rose-700 mb-1.5">✗ Resets (fresh start)</p>
            {['Marks & scores', 'Defense schedule', 'Serial number'].map(i => (
              <p key={i} className="text-rose-600">{i}</p>
            ))}
          </div>
        </div>

        {/* Sample preview */}
        {preview.preview.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sample (first {preview.preview.length})
            </p>
            <div className="space-y-1.5">
              {preview.preview.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="font-medium text-gray-700 truncate max-w-[65%]">{p.title}</span>
                  <span className="text-gray-400 shrink-0">{p.leader} · {p.members} members</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {preview.toTransferCount === 0 ? (
          <div className="text-center py-2 mb-4">
            <p className="text-sm text-amber-600 font-medium">All proposals have already been transferred.</p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || preview.toTransferCount === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const CoursesPage = () => {
  const [courses,         setCourses]         = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [selectedCourse,  setSelectedCourse]  = useState(null);
  const [searchTerm,      setSearchTerm]      = useState('');

  // Transfer state
  const [transferPreview,    setTransferPreview]    = useState(null);
  const [isPreviewLoading,   setIsPreviewLoading]   = useState(false);
  const [isTransferLoading,  setIsTransferLoading]  = useState(false);

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/courses`);
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!searchTerm) return setFilteredCourses(courses);
    const lower = searchTerm.toLowerCase();
    setFilteredCourses(courses.filter((c) =>
      c.courseCode.toLowerCase().includes(lower) ||
      c.courseTitle.toLowerCase().includes(lower),
    ));
  }, [searchTerm, courses]);

  const deleteCourseHandler = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    const promise = axios.delete(`${API_BASE}/courses/${id}`, getAuthHeader());
    toast.promise(promise,
      { loading: 'Deleting...', success: 'Course deleted!', error: 'Could not delete course.' },
      { style: { background: '#333', color: '#fff', borderRadius: '8px' } },
    );
    try { await promise; fetchCourses(); } catch (e) { console.error(e); }
  };

  // ── Transfer handlers ────────────────────────────────────────────────────
  const handleTransferClick = async (course) => {
    setIsPreviewLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/courses/${course._id}/transfer-preview`,
        getAuthHeader(),
      );
      setTransferPreview(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load transfer preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferPreview) return;
    setIsTransferLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/courses/${transferPreview.fromCourse._id}/transfer`,
        {},
        getAuthHeader(),
      );
      toast.success(data.message);
      setTransferPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIsTransferLoading(false);
    }
  };

  const openModal  = (course = null) => { setSelectedCourse(course); setIsModalOpen(true); };
  const closeModal = ()              => { setSelectedCourse(null);   setIsModalOpen(false); };

  // ── Sub-components ────────────────────────────────────────────────────────
  const SkeletonRows = () =>
    [...Array(4)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-100 rounded-md" /></td>
        <td className="px-6 py-4"><div className="w-64 h-5 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4"><div className="w-36 h-5 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4 text-right">
          <div className="inline-block w-8 h-8 ml-2 bg-gray-100 rounded" />
          <div className="inline-block w-8 h-8 ml-2 bg-gray-100 rounded" />
        </td>
      </tr>
    ));

  const EmptyRow = () => (
    <tr>
      <td colSpan="4" className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <BookIcon />
          <p className="text-lg font-medium text-gray-600">No courses found</p>
          <p className="text-sm mt-1">Add a new course to get started.</p>
        </div>
      </td>
    </tr>
  );

  const CourseRow = ({ course }) => {
    const linked = course.linkedCourseId; // populated object from backend
    const hasLink = !!linked;

    return (
      <tr className="group hover:bg-gray-50/80 transition-colors duration-150">
        {/* Course Code */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono tracking-wide shadow-sm">
            {course.courseCode}
          </span>
        </td>

        {/* Title */}
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900 leading-snug">{course.courseTitle}</div>
        </td>

        {/* Linked course */}
        <td className="px-6 py-4">
          {hasLink ? (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="text-xs font-bold text-indigo-600 font-mono">{linked.courseCode}</span>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{linked.courseTitle}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">
            {/* Transfer button — only visible when the course has a linked course */}
            {hasLink && (
              <button
                onClick={() => handleTransferClick(course)}
                disabled={isPreviewLoading}
                title={`Carry forward to ${linked.courseCode}`}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
              >
                <TransferIcon />
              </button>
            )}
            <button onClick={() => openModal(course)} title="Edit Course"
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <EditIcon />
            </button>
            <button onClick={() => deleteCourseHandler(course._id)} title="Delete Course"
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20">
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-2">
      <Toaster position="top-right" />

      {/* Transfer Confirm Modal */}
      <TransferModal
        preview={transferPreview}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setTransferPreview(null)}
        isLoading={isTransferLoading}
      />

      {/* Header */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Add, edit, or remove academic courses.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text" placeholder="Search course code or title..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-700"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-95 whitespace-nowrap"
          >
            <PlusIcon /> Add Course
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase w-1/6">Course Code</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase w-2/5">Course Title</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase w-1/4">Carries Forward To</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading                       ? <SkeletonRows />
              : filteredCourses.length === 0 ? <EmptyRow />
              : filteredCourses.map((course) => <CourseRow key={course._id} course={course} />)}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between items-center">
          <span>Showing {filteredCourses.length} courses</span>
        </div>
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => { fetchCourses(); closeModal(); }}
        courseToEdit={selectedCourse}
        allCourses={courses}      // ← passed so the dropdown can list all courses
      />
    </div>
  );
};

export default CoursesPage;