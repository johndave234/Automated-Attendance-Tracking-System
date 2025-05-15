import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import CustomAlert from '../../components/CustomAlert';
import AccountModal from '../../components/Modal';
import { API_URL } from '../../config/api';
import { ADMIN_CREDENTIALS } from '../../config/auth';

const Users = ({ onUpdate }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    message: ''
  });
  const [deleteConfirmAlert, setDeleteConfirmAlert] = useState({
    visible: false,
    accountToDelete: null
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchAccounts();
    }, [])
  );

  const tableHeaders = [
    { key: 'idNumber', label: 'ID Number', width: 90 },
    { key: 'name', label: 'Name', flex: 1 },
    { key: 'type', label: 'Type', width: 80 },
    { key: 'actions', label: 'Actions', width: 80 }
  ];

  const actionButtons = [
    {
      icon: 'create-outline',
      color: '#4CAF50',
      onPress: (row) => handleEdit(row)
    },
    {
      icon: 'trash-outline',
      color: '#dc3545',
      onPress: (row) => handleDelete(row)
    }
  ];

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsRes = await fetch(`${API_URL}/api/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      const students = await studentsRes.json();

      // Fetch instructors
      const instructorsRes = await fetch(`${API_URL}/api/instructors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      const instructors = await instructorsRes.json();

      // Format data
      const formattedStudents = students.map(student => ({
        ...student,
        type: 'Student',
        name: student.fullName
      }));

      const formattedInstructors = instructors.map(instructor => ({
        ...instructor,
        type: 'Instructor',
        name: instructor.fullName
      }));

      setAccounts([...formattedStudents, ...formattedInstructors]);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePress = () => {
    navigation.navigate('Signup', {
      onCreateSuccess: () => {
        fetchAccounts();
      }
    });
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedAccount(null);
  };

  const handleDelete = (account) => {
    setDeleteConfirmAlert({
      visible: true,
      accountToDelete: account
    });
  };

  const confirmDelete = async () => {
    const account = deleteConfirmAlert.accountToDelete;
    if (!account) return;

    try {
      const endpoint = account.type === 'Student' ? 'students' : 'instructors';
      const response = await fetch(`${API_URL}/api/${endpoint}/${account._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });

      if (response.ok) {
        await fetchAccounts();
        setAlert({
          visible: true,
          type: 'success',
          message: `${account.type} deleted successfully`
        });
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: 'Failed to delete'
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to delete'
      });
    } finally {
      setDeleteConfirmAlert({
        visible: false,
        accountToDelete: null
      });
    }
  };

  const handleSaveAccount = async (editedAccount) => {
    try {
      const endpoint = editedAccount.type.toLowerCase() === 'student' ? 'students' : 'instructors';
      
      const accountToUpdate = {
        idNumber: editedAccount.idNumber,
        fullName: editedAccount.name // Using name since that's what we display
      };

      const response = await fetch(`${API_URL}/api/${endpoint}/${editedAccount._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        },
        body: JSON.stringify(accountToUpdate)
      });

      const responseData = await response.json();

      if (response.ok) {
        fetchAccounts(); // Refresh the accounts list
        setIsModalVisible(false);
        setAlert({
          visible: true,
          type: 'success',
          message: 'Account updated successfully'
        });
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: `Failed to update account: ${responseData.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: `Failed to update account: ${error.message}`
      });
    }
  };

  return (
    <>
      <SearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search accounts..."
        onCreatePress={handleCreatePress}
        createButtonText="Create Account"
      />
      <View style={styles.tableContainer}>
        <Table
          headers={tableHeaders}
          data={accounts}
          actionButtons={actionButtons}
          emptyMessage={loading ? "Loading accounts..." : "No accounts found"}
          searchValue={searchQuery}
          searchFields={['idNumber', 'name', 'type']}
        />
      </View>

      <AccountModal
        visible={isModalVisible}
        onClose={handleModalClose}
        account={selectedAccount}
        onSave={handleSaveAccount}
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
        message={`Are you sure you want to delete this ${deleteConfirmAlert.accountToDelete?.type.toLowerCase()}?`}
        showConfirmButton={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirmAlert({ visible: false, accountToDelete: null })}
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
  }
});

export default Users; 