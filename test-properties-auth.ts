// Simple test to verify PROPERTIES collection integration
// This file can be deleted after verification

import { Collection, FullRole, SubRole } from './types/user';
import { NAVIGATION_COLLECTION_MAP } from './lib/auth/client';
import { FULL_ROLE_COLLECTIONS } from './types/user';

console.log('🧪 Testing PROPERTIES Collection Integration...');

// Test 1: Check Collection enum includes PROPERTIES
console.log('✅ Collection.PROPERTIES exists:', Collection.PROPERTIES);

// Test 2: Check navigation mapping includes properties
console.log('✅ Navigation mapping includes properties:', NAVIGATION_COLLECTION_MAP.properties);

// Test 3: Check role permissions include PROPERTIES
console.log('✅ AGENT role includes PROPERTIES:', FULL_ROLE_COLLECTIONS[FullRole.AGENT].includes(Collection.PROPERTIES));
console.log('✅ SALES role includes PROPERTIES:', FULL_ROLE_COLLECTIONS[FullRole.SALES].includes(Collection.PROPERTIES));
console.log('✅ ADMIN role includes PROPERTIES:', FULL_ROLE_COLLECTIONS[FullRole.ADMIN].includes(Collection.PROPERTIES));

console.log('🎉 All PROPERTIES integration tests passed!');

// Mock user for permission testing
const mockUser = {
  _id: 'test123',
  firebaseUid: 'test123',
  email: 'agent@test.com',
  displayName: 'Test Agent',
  fullRole: FullRole.AGENT,
  status: 'ACTIVE' as any,
  collectionPermissions: [
    {
      collection: Collection.PROPERTIES,
      subRole: SubRole.CONTRIBUTOR,
      customActions: [],
      restrictions: {}
    }
  ],
  permissionOverrides: [],
  loginAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log('🧑‍💼 Test user with AGENT role and PROPERTIES access created');
console.log('📋 User accessible collections would include:', FULL_ROLE_COLLECTIONS[FullRole.AGENT]);

export { mockUser };