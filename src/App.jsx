import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X, Target, TrendingUp, ChevronLeft, ChevronRight, RotateCcw, Loader, AlertCircle } from 'lucide-react';

// ===== CONFIGURACIÓN SUPABASE =====
const createSupabaseClient = () => {
  // Variables de entorno para Vite
  const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
  
  console.log('🔗 Conectando a Supabase:', supabaseUrl);
  console.log('🔑 Clave:', supabaseKey ? 'Configurada ✅' : 'No configurada ❌');
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Variables de Supabase no configuradas, usando modo simulación');
    return null;
  }

  // Cliente real de Supabase usando fetch API
  return {
    from: (table) => ({
      select: (columns = '*') => ({
        order: (column, options) => ({
          then: async (resolve) => {
            try {
              const orderParam = `${column}.${options.ascending ? 'asc' : 'desc'}`;
              const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&order=${orderParam}`, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const data = await response.json();
              console.log(`📊 Cargados ${data.length} registros de ${table}`);
              resolve({ data: data || [], error: null });
            } catch (error) {
              console.error(`❌ Error en select ${table}:`, error);
              resolve({ data: [], error });
            }
          }
        }),
        gte: (column, value) => ({ 
          lte: (col, val) => ({ 
            then: async (resolve) => {
              try {
                const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&${column}=gte.${value}&${col}=lte.${val}`, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                resolve({ data: data || [], error: null });
              } catch (error) {
                console.error('❌ Error en consulta con rango de fechas:', error);
                resolve({ data: [], error });
              }
            }
          })
        }),
        then: async (resolve) => {
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            resolve({ data: data || [], error: null });
          } catch (error) {
            console.error(`❌ Error cargando ${table}:`, error);
            resolve({ data: [], error });
          }
        }
      }),
      insert: (data) => ({
        select: () => ({
          single: () => ({
            then: async (resolve) => {
              try {
                const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
                  method: 'POST',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify(Array.isArray(data) ? data[0] : data)
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log(`✅ Insertado en ${table}:`, result);
                resolve({ data: Array.isArray(result) ? result[0] : result, error: null });
              } catch (error) {
                console.error(`❌ Error insertando en ${table}:`, error);
                resolve({ data: null, error });
              }
            }
          })
        })
      }),
      update: (data) => ({
        eq: (column, value) => ({
          select: () => ({
            single: () => ({
              then: async (resolve) => {
                try {
                  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
                    method: 'PATCH',
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                  });
                  
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                  }
                  
                  const result = await response.json();
                  console.log(`✅ Actualizado en ${table}:`, result);
                  resolve({ data: Array.isArray(result) ? result[0] : result, error: null });
                } catch (error) {
                  console.error(`❌ Error actualizando ${table}:`, error);
                  resolve({ data: null, error });
                }
              }
            })
          })
        })
      }),
      delete: () => ({
        eq: (column, value) => ({
          then: async (resolve) => {
            try {
              const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              console.log(`🗑️ Eliminado de ${table}: ${column}=${value}`);
              resolve({ error: null });
            } catch (error) {
              console.error(`❌ Error eliminando de ${table}:`, error);
              resolve({ error });
            }
          }
        })
      }),
      upsert: (data, options) => ({
        then: async (resolve) => {
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify(data)
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log(`💾 Upsert en ${table}:`, data);
            resolve({ error: null });
          } catch (error) {
            console.error(`❌ Error en upsert ${table}:`, error);
            resolve({ error });
          }
        }
      })
    })
  };
};

const supabase = createSupabaseClient();

// ===== FUNCIONES DE BASE DE DATOS =====
const loadActivities = async () => {
  try {
    if (!supabase) {
      console.log('📱 Modo simulación: usando actividades por defecto');
      return [
        { id: 1, name: 'Videos Udemy', daily_goal: 15, unit: 'videos', color: 'bg-blue-500' },
        { id: 2, name: 'Inglés', daily_goal: 1, unit: 'hora', color: 'bg-green-500' },
        { id: 3, name: 'Programa One', daily_goal: 1, unit: 'curso', color: 'bg-purple-500' }
      ];
    }

    console.log('🔄 Cargando actividades desde PostgreSQL...');
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error cargando actividades:', error);
    return [];
  }
};

const createActivity = async (activity) => {
  try {
    if (!supabase) {
      return { ...activity, id: Date.now() };
    }

    console.log('➕ Creando nueva actividad:', activity);
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();
    
    if (error) throw error;
    
    // Inicializar balance de extras
    await supabase
      .from('extra_balance')
      .insert([{ activity_id: data.id, balance: 0 }]);
    
    return data;
  } catch (error) {
    console.error('❌ Error creando actividad:', error);
    throw error;
  }
};

const updateActivity = async (id, updates) => {
  try {
    if (!supabase) {
      return { ...updates, id };
    }

    console.log('✏️ Actualizando actividad:', id, updates);
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error actualizando actividad:', error);
    throw error;
  }
};

const deleteActivity = async (id) => {
  try {
    if (!supabase) {
      return true;
    }

    console.log('🗑️ Eliminando actividad:', id);
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error eliminando actividad:', error);
    throw error;
  }
};

const loadDailyProgress = async (startDate, endDate) => {
  try {
    if (!supabase) {
      console.log('📱 Modo simulación: sin progreso guardado');
      return {};
    }

    console.log(`🔄 Cargando progreso de ${startDate} a ${endDate}...`);
    
    const response = await fetch(`${import.meta.env.VITE_REACT_APP_SUPABASE_URL}/rest/v1/daily_progress?select=*&date=gte.${startDate}&date=lte.${endDate}`, {
      headers: {
        'apikey': import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.log('📊 No se encontraron datos de progreso');
      return {};
    }
    
    const progressByDate = {};
    data.forEach(item => {
      if (!progressByDate[item.date]) {
        progressByDate[item.date] = {};
      }
      progressByDate[item.date][item.activity_id] = {
        progress: item.progress,
        extrasUsed: item.extras_used
      };
    });
    
    console.log(`📊 Cargado progreso de ${Object.keys(progressByDate).length} días:`, progressByDate);
    return progressByDate;
  } catch (error) {
    console.error('❌ Error cargando progreso diario:', error);
    return {};
  }
};

const saveProgress = async (date, activityId, progress, extrasUsed = 0) => {
  try {
    if (!supabase) {
      console.log('📱 Modo simulación: no se guarda progreso');
      return null;
    }

    console.log(`💾 Guardando progreso: ${date} - actividad ${activityId} - ${progress} (${extrasUsed} extras)`);
    
    const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
    
    // Primero verificar si el registro existe
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/daily_progress?date=eq.${date}&activity_id=eq.${activityId}&select=id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const existingRecords = await checkResponse.json();
    console.log(`🔍 Verificando si existe: ${date} + ${activityId} →`, existingRecords);
    
    if (existingRecords && existingRecords.length > 0) {
      // ACTUALIZAR registro existente
      console.log('🔄 Actualizando registro existente...');
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/daily_progress?date=eq.${date}&activity_id=eq.${activityId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          progress,
          extras_used: extrasUsed,
          updated_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Error en UPDATE:', updateResponse.status, errorText);
        throw new Error(`UPDATE HTTP ${updateResponse.status}: ${errorText}`);
      }
      console.log('✅ Progreso actualizado correctamente');
    } else {
      // INSERTAR nuevo registro
      console.log('➕ Insertando nuevo registro...');
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/daily_progress`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          date,
          activity_id: activityId,
          progress,
          extras_used: extrasUsed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('❌ Error en INSERT:', insertResponse.status, errorText);
        throw new Error(`INSERT HTTP ${insertResponse.status}: ${errorText}`);
      }
      console.log('✅ Progreso insertado correctamente');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error guardando progreso:', error);
    throw error;
  }
};

const loadExtraBalance = async () => {
  try {
    if (!supabase) {
      console.log('📱 Modo simulación: balance de extras por defecto');
      return { 1: 0, 2: 0, 3: 0 };
    }

    console.log('🔄 Cargando balance de extras...');
    
    const response = await fetch(`${import.meta.env.VITE_REACT_APP_SUPABASE_URL}/rest/v1/extra_balance?select=*`, {
      headers: {
        'apikey': import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.log('📊 No se encontraron datos de balance de extras');
      return {};
    }
    
    const balanceByActivity = {};
    data.forEach(item => {
      balanceByActivity[item.activity_id] = item.balance;
    });
    
    console.log('📊 Balance de extras cargado:', balanceByActivity);
    return balanceByActivity;
  } catch (error) {
    console.error('❌ Error cargando balance de extras:', error);
    return {};
  }
};

const updateExtraBalance = async (activityId, balance) => {
  try {
    if (!supabase) {
      console.log('📱 Modo simulación: no se actualiza balance');
      return null;
    }

    console.log(`💰 Actualizando balance de extras: actividad ${activityId} = ${balance}`);
    
    // Primero intentar actualizar
    const updateResponse = await fetch(`${import.meta.env.VITE_REACT_APP_SUPABASE_URL}/rest/v1/extra_balance?activity_id=eq.${activityId}`, {
      method: 'PATCH',
      headers: {
        'apikey': import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        balance,
        updated_at: new Date().toISOString()
      })
    });

    // Si no existe el registro (404), entonces insertar
    if (updateResponse.status === 404 || !updateResponse.ok) {
      const insertResponse = await fetch(`${import.meta.env.VITE_REACT_APP_SUPABASE_URL}/rest/v1/extra_balance`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          activity_id: activityId,
          balance,
          updated_at: new Date().toISOString()
        })
      });

      if (!insertResponse.ok) {
        throw new Error(`HTTP ${insertResponse.status}: ${insertResponse.statusText}`);
      }
      console.log('✅ Balance de extras insertado correctamente');
    } else {
      console.log('✅ Balance de extras actualizado correctamente');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error actualizando balance de extras:', error);
    throw error;
  }
};

const getMonthDateRange = (year, month) => {
  const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
  
  return { startDate, endDate };
};

// ===== COMPONENTE PRINCIPAL =====
const DesafioAprendizaje = () => {
  const [activities, setActivities] = useState([]);
  const [dailyProgress, setDailyProgress] = useState({});
  const [extraBalance, setExtraBalance] = useState({});
  const [extrasUsed, setExtrasUsed] = useState({});
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(6);
  const [currentYear, setCurrentYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const isSupabaseConfigured = !!supabase;

  const generateDates = () => {
    const year = currentYear;
    const month = currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(`${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`);
    }
    return dates;
  };

  const dates = generateDates();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      loadMonthProgress();
    }
  }, [currentMonth, currentYear, activities]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniciando carga de datos...');
      
      const [activitiesData, balanceData] = await Promise.all([
        loadActivities(),
        loadExtraBalance()
      ]);
      
      setActivities(activitiesData);
      setExtraBalance(balanceData);
      
      console.log('✅ Datos iniciales cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthProgress = async () => {
    try {
      const { startDate, endDate } = getMonthDateRange(currentYear, currentMonth);
      const progressData = await loadDailyProgress(startDate, endDate);
      
      console.log('🔄 Procesando datos del mes para la interfaz...');
      
      const dailyProgressData = {};
      const extrasUsedData = {};
      
      // Inicializar todos los días del mes con ceros
      dates.forEach(date => {
        dailyProgressData[date] = {};
        extrasUsedData[date] = {};
        activities.forEach(activity => {
          dailyProgressData[date][activity.id] = 0;
          extrasUsedData[date][activity.id] = 0;
        });
      });
      
      // Cargar datos reales de la base de datos
      Object.keys(progressData).forEach(date => {
        if (dailyProgressData[date]) { // Solo si la fecha está en el mes actual
          Object.keys(progressData[date]).forEach(activityId => {
            const dayData = progressData[date][activityId];
            dailyProgressData[date][activityId] = dayData.progress || 0;
            extrasUsedData[date][activityId] = dayData.extrasUsed || 0;
          });
        }
      });
      
      console.log('📊 Datos procesados para la interfaz:');
      console.log('- Progreso diario:', dailyProgressData);
      console.log('- Extras usados:', extrasUsedData);
      
      setDailyProgress(dailyProgressData);
      setExtrasUsed(extrasUsedData);
      
    } catch (error) {
      console.error('❌ Error cargando progreso del mes:', error);
    }
  };

  const updateProgressHandler = async (date, activityId, value) => {
    const numValue = parseInt(value) || 0;
    const activity = activities.find(a => a.id === activityId);
    const currentProgress = dailyProgress[date]?.[activityId] || 0;
    const currentExtrasUsed = extrasUsed[date]?.[activityId] || 0;
    
    console.log(`🎯 GUARDANDO: fecha=${date}, actividad=${activityId}, valor=${numValue}`);
    
    try {
      setSaving(true);
      
      setDailyProgress(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [activityId]: numValue
        }
      }));

      const realProgress = numValue - currentExtrasUsed;
      const newExtras = Math.max(0, realProgress - activity.daily_goal);
      const previousRealProgress = currentProgress - currentExtrasUsed;
      const previousExtras = Math.max(0, previousRealProgress - activity.daily_goal);
      const extrasDiff = newExtras - previousExtras;
      
      const newBalance = Math.max(0, (extraBalance[activityId] || 0) + extrasDiff);
      setExtraBalance(prev => ({
        ...prev,
        [activityId]: newBalance
      }));
      
      await Promise.all([
        saveProgress(date, activityId, numValue, currentExtrasUsed),
        updateExtraBalance(activityId, newBalance)
      ]);
      
    } catch (error) {
      console.error('❌ Error actualizando progreso:', error);
      loadMonthProgress();
      const balanceData = await loadExtraBalance();
      setExtraBalance(balanceData);
    } finally {
      setSaving(false);
    }
  };

  const useExtras = async (date, activityId, amount) => {
    const available = extraBalance[activityId] || 0;
    const useAmount = Math.min(amount, available);
    const currentProgress = dailyProgress[date]?.[activityId] || 0;
    const currentExtrasUsed = extrasUsed[date]?.[activityId] || 0;
    
    try {
      setSaving(true);
      
      const newBalance = available - useAmount;
      const newExtrasUsed = currentExtrasUsed + useAmount;
      const newProgress = currentProgress + useAmount;
      
      setExtraBalance(prev => ({
        ...prev,
        [activityId]: newBalance
      }));
      
      setExtrasUsed(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [activityId]: newExtrasUsed
        }
      }));
      
      setDailyProgress(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [activityId]: newProgress
        }
      }));
      
      await Promise.all([
        saveProgress(date, activityId, newProgress, newExtrasUsed),
        updateExtraBalance(activityId, newBalance)
      ]);
      
    } catch (error) {
      console.error('❌ Error usando extras:', error);
      loadMonthProgress();
      const balanceData = await loadExtraBalance();
      setExtraBalance(balanceData);
    } finally {
      setSaving(false);
    }
    
    return useAmount;
  };

  const recoverExtras = async (date, activityId) => {
    const usedExtras = extrasUsed[date]?.[activityId] || 0;
    const currentProgress = dailyProgress[date]?.[activityId] || 0;
    
    if (usedExtras > 0) {
      try {
        setSaving(true);
        
        const newBalance = (extraBalance[activityId] || 0) + usedExtras;
        const newProgress = Math.max(0, currentProgress - usedExtras);
        
        setExtraBalance(prev => ({
          ...prev,
          [activityId]: newBalance
        }));
        
        setExtrasUsed(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [activityId]: 0
          }
        }));
        
        setDailyProgress(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [activityId]: newProgress
          }
        }));
        
        await Promise.all([
          saveProgress(date, activityId, newProgress, 0),
          updateExtraBalance(activityId, newBalance)
        ]);
        
      } catch (error) {
        console.error('❌ Error recuperando extras:', error);
        loadMonthProgress();
        const balanceData = await loadExtraBalance();
        setExtraBalance(balanceData);
      } finally {
        setSaving(false);
      }
    }
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getStatus = (date, activity) => {
    const progress = dailyProgress[date]?.[activity.id] || 0;
    const goal = activity.daily_goal;
    
    if (progress >= goal) return 'completed';
    if (progress > 0) return 'partial';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const addActivity = async (activityData) => {
    try {
      setSaving(true);
      const newActivity = {
        ...activityData,
        color: `bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo'][Math.floor(Math.random() * 7)]}-500`
      };
      
      const createdActivity = await createActivity(newActivity);
      setActivities([...activities, createdActivity]);
      setExtraBalance(prev => ({...prev, [createdActivity.id]: 0}));
      setIsAddingActivity(false);
      
    } catch (error) {
      console.error('❌ Error agregando actividad:', error);
    } finally {
      setSaving(false);
    }
  };

  const editActivity = async (id, activityData) => {
    try {
      setSaving(true);
      await updateActivity(id, activityData);
      setActivities(activities.map(a => a.id === id ? { ...a, ...activityData } : a));
      setEditingActivity(null);
      
    } catch (error) {
      console.error('❌ Error editando actividad:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteActivityHandler = async (id) => {
    try {
      setSaving(true);
      await deleteActivity(id);
      setActivities(activities.filter(a => a.id !== id));
      
      setExtraBalance(prev => {
        const newBalance = {...prev};
        delete newBalance[id];
        return newBalance;
      });
      
    } catch (error) {
      console.error('❌ Error eliminando actividad:', error);
    } finally {
      setSaving(false);
    }
  };

  const ActivityForm = ({ activity, onSave, onCancel }) => {
    const [formData, setFormData] = useState(activity || {
      name: '',
      daily_goal: 1,
      unit: ''
    });

    const handleSubmit = () => {
      if (formData.name && formData.unit && formData.daily_goal > 0) {
        onSave(formData);
      }
    };

    return (
      <div className="bg-gray-800 p-4 rounded-lg space-y-3">
        <input
          type="text"
          placeholder="Nombre de la actividad"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Meta diaria"
            value={formData.daily_goal}
            onChange={(e) => setFormData({...formData, daily_goal: parseInt(e.target.value)})}
            className="flex-1 p-2 bg-gray-700 rounded border border-gray-600 text-white"
            min="1"
          />
          <input
            type="text"
            placeholder="Unidad (ej: videos, horas)"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
            className="flex-1 p-2 bg-gray-700 rounded border border-gray-600 text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white text-sm"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin" size={32} />
          <span className="text-xl">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Desafío Aprendizaje {currentYear}</h1>
            {saving && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader size={16} className="animate-spin" />
                <span className="text-sm">Guardando...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-gray-400">
              Sistema completo de seguimiento diario con PostgreSQL y Supabase
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isSupabaseConfigured ? 'PostgreSQL conectado' : 'Modo simulación'}
              </span>
            </div>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-400" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Configuración de Supabase requerida</h3>
                <p className="text-sm text-gray-300">
                  Para guardar datos en PostgreSQL, crea el archivo <code className="bg-gray-800 px-2 py-1 rounded">.env</code> con:
                </p>
                <div className="mt-2 text-sm text-gray-400 font-mono bg-gray-800/50 p-2 rounded">
                  <div>VITE_REACT_APP_SUPABASE_URL=tu-url-aqui</div>
                  <div>VITE_REACT_APP_SUPABASE_ANON_KEY=tu-key-aqui</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <h2 className="text-2xl font-bold min-w-48 text-center">
            {months[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp size={20} />
              Balance de Extras
            </h2>
            <button
              onClick={() => {
                loadInitialData();
                loadMonthProgress();
              }}
              disabled={saving || loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm"
            >
              <RotateCcw size={14} />
              Recargar datos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {activities.map(activity => (
              <div key={activity.id} className="bg-gray-700 p-3 rounded-lg">
                <div className={`w-3 h-3 ${activity.color} rounded-full mb-2`}></div>
                <p className="text-sm text-gray-300">{activity.name}</p>
                <p className="text-lg font-bold text-green-400">
                  +{extraBalance[activity.id] || 0} {activity.unit}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Actividades</h2>
            <button
              onClick={() => setIsAddingActivity(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
              <Plus size={16} />
              Agregar Actividad
            </button>
          </div>

          {isAddingActivity && (
            <div className="mb-4">
              <ActivityForm
                onSave={addActivity}
                onCancel={() => setIsAddingActivity(false)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {activities.map(activity => (
              <div key={activity.id} className="bg-gray-800 p-4 rounded-lg">
                {editingActivity === activity.id ? (
                  <ActivityForm
                    activity={activity}
                    onSave={(data) => editActivity(activity.id, data)}
                    onCancel={() => setEditingActivity(null)}
                  />
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 ${activity.color} rounded-full`}></div>
                      <h3 className="font-semibold">{activity.name}</h3>
                    </div>
                    <p className="text-gray-400 mb-3">
                      Meta: {activity.daily_goal} {activity.unit}/día
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingActivity(activity.id)}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm"
                      >
                        <Edit2 size={12} />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteActivityHandler(activity.id)}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-4 border-r border-gray-600">
                    <Calendar size={16} className="inline mr-2" />
                    Fecha
                  </th>
                  <th className="text-left p-4 border-r border-gray-600">Estado</th>
                  {activities.map(activity => (
                    <th key={activity.id} className="text-left p-4 border-r border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${activity.color} rounded-full`}></div>
                        {activity.name}
                        <span className="text-xs text-gray-400">
                          ({activity.daily_goal} {activity.unit})
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="text-left p-4">Usar Extras</th>
                </tr>
              </thead>
              <tbody>
                {dates.map(date => {
                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const overallStatus = activities.every(activity => 
                    getStatus(date, activity) === 'completed'
                  ) ? 'completed' : activities.some(activity => 
                    getStatus(date, activity) !== 'pending'
                  ) ? 'partial' : 'pending';

                  return (
                    <tr key={date} className={`border-t border-gray-700 hover:bg-gray-750 ${isToday ? 'bg-gray-750' : ''}`}>
                      <td className="p-4 border-r border-gray-600">
                        <div className={`font-medium ${isToday ? 'text-blue-400' : ''}`}>
                          {dateObj.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        {isToday && (
                          <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">HOY</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-gray-600">
                        <span className={`inline-flex items-center gap-2 ${getStatusColor(overallStatus)}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            overallStatus === 'completed' ? 'bg-green-400' :
                            overallStatus === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          {overallStatus === 'completed' ? 'COMPLETADO' :
                           overallStatus === 'partial' ? 'PARCIAL' : 'PENDIENTE'}
                        </span>
                      </td>
                      {activities.map(activity => {
                        const progress = dailyProgress[date]?.[activity.id] || 0;
                        const usedExtras = extrasUsed[date]?.[activity.id] || 0;
                        const status = getStatus(date, activity);
                        
                        // Debug para ver qué datos tiene cada celda
                        if (progress > 0) {
                          console.log(`📱 Mostrando progreso: ${date} - ${activity.name} - ${progress}`);
                        }
                        
                        return (
                          <td key={activity.id} className="p-4 border-r border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="number"
                                min="0"
                                value={progress}
                                onChange={(e) => updateProgressHandler(date, activity.id, e.target.value)}
                                className="w-16 p-1 bg-gray-700 border border-gray-600 rounded text-center text-white"
                                disabled={saving}
                              />
                              <span className="text-sm text-gray-400">/ {activity.daily_goal}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                status === 'completed' ? 'bg-green-400' :
                                status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}></div>
                            </div>
                            {usedExtras > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-orange-400">
                                  {usedExtras} extras usados
                                </span>
                                <button
                                  onClick={() => recoverExtras(date, activity.id)}
                                  disabled={saving}
                                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
                                  title="Recuperar extras y hacer el trabajo real"
                                >
                                  <RotateCcw size={12} />
                                  Recuperar
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {activities.map(activity => {
                            const available = extraBalance[activity.id] || 0;
                            const currentProgress = dailyProgress[date]?.[activity.id] || 0;
                            const usedExtras = extrasUsed[date]?.[activity.id] || 0;
                            const realProgress = currentProgress - usedExtras;
                            const needed = Math.max(0, activity.daily_goal - realProgress);
                            const canUse = Math.min(available, needed);
                            
                            return needed > 0 && available > 0 ? (
                              <div key={activity.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    useExtras(date, activity.id, canUse);
                                  }}
                                  disabled={saving}
                                  className={`px-3 py-1 text-xs rounded ${activity.color} hover:opacity-80 disabled:opacity-50 flex items-center gap-1`}
                                  title={`Usar ${canUse} ${activity.unit} extras de ${activity.name}`}
                                >
                                  Usar +{canUse}
                                </button>
                                <span className="text-xs text-gray-400">
                                  ({available} disponibles)
                                </span>
                              </div>
                            ) : needed > 0 && available === 0 ? (
                              <div key={activity.id} className="text-xs text-gray-500">
                                Sin extras de {activity.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesafioAprendizaje;