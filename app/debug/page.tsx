"use client";

import { useAuth } from '@/hooks/useAuth';

export default function DebugPage() {
  const auth = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Auth Hook</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Loading State:</h2>
          <p>{auth.loading ? "Loading..." : "Loaded"}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">User Data:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(auth.user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">MongoDB User:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(auth.mongoUser, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Permission Checks:</h2>
          <ul className="space-y-2">
            <li>Is System Admin: {auth.isSystemAdmin() ? "✅ Yes" : "❌ No"}</li>
            <li>Is Super Admin: {auth.isSuperAdmin() ? "✅ Yes" : "❌ No"}</li>
            <li>Can Manage Users: {auth.canManageUsers() ? "✅ Yes" : "❌ No"}</li>
            <li>Can Manage Roles: {auth.canManageRoles() ? "✅ Yes" : "❌ No"}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Accessible Collections:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(auth.getUserAccessibleCollections(), null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Accessible Nav Items:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(auth.getAccessibleNavItems(), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}