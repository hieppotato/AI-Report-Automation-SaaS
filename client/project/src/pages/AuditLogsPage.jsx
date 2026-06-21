import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Search, User, ShieldAlert, Filter, RotateCcw, FileText } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useOrgStore } from '../store/orgStore'
import { formatDate } from '../lib/utils'

const DEFAULT_LOGS = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    user: 'You',
    action: 'viewed_dashboard',
    target: 'Workspace Overview',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: 'You',
    action: 'generated_report',
    target: 'Q2 Performance Analysis',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: 'alex.smith@company.com',
    action: 'uploaded_file',
    target: 'may_telemetry_raw.csv',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    user: 'You',
    action: 'changed_role',
    target: 'alex.smith@company.com (to Admin)',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    user: 'You',
    action: 'invited_member',
    target: 'alex.smith@company.com',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    user: 'You',
    action: 'created_organization',
    target: 'Reportly AI Workspace',
  }
]

export function AuditLogsPage() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id
  const [logs, setLogs] = useState([])
  
  // Filters State
  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load logs from localStorage, fallback to DEFAULT_LOGS
  useEffect(() => {
    if (!orgId) return
    const key = `audit_logs_${orgId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      setLogs(JSON.parse(stored))
    } else {
      localStorage.setItem(key, JSON.stringify(DEFAULT_LOGS))
      setLogs(DEFAULT_LOGS)
    }
  }, [orgId])

  // Extract unique filters options
  const uniqueActors = useMemo(() => {
    const actors = new Set(logs.map(log => log.user))
    return ['all', ...Array.from(actors)]
  }, [logs])

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action))
    return ['all', ...Array.from(actions)]
  }, [logs])

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('')
    setActorFilter('all')
    setActionFilter('all')
    setStartDate('')
    setEndDate('')
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search text match
      const searchMatch = 
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.target.toLowerCase().includes(search.toLowerCase())

      // Actor match
      const actorMatch = actorFilter === 'all' || log.user === actorFilter

      // Action match
      const actionMatch = actionFilter === 'all' || log.action === actionFilter

      // Date range match
      let dateMatch = true
      const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0)
      
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0)
        if (logDate < start) dateMatch = false
      }
      
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999)
        if (logDate > end) dateMatch = false
      }

      return searchMatch && actorMatch && actionMatch && dateMatch
    })
  }, [logs, search, actorFilter, actionFilter, startDate, endDate])

  const getActionBadgeStyle = (action) => {
    switch (action) {
      case 'invited_member':
      case 'resent_invitation':
        return 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/30'
      case 'added_member':
        return 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/30'
      case 'removed_member':
      case 'cancelled_invitation':
        return 'bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-250/20'
      case 'generated_report':
        return 'bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border-brand-200/30'
      default:
        return 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
    }
  }

  const formatActionName = (action) => {
    return action.replace(/_/g, ' ')
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-brand-650" />
          Workspace Audit Logs
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Review access tracking, report generations, configuration adjustments, and user telemetry modifications.</p>
      </div>

      {/* Filters Toolbar */}
      <div className="card p-5 space-y-4 mb-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filter Trail Logs
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search user, action, target..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Actor Select */}
          <div>
            <select 
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="input capitalize cursor-pointer"
            >
              <option value="all">All Actors</option>
              {uniqueActors.filter(actor => actor !== 'all').map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </div>

          {/* Action Select */}
          <div>
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input capitalize cursor-pointer"
            >
              <option value="all">All Actions</option>
              {uniqueActions.filter(action => action !== 'all').map(action => (
                <option key={action} value={action}>{formatActionName(action)}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button 
              onClick={handleResetFilters}
              className="btn-secondary w-full h-10 gap-1.5 cursor-pointer justify-center text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-zinc-100 dark:border-zinc-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-zinc-450 whitespace-nowrap">Start Date:</label>
            <div className="relative flex-1">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="input pl-9 text-xs h-9" 
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-zinc-450 whitespace-nowrap">End Date:</label>
            <div className="relative flex-1">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="input pl-9 text-xs h-9" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <FileText className="w-8 h-8 text-zinc-400 mb-3" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No logs found matching filters</p>
            <p className="text-xs text-zinc-500 mt-1">Try clearing search phrases or expanding date bounds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Actor / User</th>
                  <th className="py-3.5 px-6">Action Event</th>
                  <th className="py-3.5 px-6">Target Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px] leading-relaxed">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-6 text-zinc-450 dark:text-zinc-500">{formatDate(log.timestamp)}</td>
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100 font-sans text-xs">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-450 shrink-0" />
                        {log.user}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-semibold capitalize font-sans tracking-wide ${getActionBadgeStyle(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-650 dark:text-zinc-450 text-xs truncate max-w-xs" title={log.target}>{log.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AuditLogsPage
