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
      } else {
        const errorText = await response.text();
        console.error('Error fetching enrolled students:', errorText);
      }
    } catch (error) {
      console.error('Error in fetchEnrolledStudents:', error);
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

  // Define table headers
  const headers = [
    { label: 'ID Number', key: 'idNumber' },
    { label: 'Name', key: 'fullName' },
    { label: 'Actions', key: 'actions' }
  ];

  // Action buttons for the table
  const actionButtons = [
    {
      icon: 'trash-outline',
      color: '#f44336',
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
        title="Course Details"
        subtitle="View enrolled students"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddStudent}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        <Table
          headers={headers}
          data={enrolledStudents}
          actionButtons={actionButtons}
        />
      </View>

      <CustomModal
        visible={isModalVisible}
        title="Add Student"
        fields={modalFields}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveStudent}
        renderField={renderModalField}
        isLoading={isLoading}
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#165973',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
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
    borderRadius: 5,
    elevation: 5,
    maxHeight: 200,
    zIndex: 2,
  },
  dropdownText: {
    padding: 10,
    color: '#666',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemId: {
    fontSize: 14,
    color: '#666',
  },
  dropdownItemName: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
});

export default EnrolledStudent; 