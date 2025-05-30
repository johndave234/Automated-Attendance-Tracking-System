import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/Header';
import Table from '../../components/Table';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import CustomModal from '../../components/Modal';
import CustomAlert from '../../components/CustomAlert';
import { API_URL } from '../../config/api';
import { handleExportReport } from './ExportReport';

// Internal StudentSearchField component
const StudentSearchField = ({ value, onChange, error }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchStudents = async (query) => {
    try {
      setLoading(true);
      console.log('Fetching students with query:', query);
      const response = await fetch(`${API_URL}/api/students/search?search=${query}`);
      console.log('Search API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search API Response data:', data);
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          console.log('Data is not an array:', data);
          setStudents([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Error fetching students:', errorText);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error in fetchStudents:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    console.log('handleSearch called with:', text);
    setSearchText(text);
    onChange(text);
    
    if (text.length >= 2) {
      fetchStudents(text);
      setShowDropdown(true);
    } else {
      setStudents([]);
      setShowDropdown(false);
    }
  };

  const handleSelectStudent = (student) => {
    console.log('handleSelectStudent called with:', student);
    if (!student || !student.idNumber) {
      console.log('Invalid student data:', student);
      return;
    }
    
    setSearchText(student.fullName);
    setShowDropdown(false);
    onChange({
      id: student._id,
      name: student.fullName,
      idNumber: student.idNumber
    });
  };

  return (
    <View style={styles.searchFieldContainer}>
      <SearchBar
        searchValue={searchText}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by ID number or name..."
        showCreateButton={false}
      />
      
      {showDropdown && (
        <View style={styles.dropdown}>
          {loading ? (
            <Text style={styles.dropdownText}>Loading...</Text>
          ) : students.length === 0 ? (
            <Text style={styles.dropdownText}>No students found</Text>
          ) : (
            students.map((student) => (
              <TouchableOpacity
                key={student._id || student.idNumber}
                style={styles.dropdownItem}
                onPress={() => handleSelectStudent(student)}
              >
                <Text style={styles.dropdownItemId}>{student.idNumber}</Text>
                <Text style={styles.dropdownItemName}>{student.fullName}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const EnrolledStudent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params;
  const [searchValue, setSearchValue] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    message: '',
  });
  const [courseDetails, setCourseDetails] = useState({
    courseCode: '',
    courseName: '',
    instructor: '',
    room: ''
  });

  // Fetch enrolled students
  const fetchEnrolledStudents = async () => {
    try {
      console.log('Fetching enrolled students for course:', courseId);
      const response = await fetch(`${API_URL}/api/courses/${courseId}`);
      console.log('Enrolled students API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Enrolled students API Response data:', data);
        setEnrolledStudents(data.students || []);
        setCourseDetails({
          courseCode: data.courseCode,
          courseName: data.courseName,
          instructor: data.instructor,
          room: data.room
        });
      } else {
        const errorText = await response.text();
        console.error('Error fetching enrolled students:', errorText);
        setAlert({
          visible: true,
          type: 'error',
          message: 'Failed to fetch enrolled students'
        });
      }
    } catch (error) {
      console.error('Error in fetchEnrolledStudents:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to fetch enrolled students'
      });
    }
  };

  // Fetch enrolled students on component mount
  useEffect(() => {
    fetchEnrolledStudents();
  }, [courseId]);

  // Fields for the add student modal
  const modalFields = [
    {
      key: 'student',
      label: 'Search Student',
      type: 'student-search',
      value: '',
      error: '',
      required: true
    }
  ];

  // Define table headers with widths and alignment
  const headers = [
    { 
      label: 'ID Number', 
      key: 'idNumber',
      width: '30%',
      align: 'left'
    },
    { 
      label: 'Name', 
      key: 'fullName',
      width: '50%',
      align: 'left'
    },
    { 
      label: 'Actions', 
      key: 'actions',
      width: '20%',
      align: 'center'
    }
  ];

  // Action buttons for the table
  const actionButtons = [
    {
      icon: 'trash-outline',
      color: '#f44336',
      size: 22,
      onPress: (student) => {
        handleDeleteStudent(student);
      }
    }
  ];

  const handleDeleteStudent = async (student) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/unenroll-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.idNumber
        })
      });

      if (response.ok) {
        setAlert({
          visible: true,
          type: 'success',
          message: 'Student removed successfully'
        });
        fetchEnrolledStudents();
      } else {
        const data = await response.json();
        setAlert({
          visible: true,
          type: 'error',
          message: data.message || 'Failed to remove student'
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to remove student'
      });
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsModalVisible(true);
  };

  const handleSaveStudent = async (formData) => {
    console.log('handleSaveStudent called with:', formData);
    
    if (!formData.student || typeof formData.student !== 'object' || !formData.student.idNumber) {
      console.log('Invalid form data:', formData);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Please select a student'
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Enrolling student:', formData.student.idNumber, 'to course:', courseId);
      
      const response = await fetch(`${API_URL}/api/courses/${courseId}/enroll-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: formData.student.idNumber
        })
      });

      console.log('Enroll student API Response status:', response.status);
      const data = await response.json();
      console.log('Enroll student API Response data:', data);

      if (response.ok) {
        setAlert({
          visible: true,
          type: 'success',
          message: 'Student enrolled successfully'
        });
        setIsModalVisible(false);
        fetchEnrolledStudents();
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: data.message || 'Failed to enroll student'
        });
      }
    } catch (error) {
      console.error('Error in handleSaveStudent:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to enroll student'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!courseDetails.courseCode || !courseDetails.courseName) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Course details not available. Please try again.'
      });
      return;
    }

    try {
      await handleExportReport(
        courseId,
        courseDetails.courseCode,
        courseDetails.courseName,
        (message) => {
          setAlert({
            visible: true,
            type: 'success',
            message: message
          });
        },
        (error) => {
          setAlert({
            visible: true,
            type: 'error',
            message: error
          });
        }
      );
    } catch (error) {
      console.error('Export error:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to export report'
      });
    }
  };

  const renderModalField = (field, value, onChange, error) => {
    switch (field.type) {
      case 'student-search':
        return (
          <StudentSearchField
            value={value}
            onChange={onChange}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title={`${courseDetails.courseCode} - Students`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.courseInfoContainer}>
          <Text style={styles.courseName}>{courseDetails.courseName}</Text>
          <View style={styles.courseDetailsRow}>
            <View style={styles.courseDetailItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.courseDetailText}>
                {courseDetails.room || 'No room assigned'}
              </Text>
            </View>
            <View style={styles.courseDetailItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.courseDetailText}>
                {enrolledStudents.length} {enrolledStudents.length === 1 ? 'Student' : 'Students'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search students..."
              showCreateButton={true}
              createButtonText="Add Student"
              onCreatePress={handleAddStudent}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <Table
          headers={headers}
          data={enrolledStudents.filter(student => 
            student.idNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
            student.fullName.toLowerCase().includes(searchValue.toLowerCase())
          )}
          actionButtons={actionButtons}
          emptyMessage="No students enrolled in this course"
        />
      </View>

      <CustomModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title="Add Student"
        onSave={handleSaveStudent}
        renderField={renderModalField}
        fields={modalFields}
      />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  courseInfoContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#165973',
  },
  courseDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  courseDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  searchBarWrapper: {
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
    width: 120,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 5,
  },
  searchFieldContainer: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
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
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemId: {
    width: 80,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dropdownItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dropdownText: {
    padding: 12,
    fontSize: 14,
    color: '#666',
  },
});

export default EnrolledStudent; 