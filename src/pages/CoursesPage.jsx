// frontend/src/pages/CoursesPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseModal from '../components/CourseModal';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 1. ADD STATE TO HOLD THE COURSE BEING EDITED
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    // No changes here
    try {
      const { data } = await axios.get('/api/courses');
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const deleteCourseHandler = async (id) => {
    // No changes here
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.delete(`https://leading-unity-backend.vercel.app/api/courses/${id}`, config);
        fetchCourses();
      } catch (error) {
        console.error("Failed to delete course", error);
        alert('Could not delete course.');
      }
    }
  };

  // 2. HANDLERS TO OPEN THE MODAL FOR ADDING OR EDITING
  const handleOpenAddModal = () => {
    setSelectedCourse(null); // Ensure no course is selected (for "add mode")
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourse(course); // Set the selected course
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCourse(null); // Clean up selected course on close
  };

  const handleModalSuccess = () => {
    fetchCourses(); // Refresh the list
    handleModalClose(); // And close the modal
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
        <button
          onClick={handleOpenAddModal} // Use the new handler
          className="px-4 py-2 font-bold text-white transition-transform transform bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:scale-105"
        >
          + Add Course
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Course Code</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Course Title</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {loading ? (
              <tr><td colSpan="3" className="py-4 text-center">Loading courses...</td></tr>
            ) : courses.map(course => (
              <tr key={course._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3 font-mono font-semibold text-left whitespace-nowrap">{course.courseCode}</td>
                <td className="px-6 py-3 text-left">{course.courseTitle}</td>
                <td className="flex justify-center px-6 py-3 space-x-2">
                  {/* 3. ADD AN EDIT BUTTON FOR EACH ROW */}
                  <button onClick={() => handleOpenEditModal(course)} className="px-3 py-1 text-xs font-bold text-white bg-green-500 rounded hover:bg-green-600">
                    Edit
                  </button>
                  <button onClick={() => deleteCourseHandler(course._id)} className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded hover:bg-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 4. PASS THE DYNAMIC PROPS TO THE MODAL */}
      <CourseModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        courseToEdit={selectedCourse} // Pass the selected course here
      />
    </div>
  );
};

export default CoursesPage;