export interface UserData {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  mobile: string;
  role: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  attendanceDate: string;
  attendanceTime: string;
  createdAt: string;
  user?: {
    name: string;
    rollNumber: string;
    email: string;
    mobile: string;
  };
}

export interface StudentWithAttendance {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  mobile: string;
  role: string;
  attendanceCount: number;
  lastAttendanceDate: string | null;
  lastAttendanceTime: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  todayPresent: number;
  todayAbsent: number;
  attendancePercentage: number;
}
