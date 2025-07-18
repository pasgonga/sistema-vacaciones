import React, { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, CheckCircle, Clock, AlertTriangle, TrendingUp, Bell, BellOff, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const VacationManager = () => {
  // Estados principales
  const [employees, setEmployees] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Estados para formularios
  const [employeeForm, setEmployeeForm] = useState({
    id: null,
    name: '',
    totalVacationDays: 22,
    startDate: '',
    endDate: '',
    department: ''
  });

  const [vacationForm, setVacationForm] = useState({
    id: null,
    employeeId: '',
    year: 2025,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [restrictionForm, setRestrictionForm] = useState({
    id: null,
    employee1Id: '',
    employee2Id: '',
    reason: ''
  });

  // Estilos CSS inline
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '24px',
      paddingBottom: '24px'
    },
    headerTitle: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0,
      marginBottom: '8px'
    },
    headerSubtitle: {
      color: '#6b7280',
      margin: 0
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    buttonPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    buttonSuccess: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    nav: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb'
    },
    navContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      gap: '32px'
    },
    navTab: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 12px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      borderBottom: '2px solid transparent',
      transition: 'all 0.2s'
    },
    navTabActive: {
      color: '#3b82f6',
      borderBottomColor: '#3b82f6'
    },
    main: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 24px'
    },
    alert: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontWeight: '500',
      fontSize: '14px'
    },
    alertSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    alertError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    alertWarning: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '16px'
    },
    grid: {
      display: 'grid',
      gap: '24px'
    },
    gridCols2: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
    },
    gridCols3: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
    },
    gridCols5: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box'
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    statIcon: {
      padding: '12px',
      borderRadius: '8px',
      color: 'white',
      marginBottom: '12px',
      display: 'inline-block'
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '8px 0'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500'
    },
    employeeCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: 'white',
      transition: 'box-shadow 0.2s'
    },
    employeeCardHover: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgeGreen: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    badgeRed: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '12px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      transition: 'width 0.3s ease'
    },
    vacationItem: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'white',
      borderLeft: '4px solid #fbbf24'
    },
    restrictionItem: {
      border: '1px solid #fbbf24',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: '#fffbeb'
    },
    loadingContainer: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    }
  };

  // CSS para animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .hover-shadow:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .button-hover:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Base de datos IndexedDB
  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VacationManagerDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('employees')) {
          const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
          employeeStore.createIndex('name', 'name', { unique: false });
          employeeStore.createIndex('department', 'department', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('vacations')) {
          const vacationStore = db.createObjectStore('vacations', { keyPath: 'id' });
          vacationStore.createIndex('employeeId', 'employeeId', { unique: false });
          vacationStore.createIndex('year', 'year', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('restrictions')) {
          db.createObjectStore('restrictions', { keyPath: 'id' });
        }
      };
    });
  };

  // Funciones de base de datos
  const saveToDB = async (storeName, data) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      for (const item of data) {
        await store.put(item);
      }
    } else {
      await store.put(data);
    }
    
    return transaction.complete;
  };

  const loadFromDB = async (storeName) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const deleteFromDB = async (storeName, id) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.delete(id);
    return transaction.complete;
  };

  // Cargar datos al inicializar
  useEffect(() => {
    const loadData = async () => {
      try {
        if ('Notification' in window) {
          setNotificationPermission(Notification.permission);
        }

        const [employeesData, vacationsData, restrictionsData] = await Promise.all([
          loadFromDB('employees'),
          loadFromDB('vacations'),
          loadFromDB('restrictions')
        ]);

        if (employeesData.length === 0) {
          const initialEmployees = [
            "SANCHEZ MIÑAMBRES M INMACULADA",
            "ESCOBEDO FERNANDEZ M ANGELA", 
            "LADRON ESTEBAN RUBEN",
            "MESEGUER CANOVAS JOSE CARLOS",
            "SALGADO GONZALEZ JOSE"
          ].map((name, index) => ({
            id: Date.now() + index,
            name,
            totalVacationDays: 22,
            usedVacationDays: { 2024: Math.floor(Math.random() * 10), 2025: Math.floor(Math.random() * 5), 2026: 0 },
            startDate: new Date(2023, index % 12, 1).toISOString().split('T')[0],
            endDate: null,
            department: ['Soporte', 'Programacción', 'Booking', 'Administración'][index % 5]
          }));

          await saveToDB('employees', initialEmployees);
          setEmployees(initialEmployees);
        } else {
          setEmployees(employeesData);
        }

        setVacations(vacationsData);
        setRestrictions(restrictionsData);
      } catch (error) {
        showAlert('general', 'Error cargando datos: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sistema de notificaciones
  useEffect(() => {
    if (notificationsEnabled && employees.length > 0) {
      checkNotifications();
      const interval = setInterval(checkNotifications, 60000 * 60);
      return () => clearInterval(interval);
    }
  }, [notificationsEnabled, employees, vacations]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        showAlert('general', 'Notificaciones activadas correctamente', 'success');
      }
    }
  };

  const checkNotifications = () => {
    if (notificationPermission !== 'granted') return;

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingVacations = vacations.filter(vacation => {
      const startDate = new Date(vacation.startDate);
      return startDate >= today && startDate <= nextWeek;
    });

    upcomingVacations.forEach(vacation => {
      const employee = employees.find(emp => emp.id === vacation.employeeId);
      const startDate = new Date(vacation.startDate).toLocaleDateString('es-ES');
      
      new Notification('Vacaciones Próximas', {
        body: `${employee?.name} comienza vacaciones el ${startDate}`,
        icon: '🏖️'
      });
    });

    const activeEmployees = employees.filter(emp => isEmployeeActive(emp));
    activeEmployees.forEach(employee => {
      const usedDays = employee.usedVacationDays[2025] || 0;
      const remainingDays = employee.totalVacationDays - usedDays;
      const usagePercentage = (usedDays / employee.totalVacationDays) * 100;

      if (usagePercentage < 25 && remainingDays > 15) {
        new Notification('Días de Vacaciones Sin Usar', {
          body: `${employee.name} tiene ${remainingDays} días sin usar (${Math.round(usagePercentage)}% usado)`,
          icon: '⏰'
        });
      }
    });
  };

  // Utilidades
  const showAlert = (section, message, type = 'info') => {
    setAlerts(prev => ({ ...prev, [section]: { message, type } }));
    setTimeout(() => {
      setAlerts(prev => ({ ...prev, [section]: null }));
    }, 5000);
  };

  const calculateWorkingDays = (startDate, endDate) => {
    let count = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const isEmployeeActive = (employee) => {
    if (!employee.endDate) return true;
    return new Date(employee.endDate) > new Date();
  };

  const calculateSeniority = (startDate, endDate = null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    
    let totalMonths = years * 12 + months;
    if (end.getDate() < start.getDate()) totalMonths--;
    
    const finalYears = Math.floor(totalMonths / 12);
    const finalMonths = totalMonths % 12;
    
    if (finalYears > 0) {
      return `${finalYears} año${finalYears > 1 ? 's' : ''}${finalMonths > 0 ? ` y ${finalMonths} mes${finalMonths > 1 ? 'es' : ''}` : ''}`;
    } else if (finalMonths > 0) {
      return `${finalMonths} mes${finalMonths > 1 ? 'es' : ''}`;
    } else {
      return 'Menos de 1 mes';
    }
  };

  // Funciones de empleados
  const handleEmployeeSubmit = async () => {
    if (!employeeForm.name.trim()) {
      showAlert('employees', 'El nombre es obligatorio', 'error');
      return;
    }

    if (!employeeForm.startDate) {
      showAlert('employees', 'La fecha de alta es obligatoria', 'error');
      return;
    }

    const existingEmployee = employees.find(emp => 
      emp.name.toLowerCase() === employeeForm.name.toLowerCase() && emp.id !== employeeForm.id
    );

    if (existingEmployee) {
      showAlert('employees', 'Ya existe un empleado con este nombre', 'error');
      return;
    }

    try {
      const employeeData = {
        ...employeeForm,
        id: employeeForm.id || Date.now(),
        usedVacationDays: employeeForm.id 
          ? employees.find(e => e.id === employeeForm.id)?.usedVacationDays || { 2024: 0, 2025: 0, 2026: 0 }
          : { 2024: 0, 2025: 0, 2026: 0 }
      };

      await saveToDB('employees', employeeData);

      if (employeeForm.id) {
        setEmployees(prev => prev.map(emp => emp.id === employeeForm.id ? employeeData : emp));
        showAlert('employees', 'Empleado actualizado correctamente', 'success');
      } else {
        setEmployees(prev => [...prev, employeeData]);
        showAlert('employees', 'Empleado agregado correctamente', 'success');
      }

      setEmployeeForm({ id: null, name: '', totalVacationDays: 22, startDate: '', endDate: '', department: '' });
    } catch (error) {
      showAlert('employees', 'Error guardando empleado: ' + error.message, 'error');
    }
  };

  const editEmployee = (employee) => {
    setEmployeeForm(employee);
  };

  const deleteEmployee = async (employeeId) => {
    if (!window.confirm('¿Está seguro de eliminar este empleado? Se borrarán todas sus vacaciones y restricciones.')) return;

    try {
      await deleteFromDB('employees', employeeId);
      
      const employeeVacations = vacations.filter(v => v.employeeId === employeeId);
      for (const vacation of employeeVacations) {
        await deleteFromDB('vacations', vacation.id);
      }
      
      const employeeRestrictions = restrictions.filter(r => 
        r.employee1Id === employeeId || r.employee2Id === employeeId
      );
      for (const restriction of employeeRestrictions) {
        await deleteFromDB('restrictions', restriction.id);
      }

      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      setVacations(prev => prev.filter(v => v.employeeId !== employeeId));
      setRestrictions(prev => prev.filter(r => 
        r.employee1Id !== employeeId && r.employee2Id !== employeeId
      ));

      showAlert('employees', 'Empleado eliminado correctamente', 'success');
    } catch (error) {
      showAlert('employees', 'Error eliminando empleado: ' + error.message, 'error');
    }
  };

  // Funciones de restricciones
  const handleRestrictionSubmit = async () => {
    if (!restrictionForm.employee1Id || !restrictionForm.employee2Id) {
      showAlert('restrictions', 'Debe seleccionar ambos empleados', 'error');
      return;
    }

    if (restrictionForm.employee1Id === restrictionForm.employee2Id) {
      showAlert('restrictions', 'No puede crear una restricción entre el mismo empleado', 'error');
      return;
    }

    const existingRestriction = restrictions.find(r =>
      (r.employee1Id === parseInt(restrictionForm.employee1Id) && r.employee2Id === parseInt(restrictionForm.employee2Id)) ||
      (r.employee1Id === parseInt(restrictionForm.employee2Id) && r.employee2Id === parseInt(restrictionForm.employee1Id))
    );

    if (existingRestriction && !restrictionForm.id) {
      showAlert('restrictions', 'Esta restricción ya existe', 'error');
      return;
    }

    try {
      const restrictionData = {
        ...restrictionForm,
        id: restrictionForm.id || Date.now(),
        employee1Id: parseInt(restrictionForm.employee1Id),
        employee2Id: parseInt(restrictionForm.employee2Id),
        reason: restrictionForm.reason || 'Sin motivo especificado'
      };

      await saveToDB('restrictions', restrictionData);

      if (restrictionForm.id) {
        setRestrictions(prev => prev.map(r => r.id === restrictionForm.id ? restrictionData : r));
        showAlert('restrictions', 'Restricción actualizada correctamente', 'success');
      } else {
        setRestrictions(prev => [...prev, restrictionData]);
        showAlert('restrictions', 'Restricción agregada correctamente', 'success');
      }

      setRestrictionForm({ id: null, employee1Id: '', employee2Id: '', reason: '' });
    } catch (error) {
      showAlert('restrictions', 'Error guardando restricción: ' + error.message, 'error');
    }
  };

  const editRestriction = (restriction) => {
    setRestrictionForm(restriction);
  };

  const deleteRestriction = async (restrictionId) => {
    if (!window.confirm('¿Está seguro de eliminar esta restricción?')) return;

    try {
      await deleteFromDB('restrictions', restrictionId);
      setRestrictions(prev => prev.filter(r => r.id !== restrictionId));
      showAlert('restrictions', 'Restricción eliminada correctamente', 'success');
    } catch (error) {
      showAlert('restrictions', 'Error eliminando restricción: ' + error.message, 'error');
    }
  };

  const checkVacationConflicts = (employeeId, startDate, endDate, excludeVacationId = null) => {
    const employeeRestrictions = restrictions.filter(r =>
      r.employee1Id === employeeId || r.employee2Id === employeeId
    );

    for (const restriction of employeeRestrictions) {
      const otherEmployeeId = restriction.employee1Id === employeeId ?
        restriction.employee2Id : restriction.employee1Id;

      const conflictingVacations = vacations.filter(vacation => {
        if (vacation.employeeId !== otherEmployeeId) return false;
        if (excludeVacationId && vacation.id === excludeVacationId) return false;

        const vacStart = new Date(vacation.startDate);
        const vacEnd = new Date(vacation.endDate);

        return (startDate <= vacEnd && endDate >= vacStart);
      });

      if (conflictingVacations.length > 0) {
        const otherEmployee = employees.find(emp => emp.id === otherEmployeeId);
        return `${otherEmployee?.name || 'Desconocido'} ya tiene vacaciones en fechas que se superponen`;
      }
    }

    return null;
  };

  // Función de exportación a CSV
  const exportToCSV = () => {
    try {
      let csvContent = '';

      csvContent += 'EMPLEADOS\n';
      csvContent += 'ID,Nombre,Departamento,Días Totales,Días Usados 2024,Días Usados 2025,Días Usados 2026,Días Restantes 2025,Fecha Alta,Fecha Baja,Estado,Antigüedad\n';
      
      employees.forEach(emp => {
        const usedDays2025 = emp.usedVacationDays[2025] || 0;
        const remainingDays = emp.totalVacationDays - usedDays2025;
        const isActive = isEmployeeActive(emp);
        const seniority = calculateSeniority(emp.startDate, emp.endDate);
        
        csvContent += `${emp.id},"${emp.name}","${emp.department || 'Sin asignar'}",${emp.totalVacationDays},${emp.usedVacationDays[2024] || 0},${usedDays2025},${emp.usedVacationDays[2026] || 0},${remainingDays},"${emp.startDate}","${emp.endDate || ''}","${isActive ? 'Activo' : 'Inactivo'}","${seniority}"\n`;
      });

      csvContent += '\nVACACIONES\n';
      csvContent += 'ID,Empleado,Departamento,Año,Fecha Inicio,Fecha Fin,Días Laborables,Motivo,Estado\n';
      
      vacations.forEach(vac => {
        const employee = employees.find(emp => emp.id === vac.employeeId);
        csvContent += `${vac.id},"${employee?.name || 'Empleado eliminado'}","${employee?.department || 'Sin asignar'}",${vac.year},"${vac.startDate}","${vac.endDate}",${vac.days},"${vac.reason || 'Sin motivo'}","${vac.approved ? 'Aprobada' : 'Pendiente'}"\n`;
      });

      csvContent += '\nRESTRICCIONES\n';
      csvContent += 'ID,Empleado 1,Empleado 2,Motivo\n';
      
      restrictions.forEach(rest => {
        const emp1 = employees.find(emp => emp.id === rest.employee1Id);
        const emp2 = employees.find(emp => emp.id === rest.employee2Id);
        csvContent += `${rest.id},"${emp1?.name || 'Empleado eliminado'}","${emp2?.name || 'Empleado eliminado'}","${rest.reason}"\n`;
      });

      csvContent += '\nESTADÍSTICAS\n';
      csvContent += 'Métrica,Valor\n';
      csvContent += `Total Empleados,${employees.length}\n`;
      csvContent += `Empleados Activos,${employees.filter(emp => isEmployeeActive(emp)).length}\n`;
      csvContent += `Total Días Vacaciones 2025,${employees.reduce((sum, emp) => sum + emp.totalVacationDays, 0)}\n`;
      csvContent += `Días Usados 2025,${employees.reduce((sum, emp) => sum + (emp.usedVacationDays[2025] || 0), 0)}\n`;
      csvContent += `Vacaciones Pendientes 2025,${vacations.filter(v => new Date(v.startDate) > new Date() && v.year === 2025).length}\n`;
      csvContent += `Total Restricciones,${restrictions.length}\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gestion_vacaciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert('general', 'Archivo CSV exportado correctamente', 'success');
    } catch (error) {
      showAlert('general', 'Error exportando archivo: ' + error.message, 'error');
    }
  };

  // Funciones de vacaciones
  const handleVacationSubmit = async () => {
    if (!vacationForm.employeeId || !vacationForm.startDate || !vacationForm.endDate) {
      showAlert('vacations', 'Todos los campos son obligatorios', 'error');
      return;
    }

    const startDate = new Date(vacationForm.startDate);
    const endDate = new Date(vacationForm.endDate);

    if (startDate >= endDate) {
      showAlert('vacations', 'La fecha de fin debe ser posterior al inicio', 'error');
      return;
    }

    const workingDays = calculateWorkingDays(startDate, endDate);
    const employee = employees.find(emp => emp.id === parseInt(vacationForm.employeeId));
    const usedDays = employee.usedVacationDays[vacationForm.year] || 0;
    const currentVacation = vacationForm.id ? vacations.find(v => v.id === vacationForm.id) : null;
    const previousDays = currentVacation ? currentVacation.days : 0;
    const availableDays = employee.totalVacationDays - usedDays + previousDays;

    if (workingDays > availableDays) {
      showAlert('vacations', `El empleado solo tiene ${availableDays} días disponibles`, 'error');
      return;
    }

    const conflict = checkVacationConflicts(parseInt(vacationForm.employeeId), startDate, endDate, vacationForm.id);
    if (conflict) {
      showAlert('vacations', `Conflicto detectado: ${conflict}`, 'warning');
      if (!window.confirm('¿Desea continuar de todos modos?')) return;
    }

    try {
      const vacationData = {
        ...vacationForm,
        id: vacationForm.id || Date.now(),
        employeeId: parseInt(vacationForm.employeeId),
        days: workingDays,
        approved: true
      };

      await saveToDB('vacations', vacationData);

      const updatedEmployee = {
        ...employee,
        usedVacationDays: {
          ...employee.usedVacationDays,
          [vacationForm.year]: usedDays - previousDays + workingDays
        }
      };

      await saveToDB('employees', updatedEmployee);

      if (vacationForm.id) {
        setVacations(prev => prev.map(v => v.id === vacationForm.id ? vacationData : v));
        showAlert('vacations', 'Vacaciones actualizadas correctamente', 'success');
      } else {
        setVacations(prev => [...prev, vacationData]);
        showAlert('vacations', 'Vacaciones solicitadas correctamente', 'success');
      }

      setEmployees(prev => prev.map(emp => emp.id === employee.id ? updatedEmployee : emp));
      setVacationForm({ id: null, employeeId: '', year: 2025, startDate: '', endDate: '', reason: '' });
    } catch (error) {
      showAlert('vacations', 'Error guardando vacaciones: ' + error.message, 'error');
    }
  };

  const deleteVacation = async (vacationId) => {
    if (!window.confirm('¿Está seguro de eliminar estas vacaciones?')) return;

    try {
      const vacation = vacations.find(v => v.id === vacationId);
      const employee = employees.find(emp => emp.id === vacation.employeeId);

      await deleteFromDB('vacations', vacationId);

      const updatedEmployee = {
        ...employee,
        usedVacationDays: {
          ...employee.usedVacationDays,
          [vacation.year]: (employee.usedVacationDays[vacation.year] || 0) - vacation.days
        }
      };

      await saveToDB('employees', updatedEmployee);

      setVacations(prev => prev.filter(v => v.id !== vacationId));
      setEmployees(prev => prev.map(emp => emp.id === employee.id ? updatedEmployee : emp));

      showAlert('vacations', 'Vacaciones eliminadas correctamente', 'success');
    } catch (error) {
      showAlert('vacations', 'Error eliminando vacaciones: ' + error.message, 'error');
    }
  };

  // Datos para gráficos
  const getDashboardData = () => {
    const activeEmployees = employees.filter(emp => isEmployeeActive(emp));
    
    const departmentData = activeEmployees.reduce((acc, emp) => {
      const dept = emp.department || 'Sin departamento';
      if (!acc[dept]) {
        acc[dept] = { name: dept, employees: 0, totalDays: 0, usedDays: 0 };
      }
      acc[dept].employees++;
      acc[dept].totalDays += emp.totalVacationDays;
      acc[dept].usedDays += (emp.usedVacationDays[2025] || 0);
      return acc;
    }, {});

    const monthlyUsage = vacations
      .filter(v => v.year === 2025)
      .reduce((acc, vacation) => {
        const startDate = new Date(vacation.startDate);
        const month = startDate.toLocaleString('es-ES', { month: 'long' });
        if (!acc[month]) acc[month] = 0;
        acc[month] += vacation.days;
        return acc;
      }, {});

    return {
      departmentData: Object.values(departmentData),
      monthlyData: Object.entries(monthlyUsage).map(([month, days]) => ({ month, days })),
      totalStats: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalVacationDays: activeEmployees.reduce((sum, emp) => sum + emp.totalVacationDays, 0),
        usedVacationDays: activeEmployees.reduce((sum, emp) => sum + (emp.usedVacationDays[2025] || 0), 0),
        pendingVacations: vacations.filter(v => new Date(v.startDate) > new Date() && v.year === 2025).length
      }
    };
  };

  const dashboardData = getDashboardData();
  const COLORS = ['#3b82f6', '#fbbf24', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6b7280' }}>Cargando sistema de vacaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.headerTitle}>🏖️ Gestión de Vacaciones</h1>
            <p style={styles.headerSubtitle}>Sistema completo para administrar las vacaciones de tu equipo</p>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => {
                if (notificationPermission === 'granted') {
                  setNotificationsEnabled(!notificationsEnabled);
                  showAlert('general', notificationsEnabled ? 'Notificaciones desactivadas' : 'Notificaciones activadas', 'success');
                } else {
                  requestNotificationPermission();
                }
              }}
              style={{
                ...styles.button,
                ...(notificationsEnabled ? { backgroundColor: '#10b981', color: 'white' } : styles.buttonSecondary)
              }}
              className="button-hover"
              title={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            >
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span>{notificationsEnabled ? 'Notificaciones ON' : 'Notificaciones OFF'}</span>
            </button>
            
            <button
              onClick={exportToCSV}
              style={{...styles.button, ...styles.buttonPrimary}}
              className="button-hover"
              title="Exportar a CSV"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar CSV</span>
            </button>
            
            <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} />
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <div style={styles.navContent}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'employees', label: 'Empleados', icon: Users },
            { id: 'vacations', label: 'Vacaciones', icon: Calendar },
            { id: 'restrictions', label: 'Restricciones', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.navTab,
                ...(activeTab === tab.id ? styles.navTabActive : {})
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={styles.main}>
        {alerts.general && (
          <div style={{
            ...styles.alert,
            ...(alerts.general.type === 'error' ? styles.alertError :
                alerts.general.type === 'success' ? styles.alertSuccess :
                styles.alertWarning)
          }}>
            {alerts.general.message}
          </div>
        )}

        {alerts[activeTab] && (
          <div style={{
            ...styles.alert,
            ...(alerts[activeTab].type === 'error' ? styles.alertError :
                alerts[activeTab].type === 'success' ? styles.alertSuccess :
                styles.alertWarning)
          }}>
            {alerts[activeTab].message}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div style={styles.grid}>
            <div style={{...styles.grid, ...styles.gridCols5}}>
              {[
                { label: 'Total Empleados', value: dashboardData.totalStats.totalEmployees, icon: Users, color: '#3b82f6' },
                { label: 'Empleados Activos', value: dashboardData.totalStats.activeEmployees, icon: CheckCircle, color: '#10b981' },
                { label: 'Días Totales 2025', value: dashboardData.totalStats.totalVacationDays, icon: Calendar, color: '#8b5cf6' },
                { label: 'Días Usados 2025', value: dashboardData.totalStats.usedVacationDays, icon: TrendingUp, color: '#fbbf24' },
                { label: 'Vacaciones Pendientes', value: dashboardData.totalStats.pendingVacations, icon: Clock, color: '#ef4444' }
              ].map((stat, index) => (
                <div key={index} style={styles.statCard} className="hover-shadow">
                  <div style={{...styles.statIcon, backgroundColor: stat.color}}>
                    <stat.icon size={24} />
                  </div>
                  <div style={styles.statNumber}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{...styles.grid, ...styles.gridCols2}}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Empleados por Departamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.departmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="employees"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {dashboardData.departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Uso de Vacaciones por Mes (2025)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="days" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Uso de Vacaciones por Departamento</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalDays" fill="#fbbf24" name="Días Totales" />
                  <Bar dataKey="usedDays" fill="#3b82f6" name="Días Usados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                {employeeForm.id ? 'Editar Empleado' : 'Agregar Empleado'}
              </h3>
              <div style={{...styles.grid, ...styles.gridCols2}}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    style={styles.input}
                    placeholder="Nombre completo"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Departamento</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    style={styles.select}
                  >
                    <option value="">Seleccionar departamento</option>
                    <option value="Soporte">Soporte</option>
                    <option value="Programación">Programación</option>
                    <option value="Booking">Booking</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Días de vacaciones anuales</label>
                  <input
                    type="number"
                    value={employeeForm.totalVacationDays}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, totalVacationDays: parseInt(e.target.value) }))}
                    style={styles.input}
                    min="1"
                    max="365"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de alta</label>
                  <input
                    type="date"
                    value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Fecha de baja (opcional)</label>
                  <input
                    type="date"
                    value={employeeForm.endDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, endDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '16px'}}>
                  <button
                    onClick={handleEmployeeSubmit}
                    style={{...styles.button, ...styles.buttonPrimary}}
                    className="button-hover"
                  >
                    {employeeForm.id ? 'Actualizar' : 'Agregar'} Empleado
                  </button>
                  {employeeForm.id && (
                    <button
                      onClick={() => setEmployeeForm({ id: null, name: '', totalVacationDays: 22, startDate: '', endDate: '', department: '' })}
                      style={{...styles.button, ...styles.buttonSecondary}}
                      className="button-hover"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Lista de Empleados</h3>
              <div style={{...styles.grid, ...styles.gridCols3}}>
                {employees.map(employee => {
                  const usedDays2025 = employee.usedVacationDays[2025] || 0;
                  const remainingDays = employee.totalVacationDays - usedDays2025;
                  const usagePercentage = (usedDays2025 / employee.totalVacationDays) * 100;
                  const isActive = isEmployeeActive(employee);

                  return (
                    <div key={employee.id} style={styles.employeeCard} className="hover-shadow">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ fontWeight: '500', color: '#111827', margin: 0 }}>{employee.name}</h4>
                        <span style={{
                          ...styles.badge,
                          ...(isActive ? styles.badgeGreen : styles.badgeRed)
                        }}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                        <p style={{ margin: '8px 0' }}><span style={{ fontWeight: '500' }}>Departamento:</span> {employee.department || 'No asignado'}</p>
                        <p style={{ margin: '8px 0' }}><span style={{ fontWeight: '500' }}>Antigüedad:</span> {calculateSeniority(employee.startDate, employee.endDate)}</p>
                        <p style={{ margin: '8px 0' }}><span style={{ fontWeight: '500' }}>Días restantes 2025:</span> {remainingDays}</p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          <span>Progreso 2025</span>
                          <span>{Math.round(usagePercentage)}%</span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${Math.min(usagePercentage, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => editEmployee(employee)}
                          style={{
                            flex: 1,
                            ...styles.button,
                            ...styles.buttonSecondary,
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                          className="button-hover"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          style={{
                            flex: 1,
                            ...styles.button,
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                          className="button-hover"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vacations' && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                {vacationForm.id ? 'Editar Vacaciones' : 'Solicitar Vacaciones'}
              </h3>
              <div style={{...styles.grid, ...styles.gridCols2}}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Empleado</label>
                  <select
                    value={vacationForm.employeeId}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    style={styles.select}
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Año</label>
                  <select
                    value={vacationForm.year}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    style={styles.select}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de inicio</label>
                  <input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de fin</label>
                  <input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Motivo (opcional)</label>
                  <input
                    type="text"
                    value={vacationForm.reason}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, reason: e.target.value }))}
                    style={styles.input}
                    placeholder="Ej: Vacaciones familiares"
                  />
                </div>
                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '16px'}}>
                  <button
                    onClick={handleVacationSubmit}
                    style={{...styles.button, ...styles.buttonPrimary}}
                    className="button-hover"
                  >
                    {vacationForm.id ? 'Actualizar' : 'Solicitar'} Vacaciones
                  </button>
                  {vacationForm.id && (
                    <button
                      onClick={() => setVacationForm({ id: null, employeeId: '', year: 2025, startDate: '', endDate: '', reason: '' })}
                      style={{...styles.button, ...styles.buttonSecondary}}
                      className="button-hover"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Vacaciones Programadas</h3>
              <div>
                {vacations.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>No hay vacaciones programadas</p>
                ) : (
                  vacations
                    .filter(vacation => vacation.year >= 2025)
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .map(vacation => {
                      const employee = employees.find(emp => emp.id === vacation.employeeId);
                      const startDate = new Date(vacation.startDate).toLocaleDateString('es-ES');
                      const endDate = new Date(vacation.endDate).toLocaleDateString('es-ES');
                      const isPast = new Date(vacation.endDate) < new Date();

                      return (
                        <div key={vacation.id} style={{
                          ...styles.vacationItem,
                          backgroundColor: isPast ? '#f9fafb' : 'white'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontWeight: '500', color: '#111827', margin: '0 0 8px 0' }}>{employee?.name || 'Empleado eliminado'}</h4>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>{startDate} - {endDate} ({vacation.year})</p>
                              <p style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '500', margin: '4px 0' }}>{vacation.days} días laborables</p>
                              {vacation.reason && <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>{vacation.reason}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => setVacationForm(vacation)}
                                style={{
                                  ...styles.button,
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                                className="button-hover"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => deleteVacation(vacation.id)}
                                style={{
                                  ...styles.button,
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '12px',
                                  padding: '6px 12px'
                                }}
                                className="button-hover"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restrictions' && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                {restrictionForm.id ? 'Editar Restricción' : 'Agregar Restricción'}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Las restricciones evitan que dos empleados estén de vacaciones al mismo tiempo.
              </p>
              <div style={{...styles.grid, ...styles.gridCols2}}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Primer Empleado</label>
                  <select
                    value={restrictionForm.employee1Id}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee1Id: e.target.value }))}
                    style={styles.select}
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Segundo Empleado</label>
                  <select
                    value={restrictionForm.employee2Id}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee2Id: e.target.value }))}
                    style={styles.select}
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp) && emp.id !== parseInt(restrictionForm.employee1Id)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Motivo de la restricción</label>
                  <input
                    type="text"
                    value={restrictionForm.reason}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, reason: e.target.value }))}
                    style={styles.input}
                    placeholder="Ej: No pueden estar ambos ausentes al mismo tiempo por requerimientos del proyecto"
                  />
                </div>
                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '16px'}}>
                  <button
                    onClick={handleRestrictionSubmit}
                    style={{...styles.button, ...styles.buttonPrimary}}
                    className="button-hover"
                  >
                    {restrictionForm.id ? 'Actualizar' : 'Agregar'} Restricción
                  </button>
                  {restrictionForm.id && (
                    <button
                      onClick={() => setRestrictionForm({ id: null, employee1Id: '', employee2Id: '', reason: '' })}
                      style={{...styles.button, ...styles.buttonSecondary}}
                      className="button-hover"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Restricciones Activas</h3>
              <div>
                {restrictions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>No hay restricciones configuradas</p>
                ) : (
                  restrictions.map(restriction => {
                    const emp1 = employees.find(emp => emp.id === restriction.employee1Id);
                    const emp2 = employees.find(emp => emp.id === restriction.employee2Id);

                    return (
                      <div key={restriction.id} style={styles.restrictionItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontWeight: '500', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertTriangle color="#f59e0b" size={18} />
                              {emp1?.name || 'Empleado eliminado'} ↔ {emp2?.name || 'Empleado eliminado'}
                            </h4>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>{restriction.reason}</p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                              <span><strong>Departamento 1:</strong> {emp1?.department || 'N/A'}</span>
                              <span><strong>Departamento 2:</strong> {emp2?.department || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => editRestriction(restriction)}
                              style={{
                                ...styles.button,
                                backgroundColor: '#dbeafe',
                                color: '#1d4ed8',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                              className="button-hover"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteRestriction(restriction.id)}
                              style={{
                                ...styles.button,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                fontSize: '12px',
                                padding: '6px 12px'
                              }}
                              className="button-hover"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VacationManager;
