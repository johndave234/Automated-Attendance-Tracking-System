import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import CustomAlert from '../../components/CustomAlert';
import CustomModal from '../../components/Modal';
import { API_URL, endpoints } from '../../config/api';
import { ADMIN_CREDENTIALS } from '../../config/auth';

// Days of the week for dropdown
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Validate time input (HH:MM AM/PM format)
const validateTimeInput = (value) => {
  // Pattern to validate HH:MM AM/PM format
  const pattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
  return pattern.test(value);
};

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

// Component for Schedule input
const ScheduleInput = ({ schedules, onChange }) => {
  const [activeScheduleIndex, setActiveScheduleIndex] = useState(0);
  const [showDayModal, setShowDayModal] = useState(false);

  // Add a new empty schedule
  const addSchedule = () => {
    const newSchedule = {
      day: 'Monday',
      startTime: '8:00 AM',
      endTime: '9:30 AM'
    };
    onChange([...schedules, newSchedule]);
  };

  // Remove a schedule at specific index
  const removeSchedule = (index) => {
    const updatedSchedules = [...schedules];
    updatedSchedules.splice(index, 1);
    onChange(updatedSchedules);
  };

  // Update a schedule at specific index
  const updateSchedule = (index, field, value) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value
    };
    onChange(updatedSchedules);
  };

  // Day Selection Modal
  const DaySelectionModal = () => (
    <Modal
      visible={showDayModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDayModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.dayModalContent}>
          <Text style={styles.dayModalTitle}>Select Day</Text>
          
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={styles.dayModalItem}
              onPress={() => {
                updateSchedule(activeScheduleIndex, 'day', day);
                setShowDayModal(false);
              }}
            >
              <Text style={styles.dayModalItemText}>{day}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.dayModalCancelButton}
            onPress={() => setShowDayModal(false)}
          >
            <Text style={styles.dayModalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.schedulesContainer}>
      <Text style={styles.sectionLabel}>Schedules</Text>
      
      {schedules.map((schedule, index) => (
        <View key={index} style={styles.scheduleItem}>
          <View style={styles.scheduleRow}>
            {/* Day Selection */}
            <View style={styles.scheduleField}>
              <Text style={styles.fieldLabel}>Day</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setActiveScheduleIndex(index);
                  setShowDayModal(true);
                }}
              >
                <Text>{schedule.day}</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Start Time */}
            <View style={styles.scheduleField}>
              <Text style={styles.fieldLabel}>Start Time (HH:MM AM/PM)</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !validateTimeInput(schedule.startTime) && styles.inputError
                ]}
                value={schedule.startTime}
                onChangeText={(text) => updateSchedule(index, 'startTime', text)}
                placeholder="8:00 AM"
                maxLength={8}
                keyboardType="default"
              />
            </View>
            
            {/* End Time */}
            <View style={styles.scheduleField}>
              <Text style={styles.fieldLabel}>End Time (HH:MM AM/PM)</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !validateTimeInput(schedule.endTime) && styles.inputError
                ]}
                value={schedule.endTime}
                onChangeText={(text) => updateSchedule(index, 'endTime', text)}
                placeholder="9:30 AM"
                maxLength={8}
                keyboardType="default"
              />
            </View>
            
            {/* Remove button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeSchedule(index)}
            >
              <Ionicons name="trash-outline" size={18} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      <TouchableOpacity
        style={styles.addScheduleButton}
        onPress={addSchedule}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.addButtonText}>Add Schedule</Text>
      </TouchableOpacity>
      
      {/* Day Selection Modal */}
      <DaySelectionModal />
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
    },
    {
      key: 'room',
      label: 'Room',
      type: 'text',
      value: '',
      error: '',
      required: false
    },
    {
      key: 'program',
      label: 'Program',
      type: 'text',
      value: '',
      error: '',
      required: false
    },
    {
      key: 'yearSection',
      label: 'Year & Section',
      type: 'text',
      value: '',
      error: '',
      required: false
    },
    {
      key: 'schedules',
      label: 'Schedules',
      type: 'schedules',
      value: [{ day: 'Monday', startTime: '8:00 AM', endTime: '9:30 AM' }],
      error: '',
      required: false
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
    { key: 'courseCode', label: 'Course Code', width: 105 },
    { key: 'instructor', label: 'Instructor', width: 110 },
    { key: 'room', label: 'Room', width: 65 },
    { key: 'actions', label: 'Actions', width: 65 }
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
    // Reset form fields
    const resetFields = modalFields.map(field => ({
      ...field,
      value: field.key === 'schedules' 
        ? [{ day: 'Monday', startTime: '8:00 AM', endTime: '9:30 AM' }] 
        : ''
    }));
    setModalFields(resetFields);
    setIsModalVisible(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    const updatedFields = modalFields.map(field => {
      if (field.key === 'schedules') {
        // Convert existing schedules to AM/PM format if needed
        let schedules = course.schedules && course.schedules.length 
          ? [...course.schedules] 
          : [{ day: 'Monday', startTime: '8:00 AM', endTime: '9:30 AM' }];
        
        // Convert time format if needed
        schedules = schedules.map(schedule => {
          let startTime = schedule.startTime;
          let endTime = schedule.endTime;
          
          // Convert 24-hour format to 12-hour AM/PM if needed
          if (startTime && !startTime.includes('AM') && !startTime.includes('PM')) {
            const [hours, minutes] = startTime.split(':');
            const hour = parseInt(hours);
            if (hour < 12) {
              startTime = `${hour}:${minutes} AM`;
            } else if (hour === 12) {
              startTime = `12:${minutes} PM`;
            } else {
              startTime = `${hour - 12}:${minutes} PM`;
            }
          }
          
          if (endTime && !endTime.includes('AM') && !endTime.includes('PM')) {
            const [hours, minutes] = endTime.split(':');
            const hour = parseInt(hours);
            if (hour < 12) {
              endTime = `${hour}:${minutes} AM`;
            } else if (hour === 12) {
              endTime = `12:${minutes} PM`;
            } else {
              endTime = `${hour - 12}:${minutes} PM`;
            }
          }
          
          return {
            ...schedule,
            startTime,
            endTime
          };
        });
        
        return {
          ...field,
          value: schedules
        };
      }
      
      return {
        ...field,
        value: course[field.key] || ''
      };
    });
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

      // Validate schedules
      if (courseData.schedules && courseData.schedules.length > 0) {
        for (const schedule of courseData.schedules) {
          if (!validateTimeInput(schedule.startTime) || !validateTimeInput(schedule.endTime)) {
            throw new Error('Please correct time formats in schedules (HH:MM AM/PM)');
          }
        }
      }

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
          instructor: instructorId,
          room: courseData.room,
          program: courseData.program,
          yearSection: courseData.yearSection,
          schedules: courseData.schedules
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

    if (field.type === 'schedules') {
      return (
        <ScheduleInput
          schedules={value}
          onChange={onChange}
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
          searchFields={['courseCode', 'instructor', 'room']}
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
  // Schedule input styles
  schedulesContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scheduleItem: {
    marginBottom: 15,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scheduleField: {
    flex: 1,
    marginRight: 10,
    position: 'relative',
    zIndex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  removeButton: {
    padding: 10,
    alignSelf: 'flex-end',
  },
  addScheduleButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  dayModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dayModalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayModalItemText: {
    fontSize: 16,
    color: '#333',
  },
  dayModalCancelButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dayModalCancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Courses; 