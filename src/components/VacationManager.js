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
            department: ['IT', 'RRHH', 'Marketing', 'Ventas', 'Administración'][index % 5]
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
  const COLORS = ['#385CDB', '#FCCB49', '#E63946', '#F4A261', '#2A9D8F', '#E76F51'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de vacaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏖️ Gestión de Vacaciones</h1>
              <p className="text-gray-600">Sistema completo para administrar las vacaciones de tu equipo</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (notificationPermission === 'granted') {
                    setNotificationsEnabled(!notificationsEnabled);
                    showAlert('general', notificationsEnabled ? 'Notificaciones desactivadas' : 'Notificaciones activadas', 'success');
                  } else {
                    requestNotificationPermission();
                  }
                }}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  notificationsEnabled 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              >
                {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                <span className="ml-2">{notificationsEnabled ? 'Notificaciones ON' : 'Notificaciones OFF'}</span>
              </button>
              
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                title="Exportar a CSV"
              >
                <FileSpreadsheet size={16} />
                <span className="ml-2">Exportar CSV</span>
              </button>
              
              <div className="text-sm text-gray-500">
                <Calendar className="inline mr-2" size={16} />
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'employees', label: 'Empleados', icon: Users },
              { id: 'vacations', label: 'Vacaciones', icon: Calendar },
              { id: 'restrictions', label: 'Restricciones', icon: AlertTriangle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2" size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alerts.general && (
          <div className={`mb-6 p-4 rounded-lg ${
            alerts.general.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            alerts.general.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {alerts.general.message}
          </div>
        )}

        {alerts[activeTab] && (
          <div className={`mb-6 p-4 rounded-lg ${
            alerts[activeTab].type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            alerts[activeTab].type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {alerts[activeTab].message}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Total Empleados', value: dashboardData.totalStats.totalEmployees, icon: Users, color: 'bg-blue-500' },
                { label: 'Empleados Activos', value: dashboardData.totalStats.activeEmployees, icon: CheckCircle, color: 'bg-green-500' },
                { label: 'Días Totales 2025', value: dashboardData.totalStats.totalVacationDays, icon: Calendar, color: 'bg-purple-500' },
                { label: 'Días Usados 2025', value: dashboardData.totalStats.usedVacationDays, icon: TrendingUp, color: 'bg-yellow-500' },
                { label: 'Vacaciones Pendientes', value: dashboardData.totalStats.pendingVacations, icon: Clock, color: 'bg-red-500' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="text-white" size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Empleados por Departamento</h3>
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

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Vacaciones por Mes (2025)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="days" fill="#385CDB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Vacaciones por Departamento</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalDays" fill="#FCCB49" name="Días Totales" />
                  <Bar dataKey="usedDays" fill="#385CDB" name="Días Usados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {employeeForm.id ? 'Editar Empleado' : 'Agregar Empleado'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar departamento</option>
                    <option value="IT">IT</option>
                    <option value="RRHH">RRHH</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de vacaciones anuales</label>
                  <input
                    type="number"
                    value={employeeForm.totalVacationDays}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, totalVacationDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de alta</label>
                  <input
                    type="date"
                    value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de baja (opcional)</label>
                  <input
                    type="date"
                    value={employeeForm.endDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button
                    onClick={handleEmployeeSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {employeeForm.id ? 'Actualizar' : 'Agregar'} Empleado
                  </button>
                  {employeeForm.id && (
                    <button
                      onClick={() => setEmployeeForm({ id: null, name: '', totalVacationDays: 22, startDate: '', endDate: '', department: '' })}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Empleados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(employee => {
                  const usedDays2025 = employee.usedVacationDays[2025] || 0;
                  const remainingDays = employee.totalVacationDays - usedDays2025;
                  const usagePercentage = (usedDays2025 / employee.totalVacationDays) * 100;
                  const isActive = isEmployeeActive(employee);

                  return (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">{employee.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Departamento:</span> {employee.department || 'No asignado'}</p>
                        <p><span className="font-medium">Antigüedad:</span> {calculateSeniority(employee.startDate, employee.endDate)}</p>
                        <p><span className="font-medium">Días restantes 2025:</span> {remainingDays}</p>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progreso 2025</span>
                          <span>{Math.round(usagePercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => editEmployee(employee)}
                          className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {vacationForm.id ? 'Editar Vacaciones' : 'Solicitar Vacaciones'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                  <select
                    value={vacationForm.employeeId}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                  <select
                    value={vacationForm.year}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de inicio</label>
                  <input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin</label>
                  <input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={vacationForm.reason}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Vacaciones familiares"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button
                    onClick={handleVacationSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {vacationForm.id ? 'Actualizar' : 'Solicitar'} Vacaciones
                  </button>
                  {vacationForm.id && (
                    <button
                      onClick={() => setVacationForm({ id: null, employeeId: '', year: 2025, startDate: '', endDate: '', reason: '' })}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vacaciones Programadas</h3>
              <div className="space-y-3">
                {vacations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay vacaciones programadas</p>
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
                        <div key={vacation.id} className={`border rounded-lg p-4 ${isPast ? 'bg-gray-50' : 'bg-white'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{employee?.name || 'Empleado eliminado'}</h4>
                              <p className="text-sm text-gray-600">{startDate} - {endDate} ({vacation.year})</p>
                              <p className="text-sm text-blue-600 font-medium">{vacation.days} días laborables</p>
                              {vacation.reason && <p className="text-sm text-gray-500 mt-1">{vacation.reason}</p>}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setVacationForm(vacation)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => deleteVacation(vacation.id)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {restrictionForm.id ? 'Editar Restricción' : 'Agregar Restricción'}
              </h3>
              <p className="text-gray-600 mb-4">
                Las restricciones evitan que dos empleados estén de vacaciones al mismo tiempo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primer Empleado</label>
                  <select
                    value={restrictionForm.employee1Id}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee1Id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segundo Empleado</label>
                  <select
                    value={restrictionForm.employee2Id}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, employee2Id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.filter(emp => isEmployeeActive(emp) && emp.id !== parseInt(restrictionForm.employee1Id)).map(employee => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de la restricción</label>
                  <input
                    type="text"
                    value={restrictionForm.reason}
                    onChange={(e) => setRestrictionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: No pueden estar ambos ausentes al mismo tiempo por requerimientos del proyecto"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button
                    onClick={handleRestrictionSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {restrictionForm.id ? 'Actualizar' : 'Agregar'} Restricción
                  </button>
                  {restrictionForm.id && (
                    <button
                      onClick={() => setRestrictionForm({ id: null, employee1Id: '', employee2Id: '', reason: '' })}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Restricciones Activas</h3>
              <div className="space-y-3">
                {restrictions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay restricciones configuradas</p>
                ) : (
                  restrictions.map(restriction => {
                    const emp1 = employees.find(emp => emp.id === restriction.employee1Id);
                    const emp2 = employees.find(emp => emp.id === restriction.employee2Id);

                    return (
                      <div key={restriction.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center">
                              <AlertTriangle className="mr-2 text-yellow-500" size={18} />
                              {emp1?.name || 'Empleado eliminado'} ↔ {emp2?.name || 'Empleado eliminado'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{restriction.reason}</p>
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                              <span><strong>Departamento 1:</strong> {emp1?.department || 'N/A'}</span>
                              <span><strong>Departamento 2:</strong> {emp2?.department || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editRestriction(restriction)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteRestriction(restriction.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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