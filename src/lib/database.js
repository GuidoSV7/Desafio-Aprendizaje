import { supabase } from './supabase'

// ===== ACTIVIDADES =====
export const loadActivities = async () => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('id', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error cargando actividades:', error)
    return []
  }
}

export const createActivity = async (activity) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single()
    
    if (error) throw error
    
    // Inicializar balance de extras para la nueva actividad
    await supabase
      .from('extra_balance')
      .insert([{ activity_id: data.id, balance: 0 }])
    
    return data
  } catch (error) {
    console.error('Error creando actividad:', error)
    throw error
  }
}

export const updateActivity = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando actividad:', error)
    throw error
  }
}

export const deleteActivity = async (id) => {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando actividad:', error)
    throw error
  }
}

// ===== PROGRESO DIARIO =====
export const loadDailyProgress = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
    
    if (error) throw error
    
    // Convertir array a objeto agrupado por fecha y actividad
    const progressByDate = {}
    data.forEach(item => {
      if (!progressByDate[item.date]) {
        progressByDate[item.date] = {}
      }
      progressByDate[item.date][item.activity_id] = {
        progress: item.progress,
        extrasUsed: item.extras_used
      }
    })
    
    return progressByDate
  } catch (error) {
    console.error('Error cargando progreso diario:', error)
    return {}
  }
}

export const saveProgress = async (date, activityId, progress, extrasUsed = 0) => {
  try {
    const { data, error } = await supabase
      .from('daily_progress')
      .upsert({
        date,
        activity_id: activityId,
        progress,
        extras_used: extrasUsed,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date,activity_id'
      })
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error guardando progreso:', error)
    throw error
  }
}

// ===== BALANCE DE EXTRAS =====
export const loadExtraBalance = async () => {
  try {
    const { data, error } = await supabase
      .from('extra_balance')
      .select('*')
    
    if (error) throw error
    
    // Convertir a objeto con activity_id como clave
    const balanceByActivity = {}
    data.forEach(item => {
      balanceByActivity[item.activity_id] = item.balance
    })
    
    return balanceByActivity
  } catch (error) {
    console.error('Error cargando balance de extras:', error)
    return {}
  }
}

export const updateExtraBalance = async (activityId, balance) => {
  try {
    const { data, error } = await supabase
      .from('extra_balance')
      .upsert({
        activity_id: activityId,
        balance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'activity_id'
      })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando balance de extras:', error)
    throw error
  }
}

// ===== FUNCIONES DE UTILIDAD =====
export const getMonthDateRange = (year, month) => {
  const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`
  
  return { startDate, endDate }
}