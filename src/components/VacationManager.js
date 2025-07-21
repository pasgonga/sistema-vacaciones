import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Users, BarChart3, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Bell, BellOff, FileSpreadsheet, Upload, Download,
  Save, Search, Filter, Plus, Edit, Trash2, Eye, ThumbsUp, ThumbsDown,
  Settings, Moon, Sun, RefreshCw, Archive, UserPlus, CalendarDays,
  PieChart, Activity, MapPin, Mail, Phone, Building
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const AdvancedVacationManager = () => {
  // Estados principales
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedYear, setSelectedYear] = useState(2025);

  // Estados para formularios
  const [employeeForm, setEmployeeForm] = useState({
    id: null, name: '', email: '', phone: '', totalVacationDays: 22,
    startDate: '', endDate: '', department: '', position: '', manager: '',
    address: '', emergencyContact: '', emergencyPhone: ''
  });

  const [vacationForm, setVacationForm] = useState({
    id: null, employeeId: '', year: 2025, startDate: '', endDate: '',
    reason: '', type: 'annual', status: 'pending', approvedBy: '', comments: ''
  });

  const [restrictionForm, setRestrictionForm] = useState({
    id: null, employee1Id: '', employee2Id: '', reason: '', priority: 'medium'
  });

  const [holidayForm, setHolidayForm] = useState({
    id: null, name: '', date: '', type: 'national', recurring: false
  });

  // Configuración de temas
  const themes = {
    light: {
      bg: '#f9fafb', cardBg: '#ffffff', text: '#111827', textSecondary: '#6b7280',
      border: '#e5e7eb', primary: '#3b82f6', success: '#10b981', danger: '#ef4444', warning: '#f59e0b'
    },
    dark: {
      bg: '#111827', cardBg: '#1f2937', text: '#f9fafb', textSecondary: '#d1d5db',
      border: '#374151', primary: '#60a5fa', success: '#34d399', danger: '#f87171', warning: '#fbbf24'
    }
  };

  const currentTheme = darkMode ? themes.dark : themes.light;

  // Base de datos IndexedDB mejorada
  const initAdvancedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AdvancedVacationDB', 3);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Empleados con más campos
        if (!db.objectStoreNames.contains('employees')) {
          const empStore = db.createObjectStore('employees', { keyPath: 'id' });
          empStore.createIndex('name', 'name', { unique: false });
          empStore.createIndex('department', 'department', { unique: false });
          empStore.createIndex('manager', 'manager', { unique: false });
          empStore.createIndex('email', 'email', { unique: true });
        }
        
        // Vacaciones con estados y aprobaciones
        if (!db.objectStoreNames.contains('vacations')) {
          const vacStore = db.createObjectStore('vacations', { keyPath: 'id' });
          vacStore.createIndex('employeeId', 'employeeId', { unique: false });
          vacStore.createIndex('year', 'year', { unique: false });
          vacStore.createIndex('status', 'status', { unique: false });
          vacStore.createIndex('startDate', 'startDate', { unique: false });
        }
        
        // Restricciones con prioridades
        if (!db.objectStoreNames.contains('restrictions')) {
          const restStore = db.createObjectStore('restrictions', { keyPath: 'id' });
          restStore.createIndex('priority', 'priority', { unique: false });
        }
        
        // Días festivos
        if (!db.objectStoreNames.contains('holidays')) {
          const holStore = db.createObjectStore('holidays', { keyPath: 'id' });
          holStore.createIndex('date', 'date', { unique: false });
          holStore.createIndex('type', 'type', { unique: false });
        }
        
        // Configuración del sistema
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Historial de cambios
        if (!db.objectStoreNames.contains('audit_log')) {
          const auditStore = db.createObjectStore('audit_log', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('action', 'action', { unique: false });
        }
      };
    });
  };

  // Funciones de base de datos mejoradas
  const saveToAdvancedDB = async (storeName, data) => {
    const db = await initAdvancedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      for (const item of data) {
        await store.put(item);
      }
    } else {
      await store.put(data);
    }
    
    // Log de auditoría
    if (storeName !== 'audit_log') {
      await logAction(storeName, 'save', data);
    }
    
    return transaction.complete;
  };

  const loadFromAdvancedDB = async (storeName, index = null, value = null) => {
    const db = await initAdvancedDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    let request;
    if (index && value) {
      const indexStore = store.index(index);
      request = indexStore.getAll(value);
    } else {
      request = store.getAll();
    }
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const deleteFromAdvancedDB = async (storeName, id) => {
    const db = await initAdvancedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.delete(id);
    
    await logAction(storeName, 'delete', { id });
    
    return transaction.complete;
  };

  // Sistema de auditoría
  const logAction = async (entity, action, data) => {
    try {
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        entity,
        action,
        data: JSON.stringify(data),
        userId: 'system' // En un sistema real sería el usuario actual
      };
      
      const db = await initAdvancedDB();
      const transaction = db.transaction(['audit_log'], 'readwrite');
      const store = transaction.objectStore('audit_log');
      await store.put(logEntry);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Inicialización de datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empData, vacData, restData, holData] = await Promise.all([
          loadFromAdvancedDB('employees'),
          loadFromAdvancedDB('vacations'),
          loadFromAdvancedDB('restrictions'),
          loadFromAdvancedDB('holidays')
        ]);

        // Datos iniciales si no existen
        if (empData.length === 0) {
          const initialEmployees = [
            "PEPE SALGADO", "AURELIO CARDONA", "ÓSCAR GÓMEZ", "YOLANDA CALZÓN",
            "MARÍA BARROS NIETO", "PEDRO CALVET", "INMACULADA SÁNCHEZ",
            "ANGELA ESCOBEDO FERNÁNDEZ", "ALEJANDRO RODRÍGUEZ", "DIEGO JULIÁN"
          ].map((name, index) => ({
            id: Date.now() + index,
            name,
            email: name.toLowerCase().replace(/\s+/g, '.') + '@empresa.com',
            phone: `+34 ${600 + index}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            totalVacationDays: 22,
            usedVacationDays: { 2024: Math.floor(Math.random() * 10), 2025: Math.floor(Math.random() * 5), 2026: 0 },
            startDate: new Date(2023, index % 12, 1).toISOString().split('T')[0],
            endDate: null,
            department: ['Soporte', 'Programación', 'Booking', 'Administración'][index % 4],
            position: ['Técnico', 'Senior', 'Junior', 'Especialista'][index % 4],
            manager: index > 4 ? empData[Math.floor(index / 2)]?.name || 'Director General' : 'Director General',
            address: `Calle Ejemplo ${index + 1}, Madrid`,
            emergencyContact: `Contacto ${index + 1}`,
            emergencyPhone: `+34 ${700 + index}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
          }));

          await saveToAdvancedDB('employees', initialEmployees);
          setEmployees(initialEmployees);
        } else {
          setEmployees(empData);
        }

        // Días festivos por defecto
        if (holData.length === 0) {
          const defaultHolidays = [
            { id: 1, name: 'Año Nuevo', date: '2025-01-01', type: 'national', recurring: true },
            { id: 2, name: 'Reyes Magos', date: '2025-01-06', type: 'national', recurring: true },
            { id: 3, name: 'Día del Trabajador', date: '2025-05-01', type: 'national', recurring: true },
            { id: 4, name: 'Asunción', date: '2025-08-15', type: 'national', recurring: true },
            { id: 5, name: 'Fiesta Nacional', date: '2025-10-12', type: 'national', recurring: true },
            { id: 6, name: 'Todos los Santos', date: '2025-11-01', type: 'national', recurring: true },
            { id: 7, name: 'Constitución', date: '2025-12-06', type: 'national', recurring: true },
            { id: 8, name: 'Inmaculada', date: '2025-12-08', type: 'national', recurring: true },
            { id: 9, name: 'Navidad', date: '2025-12-25', type: 'national', recurring: true }
          ];
          
          await saveToAdvancedDB('holidays', defaultHolidays);
          setHolidays(defaultHolidays);
        } else {
          setHolidays(holData);
        }

        setVacations(vacData);
        setRestrictions(restData);
        
        // Cargar configuración del tema
        const settings = await loadFromAdvancedDB('settings');
        const darkModeSetting = settings.find(s => s.key === 'darkMode');
        if (darkModeSetting) {
          setDarkMode(darkModeSetting.value);
        }
        
      } catch (error) {
        showAlert('general', 'Error cargando datos: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Utilidades
  const showAlert = useCallback((section, message, type = 'info') => {
    setAlerts(prev => ({ ...prev, [section]: { message, type } }));
    setTimeout(() => {
      setAlerts(prev => ({ ...prev, [section]: null }));
    }, 5000);
  }, []);

  const calculateWorkingDays = useCallback((startDate, endDate) => {
    let count = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => h.date === dateStr);
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) count++;
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }, [holidays]);

  const isEmployeeActive = useCallback((employee) => {
    if (!employee.endDate) return true;
    return new Date(employee.endDate) > new Date();
  }, []);

  // Funciones de empleados mejoradas
  const handleEmployeeSubmit = async () => {
    if (!employeeForm.name.trim() || !employeeForm.email.trim()) {
      showAlert('employees', 'Nombre y email son obligatorios', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeForm.email)) {
      showAlert('employees', 'Email no válido', 'error');
      return;
    }

    try {
      const employeeData = {
        ...employeeForm,
        id: employeeForm.id || Date.now(),
        usedVacationDays: employeeForm.id 
          ? employees.find(e => e.id === employeeForm.id)?.usedVacationDays || { 2024: 0, 2025: 0, 2026: 0 }
          : { 2024: 0, 2025: 0, 2026: 0 },
        createdAt: employeeForm.id ? employees.find(e => e.id === employeeForm.id)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveToAdvancedDB('employees', employeeData);

      if (employeeForm.id) {
        setEmployees(prev => prev.map(emp => emp.id === employeeForm.id ? employeeData : emp));
        showAlert('employees', 'Empleado actualizado correctamente', 'success');
      } else {
        setEmployees(prev => [...prev, employeeData]);
        showAlert('employees', 'Empleado agregado correctamente', 'success');
      }

      resetEmployeeForm();
    } catch (error) {
      showAlert('employees', 'Error guardando empleado: ' + error.message, 'error');
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      id: null, name: '', email: '', phone: '', totalVacationDays: 22,
      startDate: '', endDate: '', department: '', position: '', manager: '',
      address: '', emergencyContact: '', emergencyPhone: ''
    });
  };

  // Funciones de vacaciones mejoradas
  const handleVacationSubmit = async () => {
    if (!vacationForm.employeeId || !vacationForm.startDate || !vacationForm.endDate) {
      showAlert('vacations', 'Todos los campos son obligatorios', 'error');
      return;
    }

    const startDate = new Date(vacationForm.startDate);
    const endDate = new Date(vacationForm.endDate);
    const workingDays = calculateWorkingDays(startDate, endDate);

    try {
      const vacationData = {
        ...vacationForm,
        id: vacationForm.id || Date.now(),
        employeeId: parseInt(vacationForm.employeeId),
        days: workingDays,
        createdAt: vacationForm.id ? vacations.find(v => v.id === vacationForm.id)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveToAdvancedDB('vacations', vacationData);

      if (vacationForm.id) {
        setVacations(prev => prev.map(v => v.id === vacationForm.id ? vacationData : v));
        showAlert('vacations', 'Vacaciones actualizadas correctamente', 'success');
      } else {
        setVacations(prev => [...prev, vacationData]);
        showAlert('vacations', 'Vacaciones solicitadas correctamente', 'success');
      }

      resetVacationForm();
    } catch (error) {
      showAlert('vacations', 'Error guardando vacaciones: ' + error.message, 'error');
    }
  };

  const resetVacationForm = () => {
    setVacationForm({
      id: null, employeeId: '', year: 2025, startDate: '', endDate: '',
      reason: '', type: 'annual', status: 'pending', approvedBy: '', comments: ''
    });
  };

  // Aprobación de vacaciones
  const approveVacation = async (vacationId, approve = true) => {
    const vacation = vacations.find(v => v.id === vacationId);
    if (!vacation) return;

    const updatedVacation = {
      ...vacation,
      status: approve ? 'approved' : 'rejected',
      approvedBy: 'Sistema', // En un sistema real sería el usuario actual
      updatedAt: new Date().toISOString()
    };

    await saveToAdvancedDB('vacations', updatedVacation);
    setVacations(prev => prev.map(v => v.id === vacationId ? updatedVacation : v));
    
    showAlert('vacations', 
      `Vacaciones ${approve ? 'aprobadas' : 'rechazadas'} correctamente`, 
      approve ? 'success' : 'warning'
    );
  };

  // Exportar e importar datos
  const exportData = async () => {
    try {
      const data = {
        employees,
        vacations,
        restrictions,
        holidays,
        exportDate: new Date().toISOString(),
        version: '2.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vacation_data_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showAlert('general', 'Datos exportados correctamente', 'success');
    } catch (error) {
      showAlert('general', 'Error exportando datos: ' + error.message, 'error');
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.employees) {
        await saveToAdvancedDB('employees', data.employees);
        setEmployees(data.employees);
      }
      if (data.vacations) {
        await saveToAdvancedDB('vacations', data.vacations);
        setVacations(data.vacations);
      }
      if (data.restrictions) {
        await saveToAdvancedDB('restrictions', data.restrictions);
        setRestrictions(data.restrictions);
      }
      if (data.holidays) {
        await saveToAdvancedDB('holidays', data.holidays);
        setHolidays(data.holidays);
      }

      showAlert('general', 'Datos importados correctamente', 'success');
    } catch (error) {
      showAlert('general', 'Error importando datos: ' + error.message, 'error');
    }
  };

  // Filtros y búsquedas
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = !filters.department || emp.department === filters.department;
    const matchesStatus = !filters.status || 
                         (filters.status === 'active' ? isEmployeeActive(emp) : !isEmployeeActive(emp));
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredVacations = vacations.filter(vac => {
    const employee = employees.find(e => e.id === vac.employeeId);
    const matchesSearch = employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vac.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filters.year || vac.year === parseInt(filters.year);
    const matchesStatus = !filters.vacationStatus || vac.status === filters.vacationStatus;
    
    return matchesSearch && matchesYear && matchesStatus;
  });

  // Guardar configuración del tema
  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    try {
      await saveToAdvancedDB('settings', { key: 'darkMode', value: newDarkMode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Datos para dashboard mejorado
  const getDashboardData = () => {
    const activeEmployees = employees.filter(emp => isEmployeeActive(emp));
    
    const departmentData = activeEmployees.reduce((acc, emp) => {
      const dept = emp.department || 'Sin departamento';
      if (!acc[dept]) {
        acc[dept] = { name: dept, employees: 0, totalDays: 0, usedDays: 0, pendingRequests: 0 };
      }
      acc[dept].employees++;
      acc[dept].totalDays += emp.totalVacationDays;
      acc[dept].usedDays += (emp.usedVacationDays[selectedYear] || 0);
      
      const empVacations = vacations.filter(v => v.employeeId === emp.id && v.status === 'pending');
      acc[dept].pendingRequests += empVacations.length;
      
      return acc;
    }, {});

    const statusData = [
      { name: 'Aprobadas', value: vacations.filter(v => v.status === 'approved').length },
      { name: 'Pendientes', value: vacations.filter(v => v.status === 'pending').length },
      { name: 'Rechazadas', value: vacations.filter(v => v.status === 'rejected').length }
    ];

    return {
      departmentData: Object.values(departmentData),
      statusData,
      totalStats: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        pendingRequests: vacations.filter(v => v.status === 'pending').length,
        approvedVacations: vacations.filter(v => v.status === 'approved' && v.year === selectedYear).length,
        totalHolidays: holidays.length
      }
    };
  };

  const dashboardData = getDashboardData();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Estilos dinámicos
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      transition: 'all 0.3s ease'
    },
    card: {
      backgroundColor: currentTheme.cardBg,
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: darkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      backgroundColor: currentTheme.primary,
      color: darkMode ? '#000' : '#fff'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${currentTheme.border}`,
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: currentTheme.cardBg,
      color: currentTheme.text,
      boxSizing: 'border-box'
    }
  };

  if (loading) {
    return (
      <div style={{...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <RefreshCw size={48} className="animate-spin" color={currentTheme.primary} />
          <p style={{marginTop: '16px', color: currentTheme.textSecondary}}>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{
        backgroundColor: currentTheme.cardBg,
        borderBottom: `1px solid ${currentTheme.border}`,
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', margin: 0}}>
              🏖️ Gestión Avanzada de Vacaciones
            </h1>
            <p style={{color: currentTheme.textSecondary, margin: '4px 0 0 0'}}>
              Sistema completo con base de datos local
            </p>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <button onClick={toggleDarkMode} style={styles.button}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            <button onClick={exportData} style={styles.button}>
              <Download size={16} />
              Exportar
            </button>
            
            <label style={styles.button}>
              <Upload size={16} />
              Importar
              <input 
                type="file" 
                accept=".json" 
                onChange={importData}
                style={{display: 'none'}}
              />
            </label>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav style={{
        backgroundColor: currentTheme.cardBg,
        borderBottom: `1px solid ${currentTheme.border}`,
        padding: '0 24px'
      }}>
        <div style={{maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '32px'}}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'employees', label: 'Empleados', icon: Users },
            { id: 'vacations', label: 'Vacaciones', icon: Calendar },
            { id: 'restrictions', label: 'Restricciones', icon: AlertTriangle },
            { id: 'holidays', label: 'Días Festivos', icon: CalendarDays },
            { id: 'reports', label: 'Reportes', icon: PieChart }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id ? currentTheme.primary : currentTheme.textSecondary,
                borderBottom: `2px solid ${activeTab === tab.id ? currentTheme.primary : 'transparent'}`
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Contenido principal */}
      <main style={{maxWidth: '1280px', margin: '0 auto', padding: '32px 24px'}}>
        {/* Alertas */}
        {Object.entries(alerts).map(([key, alert]) => alert && (
          <div
            key={key}
            style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: alert.type === 'error' ? '#fee2e2' : 
                             alert.type === 'success' ? '#d1fae5' : '#fef3c7',
              color: alert.type === 'error' ? '#991b1b' : 
                     alert.type === 'success' ? '#065f46' : '#92400e',
              border: `1px solid ${alert.type === 'error' ? '#fecaca' : 
                                   alert.type === 'success' ? '#6ee7b7' : '#fde68a'}`
            }}
          >
            {alert.message}
          </div>
        ))}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{display: 'grid', gap: '24px'}}>
            {/* Estadísticas principales */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
              {[
                { label: 'Total Empleados', value: dashboardData.totalStats.totalEmployees, icon: Users, color: currentTheme.primary },
                { label: 'Empleados Activos', value: dashboardData.totalStats.activeEmployees, icon: CheckCircle, color: currentTheme.success },
                { label: 'Solicitudes Pendientes', value: dashboardData.totalStats.pendingRequests, icon: Clock, color: currentTheme.warning },
                { label: 'Vacaciones Aprobadas', value: dashboardData.totalStats.approvedVacations, icon: ThumbsUp, color: currentTheme.success },
                { label: 'Días Festivos', value: dashboardData.totalStats.totalHolidays, icon: CalendarDays, color: currentTheme.primary }
              ].map((stat, index) => (
                <div key={index} style={styles.card}>
                  <div style={{
                    display: 'inline-block',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: stat.color,
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <stat.icon size={24} />
                  </div>
                  <div style={{fontSize: '32px', fontWeight: 'bold', margin: '8px 0'}}>{stat.value}</div>
                  <div style={{fontSize: '14px', color: currentTheme.textSecondary}}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Gráficos */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px'}}>
              <div style={styles.card}>
                <h3 style={{marginBottom: '16px'}}>Estado de Solicitudes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {dashboardData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <h3 style={{marginBottom: '16px'}}>Empleados por Departamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill={currentTheme.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Empleados */}
        {activeTab === 'employees' && (
          <div style={{display: 'grid', gap: '24px'}}>
            {/* Formulario */}
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>
                {employeeForm.id ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    style={styles.input}
                    placeholder="Nombre completo"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    style={styles.input}
                    placeholder="email@empresa.com"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={styles.input}
                    placeholder="+34 600 000 000"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Departamento
                  </label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Soporte">Soporte</option>
                    <option value="Programación">Programación</option>
                    <option value="Booking">Booking</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Posición
                  </label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    style={styles.input}
                    placeholder="Cargo o posición"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Días de vacaciones
                  </label>
                  <input
                    type="number"
                    value={employeeForm.totalVacationDays}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, totalVacationDays: parseInt(e.target.value) }))}
                    style={styles.input}
                    min="1"
                    max="365"
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Fecha de alta
                  </label>
                  <input
                    type="date"
                    value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Fecha de baja
                  </label>
                  <input
                    type="date"
                    value={employeeForm.endDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, endDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={{marginTop: '20px', display: 'flex', gap: '12px'}}>
                <button onClick={handleEmployeeSubmit} style={styles.button}>
                  <Save size={16} />
                  {employeeForm.id ? 'Actualizar' : 'Crear'} Empleado
                </button>
                {employeeForm.id && (
                  <button 
                    onClick={resetEmployeeForm}
                    style={{...styles.button, backgroundColor: currentTheme.textSecondary}}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div style={styles.card}>
              <div style={{display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
                <div style={{flex: '1', minWidth: '200px'}}>
                  <input
                    type="text"
                    placeholder="Buscar empleados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <select
                  value={filters.department || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Todos los departamentos</option>
                  <option value="Soporte">Soporte</option>
                  <option value="Programación">Programación</option>
                  <option value="Booking">Booking</option>
                  <option value="Administración">Administración</option>
                </select>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>

            {/* Lista de empleados */}
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Empleados ({filteredEmployees.length})</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px'}}>
                {filteredEmployees.map(employee => {
                  const usedDays = employee.usedVacationDays[selectedYear] || 0;
                  const remainingDays = employee.totalVacationDays - usedDays;
                  const isActive = isEmployeeActive(employee);

                  return (
                    <div
                      key={employee.id}
                      style={{
                        ...styles.card,
                        margin: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        ':hover': { transform: 'translateY(-2px)' }
                      }}
                      onClick={() => setEmployeeForm(employee)}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600'}}>{employee.name}</h4>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: isActive ? currentTheme.success : currentTheme.danger,
                          color: 'white'
                        }}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div style={{fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <Mail size={14} />
                          {employee.email}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px'}}>
                          <Building size={14} />
                          {employee.department || 'Sin departamento'}
                        </div>
                      </div>
                      
                      <div style={{marginTop: '12px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px'}}>
                          <span>Días restantes {selectedYear}</span>
                          <span>{remainingDays} / {employee.totalVacationDays}</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: currentTheme.border,
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(usedDays / employee.totalVacationDays) * 100}%`,
                            height: '100%',
                            backgroundColor: currentTheme.primary,
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vacaciones */}
        {activeTab === 'vacations' && (
          <div style={{display: 'grid', gap: '24px'}}>
            {/* Formulario de vacaciones */}
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>
                {vacationForm.id ? 'Editar Vacaciones' : 'Nueva Solicitud'}
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Empleado
                  </label>
                  <select
                    value={vacationForm.employeeId}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp)).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Tipo
                  </label>
                  <select
                    value={vacationForm.type}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, type: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="annual">Vacaciones anuales</option>
                    <option value="sick">Baja médica</option>
                    <option value="personal">Asuntos personales</option>
                    <option value="maternity">Maternidad/Paternidad</option>
                  </select>
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Año
                  </label>
                  <select
                    value={vacationForm.year}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    style={styles.input}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Estado
                  </label>
                  <select
                    value={vacationForm.status}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, status: e.target.value }))}
                    style={styles.input}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
                
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500'}}>
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={vacationForm.reason}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, reason: e.target.value }))}
                    style={styles.input}
                    placeholder="Descripción del motivo..."
                  />
                </div>
              </div>
              
              <div style={{marginTop: '20px', display: 'flex', gap: '12px'}}>
                <button onClick={handleVacationSubmit} style={styles.button}>
                  <Save size={16} />
                  {vacationForm.id ? 'Actualizar' : 'Crear'} Solicitud
                </button>
                {vacationForm.id && (
                  <button 
                    onClick={resetVacationForm}
                    style={{...styles.button, backgroundColor: currentTheme.textSecondary}}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Filtros para vacaciones */}
            <div style={styles.card}>
              <div style={{display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
                <input
                  type="text"
                  placeholder="Buscar por empleado o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{...styles.input, flex: '1', minWidth: '200px'}}
                />
                <select
                  value={filters.year || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Todos los años</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <select
                  value={filters.vacationStatus || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vacationStatus: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="rejected">Rechazadas</option>
                </select>
              </div>
            </div>

            {/* Lista de vacaciones */}
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Solicitudes ({filteredVacations.length})</h3>
              <div style={{display: 'grid', gap: '12px'}}>
                {filteredVacations.map(vacation => {
                  const employee = employees.find(e => e.id === vacation.employeeId);
                  const statusColors = {
                    pending: currentTheme.warning,
                    approved: currentTheme.success,
                    rejected: currentTheme.danger
                  };

                  return (
                    <div
                      key={vacation.id}
                      style={{
                        border: `1px solid ${currentTheme.border}`,
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: currentTheme.cardBg,
                        borderLeft: `4px solid ${statusColors[vacation.status]}`
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div>
                          <h4 style={{margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600'}}>
                            {employee?.name || 'Empleado eliminado'}
                          </h4>
                          <p style={{margin: '4px 0', fontSize: '14px', color: currentTheme.textSecondary}}>
                            {new Date(vacation.startDate).toLocaleDateString('es-ES')} - {new Date(vacation.endDate).toLocaleDateString('es-ES')}
                          </p>
                          <p style={{margin: '4px 0', fontSize: '14px', color: currentTheme.primary, fontWeight: '500'}}>
                            {vacation.days} días laborables • {vacation.type}
                          </p>
                          {vacation.reason && (
                            <p style={{margin: '4px 0', fontSize: '14px', color: currentTheme.textSecondary}}>
                              {vacation.reason}
                            </p>
                          )}
                        </div>
                        
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: statusColors[vacation.status],
                            color: 'white'
                          }}>
                            {vacation.status === 'pending' ? 'Pendiente' :
                             vacation.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                          </span>
                          
                          {vacation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveVacation(vacation.id, true)}
                                style={{
                                  ...styles.button,
                                  backgroundColor: currentTheme.success,
                                  padding: '6px 8px'
                                }}
                                title="Aprobar"
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                onClick={() => approveVacation(vacation.id, false)}
                                style={{
                                  ...styles.button,
                                  backgroundColor: currentTheme.danger,
                                  padding: '6px 8px'
                                }}
                                title="Rechazar"
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => setVacationForm(vacation)}
                            style={{
                              ...styles.button,
                              backgroundColor: currentTheme.textSecondary,
                              padding: '6px 8px'
                            }}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Días Festivos */}
        {activeTab === 'holidays' && (
          <div style={{display: 'grid', gap: '24px'}}>
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Gestión de Días Festivos</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                <input
                  type="text"
                  placeholder="Nombre del festivo"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                  style={styles.input}
                />
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                  style={styles.input}
                />
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, type: e.target.value }))}
                  style={styles.input}
                >
                  <option value="national">Nacional</option>
                  <option value="regional">Regional</option>
                  <option value="local">Local</option>
                  <option value="company">Empresa</option>
                </select>
                <button
                  onClick={async () => {
                    if (!holidayForm.name || !holidayForm.date) return;
                    const holiday = {
                      ...holidayForm,
                      id: holidayForm.id || Date.now()
                    };
                    await saveToAdvancedDB('holidays', holiday);
                    if (holidayForm.id) {
                      setHolidays(prev => prev.map(h => h.id === holidayForm.id ? holiday : h));
                    } else {
                      setHolidays(prev => [...prev, holiday]);
                    }
                    setHolidayForm({ id: null, name: '', date: '', type: 'national', recurring: false });
                    showAlert('holidays', 'Día festivo guardado', 'success');
                  }}
                  style={styles.button}
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Días Festivos Configurados</h3>
              <div style={{display: 'grid', gap: '8px'}}>
                {holidays
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(holiday => (
                    <div
                      key={holiday.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: `1px solid ${currentTheme.border}`,
                        borderRadius: '6px',
                        backgroundColor: currentTheme.cardBg
                      }}
                    >
                      <div>
                        <strong>{holiday.name}</strong>
                        <span style={{marginLeft: '12px', color: currentTheme.textSecondary}}>
                          {new Date(holiday.date).toLocaleDateString('es-ES')} • {holiday.type}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteFromAdvancedDB('holidays', holiday.id);
                          setHolidays(prev => prev.filter(h => h.id !== holiday.id));
                          showAlert('holidays', 'Día festivo eliminado', 'success');
                        }}
                        style={{
                          ...styles.button,
                          backgroundColor: currentTheme.danger,
                          padding: '6px 8px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Restricciones */}
        {activeTab === 'restrictions' && (
          <div style={{display: 'grid', gap: '24px'}}>
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Restricciones de Vacaciones</h3>
              <p style={{color: currentTheme.textSecondary, marginBottom: '16px'}}>
                Configure qué empleados no pueden estar de vacaciones al mismo tiempo.
              </p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                <select
                  value={restrictionForm.employee1Id}
                  onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee1Id: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Primer empleado</option>
                  {employees.filter(emp => isEmployeeActive(emp)).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                
                <select
                  value={restrictionForm.employee2Id}
                  onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee2Id: e.target.value }))}
                  style={styles.input}
                >
                  <option value="">Segundo empleado</option>
                  {employees
                    .filter(emp => isEmployeeActive(emp) && emp.id !== parseInt(restrictionForm.employee1Id))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>
                
                <select
                  value={restrictionForm.priority}
                  onChange={(e) => setRestrictionForm(prev => ({ ...prev, priority: e.target.value }))}
                  style={styles.input}
                >
                  <option value="low">Prioridad Baja</option>
                  <option value="medium">Prioridad Media</option>
                  <option value="high">Prioridad Alta</option>
                  <option value="critical">Crítica</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Motivo de la restricción"
                  value={restrictionForm.reason}
                  onChange={(e) => setRestrictionForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={styles.input}
                />
                
                <button
                  onClick={async () => {
                    if (!restrictionForm.employee1Id || !restrictionForm.employee2Id) return;
                    const restriction = {
                      ...restrictionForm,
                      id: restrictionForm.id || Date.now(),
                      employee1Id: parseInt(restrictionForm.employee1Id),
                      employee2Id: parseInt(restrictionForm.employee2Id)
                    };
                    await saveToAdvancedDB('restrictions', restriction);
                    if (restrictionForm.id) {
                      setRestrictions(prev => prev.map(r => r.id === restrictionForm.id ? restriction : r));
                    } else {
                      setRestrictions(prev => [...prev, restriction]);
                    }
                    setRestrictionForm({ id: null, employee1Id: '', employee2Id: '', reason: '', priority: 'medium' });
                    showAlert('restrictions', 'Restricción guardada', 'success');
                  }}
                  style={styles.button}
                >
                  <Save size={16} />
                  Guardar
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>Restricciones Activas</h3>
              <div style={{display: 'grid', gap: '12px'}}>
                {restrictions.map(restriction => {
                  const emp1 = employees.find(e => e.id === restriction.employee1Id);
                  const emp2 = employees.find(e => e.id === restriction.employee2Id);
                  const priorityColors = {
                    low: currentTheme.textSecondary,
                    medium: currentTheme.warning,
                    high: '#f97316',
                    critical: currentTheme.danger
                  };

                  return (
                    <div
                      key={restriction.id}
                      style={{
                        border: `1px solid ${currentTheme.border}`,
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: currentTheme.cardBg,
                        borderLeft: `4px solid ${priorityColors[restriction.priority]}`
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div>
                          <h4 style={{margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <AlertTriangle size={18} color={priorityColors[restriction.priority]} />
                            {emp1?.name || 'Empleado eliminado'} ↔ {emp2?.name || 'Empleado eliminado'}
                          </h4>
                          <p style={{margin: '4px 0', fontSize: '14px', color: currentTheme.textSecondary}}>
                            {restriction.reason || 'Sin motivo especificado'}
                          </p>
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: priorityColors[restriction.priority],
                            color: 'white'
                          }}>
                            {restriction.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={() => setRestrictionForm(restriction)}
                            style={{
                              ...styles.button,
                              backgroundColor: currentTheme.textSecondary,
                              padding: '6px 8px'
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              await deleteFromAdvancedDB('restrictions', restriction.id);
                              setRestrictions(prev => prev.filter(r => r.id !== restriction.id));
                              showAlert('restrictions', 'Restricción eliminada', 'success');
                            }}
                            style={{
                              ...styles.button,
                              backgroundColor: currentTheme.danger,
                              padding: '6px 8px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reportes */}
        {activeTab === 'reports' && (
          <div style={{display: 'grid', gap: '24px'}}>
            <div style={styles.card}>
              <h3 style={{marginBottom: '16px'}}>📊 Reportes y Análisis</h3>
              <p style={{color: currentTheme.textSecondary}}>
                Análisis detallado del uso de vacaciones y tendencias del equipo.
              </p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
              <div style={styles.card}>
                <h4 style={{marginBottom: '16px'}}>Uso por Departamento</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardData.departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usedDays" fill={currentTheme.primary} name="Días Usados" />
                    <Bar dataKey="totalDays" fill={currentTheme.textSecondary} name="Días Totales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <h4 style={{marginBottom: '16px'}}>Estado de Solicitudes</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData.statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {dashboardData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <h4 style={{marginBottom: '16px'}}>Resumen Ejecutivo</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: currentTheme.primary}}>
                    {Math.round((vacations.filter(v => v.status === 'approved').length / Math.max(vacations.length, 1)) * 100)}%
                  </div>
                  <div style={{fontSize: '14px', color: currentTheme.textSecondary}}>Tasa de Aprobación</div>
                </div>
                
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: currentTheme.success}}>
                    {Math.round(employees.reduce((sum, emp) => sum + (emp.usedVacationDays[selectedYear] || 0), 0) / Math.max(employees.length, 1))}
                  </div>
                  <div style={{fontSize: '14px', color: currentTheme.textSecondary}}>Días Promedio por Empleado</div>
                </div>
                
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: currentTheme.warning}}>
                    {vacations.filter(v => v.status === 'pending').length}
                  </div>
                  <div style={{fontSize: '14px', color: currentTheme.textSecondary}}>Solicitudes Pendientes</div>
                </div>
                
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '32px', fontWeight: 'bold', color: currentTheme.primary}}>
                    {restrictions.length}
                  </div>
                  <div style={{fontSize: '14px', color: currentTheme.textSecondary}}>Restricciones Activas</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdvancedVacationManager;
