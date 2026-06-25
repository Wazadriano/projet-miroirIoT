import { useState } from 'react';
import { useUsers, useInvalidate } from '@/lib/hooks';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Trash2, UserCircle } from 'lucide-react';
import type { User } from '@/lib/types';

export default function Equipe() {
  const { data: users, isLoading } = useUsers();
  const invalidate = useInvalidate();

  const handleDelete = async (u: User) => {
    if (!confirm(`Supprimer ${u.name} ?`)) return;
    await api(`users/${u.id}`, { method: 'DELETE' });
    invalidate('users');
  };

  const handleRoleChange = async (u: User, role: string) => {
    await api(`users/${u.id}`, { method: 'PUT', body: JSON.stringify({ role }) });
    invalidate('users');
  };

  return (
    <div>
      <PageHeader
        title="Équipe"
        subtitle="Gestion des accès collaborateurs"
      />

      {isLoading ? (
        <p className="text-center py-8 text-gray-400">Chargement…</p>
      ) : !users?.length ? (
        <p className="text-center py-8 text-gray-400">Aucun membre</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {users.map((u: User) => (
            <div key={u.id} className="card flex flex-col items-center text-center gap-2 p-4 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 w-full">
                <div className="font-semibold text-sm truncate">{u.name}</div>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                {/* {u.is_admin && <span className="text-xs text-primary font-medium">Admin</span>} */}
              </div>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u, e.target.value)}
                className="input w-full text-xs mt-1"
              >
                <option value="gerant">Gérant</option>
                <option value="collaborateur">Collaborateur</option>
              </select>
              {!u.is_admin && (
                <button onClick={() => handleDelete(u)} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-danger">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
