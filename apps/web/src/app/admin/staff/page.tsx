'use client';

// ============================================
// Net-On — Admin Staff Management Page
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Shield,
  Wrench,
  HeadphonesIcon,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  Edit2,
  UserX,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface StaffItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  specialization?: string;
  status: string;
  hireDate: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
  };
}

const roleBadges: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: Shield },
  ADMIN: { label: 'Admin', color: 'text-primary bg-primary/10 border-primary/20', icon: Shield },
  TECHNICIAN: { label: 'Technician', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Wrench },
  SUPPORT: { label: 'Support', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: HeadphonesIcon },
  FINANCE: { label: 'Finance', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: DollarSign },
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New staff form
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', role: 'SUPPORT', department: 'Operations', specialization: '',
  });

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (departmentFilter) params.department = departmentFilter;

      const [res, statsRes]: any = await Promise.allSettled([
        api.get('/staff', params),
        api.get('/staff/stats'),
      ]);

      if (res.status === 'fulfilled') {
        const val = res.value;
        const items = val?.items || (Array.isArray(val) ? val : []);
        setStaff(items);
      } else {
        throw res.reason;
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError(err.message || 'Failed to load staff members.');
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, departmentFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.phone) return;
    setIsSubmitting(true);
    try {
      await api.post('/staff', form);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'SUPPORT', department: 'Operations', specialization: '' });
      setShowAddForm(false);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate staff member "${name}"? Their login access will be revoked.`)) return;
    try {
      await api.delete(`/staff/${id}`);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff member');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            Staff Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage administrators, technicians, and support staff accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Staff'}</span>
          </button>
          <button
            onClick={() => fetchStaff()}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchStaff()} className="underline hover:text-rose-300 font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-primary/30 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> New Staff Member
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">First Name *</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Last Name *</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@neton.co.ke"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Phone *</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="254712345678"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Role *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="ADMIN">Admin</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="SUPPORT">Support Agent</option>
                <option value="FINANCE">Finance</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="Operations">Operations</option>
                <option value="Technical">Technical</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Finance">Finance</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAddStaff} disabled={isSubmitting || !form.firstName || !form.email || !form.password}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20">
                {isSubmitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Creating...</span></>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /><span>Create Staff</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border bg-primary/10 border-primary/20">
          <div className="text-lg font-extrabold text-primary">{stats?.total || staff.length}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Total Staff</div>
        </div>
        <div className="glass-card p-4 border bg-emerald-500/10 border-emerald-500/20">
          <div className="text-lg font-extrabold text-emerald-400">{stats?.active || staff.filter(s => s.status === 'ACTIVE').length}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Active</div>
        </div>
        <div className="glass-card p-4 border bg-amber-500/10 border-amber-500/20">
          <div className="text-lg font-extrabold text-amber-400">{stats?.byRole?.technicians || 0}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Technicians</div>
        </div>
        <div className="glass-card p-4 border bg-cyan-500/10 border-cyan-500/20">
          <div className="text-lg font-extrabold text-cyan-400">{stats?.byRole?.support || 0}</div>
          <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">Support Agents</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TECHNICIAN">Technician</option>
          <option value="SUPPORT">Support</option>
          <option value="FINANCE">Finance</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-card/60 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Departments</option>
          <option value="Operations">Operations</option>
          <option value="Technical">Technical</option>
          <option value="Customer Service">Customer Service</option>
          <option value="Finance">Finance</option>
          <option value="Management">Management</option>
        </select>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          Loading staff members...
        </div>
      ) : staff.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <UserCog className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">No staff members found</p>
          <p className="text-xs text-muted-foreground">
            Add staff members to manage roles and access control.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => {
            const badge = roleBadges[member.user.role] || roleBadges.SUPPORT;
            const RoleIcon = badge.icon;

            return (
              <div
                key={member.id}
                className="glass-card p-5 hover:border-primary/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      {member.status !== 'ACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold text-rose-400 bg-rose-500/10 border-rose-500/20">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {member.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {member.phone}
                      </span>
                      <span className="font-mono bg-card/60 px-2 py-0.5 rounded border border-border/40">
                        {member.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(member.hireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {member.user.lastLoginAt && (
                      <div className="text-[10px] text-muted-foreground/70">
                        Last login: {new Date(member.user.lastLoginAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {member.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeactivate(member.id, `${member.firstName} ${member.lastName}`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
