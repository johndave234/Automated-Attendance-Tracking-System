import { API_URL, endpoints } from '../../config/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

// Function to format date to YYYY-MM-DD
const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// Function to calculate attendance percentage
const calculateAttendancePercentage = (present, total) => {
    if (total === 0) return 0;
    return ((present / total) * 100).toFixed(2);
};

// Function to format cell value for CSV
const formatCsvCell = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    // Convert to string and check if it needs quotes
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes(' ') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

// Main export function
export const generateAttendanceReport = async (courseId, courseCode, courseName) => {
    try {
        // Request storage permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Storage permission is needed to save the report to your device.',
                [{ text: 'OK' }]
            );
            return false;
        }

        // Get course details and attendance records
        const [courseResponse, attendanceResponse] = await Promise.all([
            fetch(`${API_URL}${endpoints.courses}/${courseId}`),
            fetch(`${API_URL}${endpoints.sessionStats}/${courseId}`)
        ]);

        const courseData = await courseResponse.json();
        const attendanceData = await attendanceResponse.json();

        if (!courseData || !attendanceData.success) {
            throw new Error('Failed to fetch course or attendance data');
        }

        // Prepare CSV content
        let csvContent = [];

        // Course Information Section
        csvContent.push(['COURSE INFORMATION']);
        csvContent.push(['Course Code', courseCode]);
        csvContent.push(['Course Name', courseName]);
        csvContent.push(['Instructor', courseData.instructor]);
        csvContent.push(['Total Students', attendanceData.overallStats.totalStudents || 0]);
        csvContent.push(['Total Sessions', attendanceData.overallStats.totalSessions || 0]);
        csvContent.push(['Room', courseData.room || 'Not Specified']);
        csvContent.push([]); // Empty row for spacing
        csvContent.push([]); // Extra empty row for better readability

        // Student Attendance Section
        csvContent.push(['STUDENT ATTENDANCE']);
        csvContent.push(['Student ID', 'Student Name', 'Date', 'Present', 'Absent', 'Late']);

        // Add student attendance records
        const students = attendanceData.studentStats || [];
        const sessions = (attendanceData.overallStats && attendanceData.overallStats.sessionStats) || [];

        students.forEach(student => {
            sessions.forEach(session => {
                csvContent.push([
                    student.studentId || '',
                    student.studentName || '',
                    formatDate(session.date),
                    session.present ? '1' : '0',
                    session.absent ? '1' : '0',
                    session.late ? '1' : '0'
                ]);
            });
        });

        // Convert array to CSV string with proper formatting
        const csvString = csvContent
            .map(row => row.map(formatCsvCell).join(','))
            .join('\n');

        // Generate filename with timestamp
        const timestamp = new Date().getTime();
        const fileName = `${courseCode}_attendance_report_${formatDate(new Date())}_${timestamp}.csv`;

        if (Platform.OS === 'android') {
            try {
                // Get permissions for Android storage access
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                
                if (!permissions.granted) {
                    Alert.alert('Permission denied', 'Unable to save file without storage permission');
                    return false;
                }

                // Create file in selected directory
                const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    fileName,
                    'text/csv'
                );

                // Write content to file
                await FileSystem.writeAsStringAsync(fileUri, csvString, {
                    encoding: FileSystem.EncodingType.UTF8
                });

                Alert.alert(
                    'Success',
                    `Report saved successfully as ${fileName}`,
                    [{ text: 'OK' }]
                );
            } catch (error) {
                console.error('Error saving file on Android:', error);
                Alert.alert(
                    'Error',
                    'Failed to save the report. Please try again.',
                    [{ text: 'OK' }]
                );
                throw error;
            }
        } else {
            // iOS implementation
            try {
                const tempUri = `${FileSystem.documentDirectory}${fileName}`;
                
                await FileSystem.writeAsStringAsync(tempUri, csvString, {
                    encoding: FileSystem.EncodingType.UTF8
                });

                await MediaLibrary.saveToLibraryAsync(tempUri);
                await FileSystem.deleteAsync(tempUri, { idempotent: true });

                Alert.alert(
                    'Success',
                    `Report saved successfully as ${fileName}`,
                    [{ text: 'OK' }]
                );
            } catch (error) {
                console.error('Error saving file on iOS:', error);
                Alert.alert(
                    'Error',
                    'Failed to save the report. Please try again.',
                    [{ text: 'OK' }]
                );
                throw error;
            }
        }

        return true;
    } catch (error) {
        console.error('Error generating attendance report:', error);
        Alert.alert(
            'Error',
            'Failed to generate the report. Please try again.',
            [{ text: 'OK' }]
        );
        throw error;
    }
};

// Helper function to handle export button click
export const handleExportReport = async (courseId, courseCode, courseName, onSuccess, onError) => {
    try {
        await generateAttendanceReport(courseId, courseCode, courseName);
        if (onSuccess) {
            onSuccess('Report saved to device successfully');
        }
    } catch (error) {
        if (onError) {
            onError(error.message || 'Failed to save report');
        }
    }
}; 