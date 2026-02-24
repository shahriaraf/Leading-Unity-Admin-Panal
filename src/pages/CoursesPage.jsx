import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import CourseModal from '../components/CourseModal';

// --- Icons ---
const SearchIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BookIcon = () => <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get('https://leading-unity-nest-backend.vercel.app/api/courses');
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCourses(courses);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = courses.filter(c => 
        c.courseCode.toLowerCase().includes(lower) || 
        c.courseTitle.toLowerCase().includes(lower)
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const deleteCourseHandler = async (id) => {
    if(!window.confirm("Are you sure you want to delete this course?")) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    
    const promise = axios.delete(`https://leading-unity-nest-backend.vercel.app/api/courses/${id}`, config);

    toast.promise(promise, {
      loading: 'Deleting course...',
      success: 'Course deleted successfully!',
      error: 'Could not delete course.',
    }, { style: { background: '#333', color: '#fff', borderRadius: '8px' } });

    try {
      await promise;
      fetchCourses();
    } catch (error) { console.error(error); }
  };

  const handleOpenAddModal = () => {
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const handleModalSuccess = () => {
    fetchCourses();
    handleModalClose();
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <Toaster position="top-right" />

      {/* --- Header Section --- */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Add, edit, or remove academic courses.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search course code or title..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-95 whitespace-nowrap"
          >
            <PlusIcon /> Add Course
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase w-1/4">Course Code</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-left text-gray-500 uppercase w-1/2">Course Title</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wide text-right text-gray-500 uppercase w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 // Loading Skeleton
                 [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-24 h-6 bg-gray-100 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="w-64 h-5 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4 text-right"><div className="inline-block w-8 h-8 ml-2 bg-gray-100 rounded"></div><div className="inline-block w-8 h-8 ml-2 bg-gray-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <BookIcon />
                      <p className="text-lg font-medium text-gray-600">No courses found</p>
                      <p className="text-sm mt-1">Add a new course to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map(course => (
                  <tr key={course._id} className="group hover:bg-gray-50/80 transition-colors duration-150">
                    
                    {/* Course Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono tracking-wide shadow-sm">
                        {course.courseCode}
                      </span>
                    </td>

                    {/* Course Title */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 leading-snug">{course.courseTitle}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(course)} 
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          title="Edit Course"
                        >
                          <EditIcon />
                        </button>
                        <button 
                          onClick={() => deleteCourseHandler(course._id)} 
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          title="Delete Course"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between items-center">
           <span>Showing {filteredCourses.length} courses</span>
        </div>
      </div>
      
      {/* Modal Injection */}
      <CourseModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        courseToEdit={selectedCourse}
      />
    </div>
  );
};

export default CoursesPage;