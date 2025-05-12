import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import CustomAlert from '../../components/CustomAlert';
import CustomModal from '../../components/Modal';
import { API_URL, endpoints } from '../../config/api';
import { ADMIN_CREDENTIALS } from '../../config/auth';

// Internal InstructorSearchField component
const InstructorSearchField = ({ value, onChange, error }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {
    if (value) {
      setSelectedInstructor({ name: value });
    }
  }, [value]);

  const fetchInstructors = async (query) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/instructors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter instructors based on search query
        const filtered = data.filter(instructor => 
          instructor.fullName.toLowerCase().includes(query.toLowerCase())
        );
        setInstructors(filtered.map(inst => ({ 
          id: inst._id,
          name: inst.fullName,
          idNumber: inst.idNumber // Add instructor ID number
        })));
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    if (text.length >= 2) {
      fetchInstructors(text);
      setShowDropdown(true);
    } else {
      setInstructors([]);
      setShowDropdown(false);
    }
  };

  const handleSelectInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setShowDropdown(false);
    // Pass both name and ID number
    onChange({
      name: instructor.name,
      idNumber: instructor.idNumber
    });
  };

  const renderDropdownContent = () => {
    if (loading) {
      return <Text style={styles.dropdownText}>Loading...</Text>;
    }
    
    if (instructors.length === 0) {
      return <Text style={styles.dropdownText}>No instructors found</Text>;
    }

    return instructors.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.dropdownItem}
        onPress={() => handleSelectInstructor(item)}
      >
        <Text style={styles.dropdownText}>{item.name}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.searchFieldContainer}>
      <SearchBar
        searchValue={typeof value === 'object' ? value.name : value}
        onSearchChange={(text) => {
          onChange(text);
          handleSearch(text);
        }}
        searchPlaceholder="Search for an instructor..."
        showCreateButton={false}
      />
      
      {showDropdown && (
        <View style={styles.dropdown}>
          {renderDropdownContent()}
        </View>
      )}
    </View>
  );
};

const Courses = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalFields, setModalFields] = useState([
    {
      key: 'courseCode',
      label: 'Course Code',
      type: 'text',
      value: '',
      error: '',
      required: true
    },
    {
      key: 'courseName',
      label: 'Course Name',
      type: 'text',
      value: '',
      error: '',
      required: true
    },
    {
      key: 'instructor',
      label: 'Instructor',
      type: 'instructor-search',
      value: '',
      error: '',
      required: true
    }
  ]);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    message: ''
  });
  const [deleteConfirmAlert, setDeleteConfirmAlert] = useState({
    visible: false,
    courseToDelete: null
  });

  const courseTableHeaders = [
    { key: 'courseCode', label: 'Course Code', width: 120 },
    { key: 'courseName', label: 'Course Name', flex: 1.5 },
    { key: 'instructor', label: 'Instructor', flex: 1 },
    { key: 'actions', label: 'Actions', width: 100 }
  ];

  const actionButtons = [
    {
      icon: 'create-outline',
      color: '#4CAF50',
      onPress: (row) => handleEditCourse(row)
    },
    {
      icon: 'trash-outline',
      color: '#dc3545',
      onPress: (row) => handleDeleteCourse(row)
    }
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${endpoints.courses}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: 'Failed to fetch courses'
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to fetch courses'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to update instructor IDs for existing courses
  const updateInstructorIds = async () => {
    try {
      setLoading(true);
      
      // First, get all instructors
      const instructorsResponse = await fetch(`${API_URL}/api/instructors`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      if (!instructorsResponse.ok) {
        throw new Error('Failed to fetch instructors');
      }

      const instructors = await instructorsResponse.json();
      
      // For each instructor, update their courses
      for (const instructor of instructors) {
        const response = await fetch(`${API_URL}/api/courses/update-instructor-ids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
            'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
          },
          body: JSON.stringify({
            instructorName: instructor.fullName,
            instructorId: instructor.idNumber
          })
        });

        if (!response.ok) {
          console.error(`Failed to update courses for instructor ${instructor.fullName}`);
        }
      }

      // Refresh the courses list
      await fetchCourses();
      
      setAlert({
        visible: true,
        type: 'success',
        message: 'Updated instructor IDs for existing courses'
      });
    } catch (error) {
      console.error('Error updating instructor IDs:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to update instructor IDs'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add debug button to header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={updateInstructorIds}
        >
          <Text style={{ color: '#2196F3' }}>Update IDs</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsModalVisible(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    const updatedFields = modalFields.map(field => ({
      ...field,
      value: course[field.key] || ''
    }));
    setModalFields(updatedFields);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCourse(null);
  };

  const handleSaveCourse = async (courseData) => {
    try {
      const endpoint = selectedCourse 
        ? `${endpoints.courseUpdate}/${selectedCourse._id}`
        : endpoints.courseCreate;

      const method = selectedCourse ? 'PUT' : 'POST';
      
      // Extract instructor data
      const instructorData = courseData.instructor;
      const instructorId = typeof instructorData === 'object' ? instructorData.idNumber : instructorData;
      const instructorName = typeof instructorData === 'object' ? instructorData.name : instructorData;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        },
        body: JSON.stringify({
          courseCode: courseData.courseCode,
          courseName: courseData.courseName,
          instructor: instructorId // Use instructor ID
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          visible: true,
          type: 'success',
          message: selectedCourse 
            ? 'Course updated successfully'
            : 'Course created successfully'
        });
        
        // Reset form and refresh courses
        handleModalClose();
        await fetchCourses();
      } else {
        throw new Error(data.message || 'Failed to save course');
      }
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        message: error.message
      });
    }
  };

  const handleDeleteCourse = (course) => {
    setDeleteConfirmAlert({
      visible: true,
      courseToDelete: course
    });
  };

  const confirmDelete = async () => {
    const course = deleteConfirmAlert.courseToDelete;
    if (!course) return;

    try {
      const response = await fetch(`${API_URL}${endpoints.courseDelete}/${course._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      if (response.ok) {
        await fetchCourses();
        setAlert({
          visible: true,
          type: 'success',
          message: 'Course deleted successfully'
        });
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: 'Failed to delete course'
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to delete course'
      });
    } finally {
      setDeleteConfirmAlert({
        visible: false,
        courseToDelete: null
      });
    }
  };

  const renderModalField = (field, value, onChange, error) => {
    if (field.type === 'instructor-search') {
      return (
        <InstructorSearchField
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    }

    return (
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  return (
    <>
      <SearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search courses..."
        onCreatePress={handleCreateCourse}
        createButtonText="Create Course"
      />
      <View style={styles.tableContainer}>
        <Table
          headers={courseTableHeaders}
          data={courses}
          actionButtons={actionButtons}
          emptyMessage={loading ? "Loading courses..." : "No courses found"}
          searchValue={searchQuery}
          searchFields={['courseCode', 'courseName', 'instructor']}
        />
      </View>

      <CustomModal
        visible={isModalVisible}
        onClose={handleModalClose}
        title={selectedCourse ? 'Edit Course' : 'Create Course'}
        onSave={handleSaveCourse}
        renderField={renderModalField}
        fields={modalFields}
      />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <CustomAlert
        visible={deleteConfirmAlert.visible}
        type="warning"
        message="Are you sure you want to delete this course?"
        showConfirmButton={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirmAlert({ visible: false, courseToDelete: null })}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  // InstructorSearchField styles
  searchFieldContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
    marginTop: 5,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
});

export default Courses; 