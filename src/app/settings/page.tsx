"use client";

import React, { useEffect, useMemo, useState } from 'react';
import TitlePage from '@/components/common/TitlePage';
import { useAccounts } from '@/contexts/AccountsContext';
import { PERMISSION_CATALOG } from '@/lib/permissions';
import {
  useGetAccountsQuery,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  type PermissionDef,
  type RoleDTO,
  type AccountDTO,
} from '@/store/slices/accountsApi';
import { toast } from 'react-hot-toast';
import {
  Shield,
  Users as UsersIcon,
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  X,
  UserPlus,
  Mail,
} from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

type PermissionSelectorProps = {
  catalog: PermissionDef[];
  selected: string[];
  onToggle: (code: string) => void;
};

function PermissionSelector({ catalog, selected, onToggle }: PermissionSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
      {catalog.map((perm) => {
        const checked = selected.includes(perm.code);
        return (
          <label
            key={perm.code}
            className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${
              checked ? 'border-sky-400 bg-sky-50' : 'border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              onChange={() => onToggle(perm.code)}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{perm.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  {perm.area}
                </span>
              </div>
              <p className="text-xs text-slate-500">{perm.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { account, availablePermissions, refresh, hasPermission } = useAccounts();
  const catalog = useMemo<PermissionDef[]>(
    () => (availablePermissions?.length ? availablePermissions : PERMISSION_CATALOG),
    [availablePermissions]
  );
  const isAdmin = Boolean(account?.isAdmin);
  const canManage = isAdmin || hasPermission('settings.manage');

  const {
    data: rolesData,
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useGetRolesQuery(undefined, { skip: !canManage });
  const {
    data: accountsData,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useGetAccountsQuery(undefined, { skip: !canManage });

  const [createRole, { isLoading: creatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: deletingRole }] = useDeleteRoleMutation();
  const [createAccount, { isLoading: creatingAccount }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updatingAccount }] = useUpdateAccountMutation();
  const [removeAccount, { isLoading: deletingAccount }] = useDeleteAccountMutation();

  const roles = useMemo(() => rolesData?.roles ?? [], [rolesData]);
  const accounts = useMemo(() => accountsData?.accounts ?? [], [accountsData]);

  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  const [editingRoleDescription, setEditingRoleDescription] = useState('');
  const [editingRolePermissions, setEditingRolePermissions] = useState<string[]>([]);

  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!rolePermissions.length && catalog.length) {
      setRolePermissions(catalog.slice(0, 4).map((p) => p.code));
    }
  }, [catalog, rolePermissions.length]);

  useEffect(() => {
    if (!newUserRoleId && roles.length) {
      setNewUserRoleId(roles[0].id);
    }
  }, [roles, newUserRoleId]);

  const toggleRolePermission = (code: string) => {
    setRolePermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleEditingPermission = (code: string) => {
    setEditingRolePermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Asigna un nombre al rol');
      return;
    }
    if (rolePermissions.length === 0) {
      toast.error('Selecciona al menos un permiso');
      return;
    }
    try {
      await createRole({
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: rolePermissions,
      }).unwrap();
      toast.success('Rol creado');
      setRoleName('');
      setRoleDescription('');
      setRolePermissions(catalog.slice(0, 4).map((p) => p.code));
      await refetchRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear el rol';
      toast.error(msg);
    }
  };

  const startEditRole = (role: RoleDTO) => {
    setEditingRoleId(role.id);
    setEditingRoleName(role.name);
    setEditingRoleDescription(role.description || '');
    setEditingRolePermissions(role.permissions || []);
  };

  const cancelEditRole = () => {
    setEditingRoleId(null);
    setEditingRoleName('');
    setEditingRoleDescription('');
    setEditingRolePermissions([]);
  };

  const handleSaveRole = async () => {
    if (!editingRoleId) return;
    if (!editingRoleName.trim()) {
      toast.error('El rol necesita un nombre');
      return;
    }
    if (editingRolePermissions.length === 0) {
      toast.error('Elige al menos un permiso');
      return;
    }
    try {
      await updateRole({
        id: editingRoleId,
        data: {
          name: editingRoleName.trim(),
          description: editingRoleDescription.trim(),
          permissions: editingRolePermissions,
        },
      }).unwrap();
      toast.success('Rol actualizado');
      cancelEditRole();
      await refetchRoles();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar';
      toast.error(msg);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id).unwrap();
      toast.success('Rol eliminado');
      await refetchRoles();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar';
      toast.error(msg);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      toast.error('Captura un identificador para el usuario');
      return;
    }
    if (!newUserRoleId) {
      toast.error('Selecciona un rol');
      return;
    }
    if (!newUserPassword || newUserPassword.length < 8) {
      toast.error('Contraseña mínima de 8 caracteres');
      return;
    }
    try {
      const payload = {
        userId: newUserId.trim(),
        displayName: newUserName.trim(),
        email: newUserEmail.trim(),
        roleId: newUserRoleId,
        password: newUserPassword,
      };
      await createAccount(payload).unwrap();
      toast.success('Cuenta creada');
      setNewUserId('');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      await refetchAccounts();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear la cuenta';
      toast.error(msg);
    }
  };

  const handleUpdateAccount = async (user: AccountDTO) => {
    const roleId = pendingRoles[user.id] || user.roleId;
    if (!roleId) {
      toast.error('Selecciona un rol');
      return;
    }
    try {
      await updateAccount({ id: user.id, data: { roleId } }).unwrap();
      toast.success('Cuenta actualizada');
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      await refetchAccounts();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar la cuenta';
      toast.error(msg);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await removeAccount(id).unwrap();
      toast.success('Cuenta eliminada');
      await refetchAccounts();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar la cuenta';
      toast.error(msg);
    }
  };

  return (
    <PermissionGate permission="settings.manage" redirectTo="/">
    <div className="space-y-4">
      <TitlePage title="Settings" subtitle="Gestiona cuentas, roles y accesos de tu tenant." />

      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Shield className="text-sky-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Tu cuenta</h3>
            {account ? (
              <>
                <p className="text-sm text-slate-600">
                  {account.displayName || account.userId}{' '}
                  {account.email ? `- ${account.email}` : ''}
                </p>
                <p className="text-sm text-slate-500">
                  Rol: {account.roleName || 'Sin rol'} - Permisos: {account.permissions.length}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                No encontramos una cuenta enlazada a tu usuario. Crea una desde la seccion de usuarios.
              </p>
            )}
          </div>
        </div>
      </section>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
          Necesitas el rol de administrador para gestionar roles y usuarios.
        </div>
      )}

      {canManage && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Roles y accesos</h3>
            <p className="text-sm text-slate-500">
              Define permisos por componente y asignalos a tus equipos.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {rolesLoading ? 'Cargando roles...' : `${roles.length} roles`}
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleCreateRole}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre del rol</label>
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej. Supervisor"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Descripcion (opcional)
              </label>
              <input
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Accesos limitados a catalogo e inventario"
              />
            </div>
          </div>
          <PermissionSelector
            catalog={catalog}
            selected={rolePermissions}
            onToggle={toggleRolePermission}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingRole}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 text-white px-4 py-2 hover:bg-sky-700 disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" />
              Crear rol
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => {
            const isEditing = editingRoleId === role.id;
            return (
              <div
                key={role.id}
                className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{role.name}</p>
                      {role.isAdmin && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {role.description || 'Sin descripcion'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!role.isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar rol"
                        disabled={deletingRole}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        isEditing ? cancelEditRole() : startEditRole(role)
                      }
                      className="text-slate-600 hover:text-slate-800"
                      title="Editar rol"
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {!role.isAdmin && (
                      <input
                        value={editingRoleName}
                        onChange={(e) => setEditingRoleName(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Nombre del rol"
                      />
                    )}
                    <input
                      value={editingRoleDescription}
                      onChange={(e) => setEditingRoleDescription(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Descripcion"
                    />
                    <PermissionSelector
                      catalog={catalog}
                      selected={editingRolePermissions}
                      onToggle={toggleEditingPermission}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={updatingRole}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p) => {
                      const perm = catalog.find((c) => c.code === p);
                      return (
                        <span
                          key={p}
                          className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                        >
                          {perm ? perm.label : p}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </section>
      )}

      {canManage && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Usuarios</h3>
            <p className="text-sm text-slate-500">
              Asigna roles a nuevas cuentas dentro de este tenant.
            </p>
          </div>
          <UsersIcon className="text-slate-500" />
        </div>

        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateAccount}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Identificador</label>
            <input
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="sub, email o user id"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre</label>
            <input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nombre visible"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="opcional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Rol</label>
            <select
              value={newUserRoleId}
              onChange={(e) => setNewUserRoleId(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creatingAccount}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Crear usuario
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Usuario</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Correo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Rol</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Permisos</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2 text-sm text-slate-800">
                    <div className="font-medium">{user.displayName || user.userId}</div>
                    <div className="text-xs text-slate-500">ID: {user.userId}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {user.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin correo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    <select
                      value={pendingRoles[user.id] || user.roleId || ''}
                      onChange={(e) =>
                        setPendingRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {(user.permissions || []).slice(0, 4).map((perm) => {
                        const meta = catalog.find((p) => p.code === perm);
                        return (
                          <span
                            key={perm}
                            className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                          >
                            {meta ? meta.label : perm}
                          </span>
                        );
                      })}
                      {user.permissions.length > 4 && (
                        <span className="text-[11px] text-slate-500">
                          +{user.permissions.length - 4} mas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-slate-600">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateAccount(user)}
                        className="text-emerald-600 hover:text-emerald-700"
                        disabled={updatingAccount || deletingAccount}
                        title="Guardar cambios"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(user.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deletingAccount || user.id === account?.id}
                        title={
                          user.id === account?.id
                            ? 'No puedes borrar tu propia sesion'
                            : 'Eliminar usuario'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accountsLoading && (
            <p className="text-sm text-slate-500 mt-2">Cargando usuarios...</p>
          )}
        </div>
        </section>
      )}
    </div>
    </PermissionGate>
  );
}
