#!/usr/bin/env node

/**
 * GeoHabari Ticketing System — Admin Provisioning CLI
 * Usage:
 *   node scripts/provision-admin.js [email] [password] [fullName] [role]
 * Or via environment variables:
 *   INITIAL_ADMIN_EMAIL=... INITIAL_ADMIN_PASSWORD=... node scripts/provision-admin.js
 */

import { provisionAdminUser } from '../src/lib/auth.js';

const [,, cliEmail, cliPassword, cliName, cliRole] = process.argv;

const email = cliEmail || process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@geohabari.com';
const password = cliPassword || process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'GeoHabari@2026Admin!';
const fullName = cliName || process.env.INITIAL_ADMIN_NAME || 'GeoHabari Administrator';
const role = cliRole || 'admin';

try {
  console.log('----------------------------------------------------');
  console.log('GeoHabari Admin Provisioning');
  console.log('----------------------------------------------------');
  console.log(`Email:     ${email}`);
  console.log(`Full Name: ${fullName}`);
  console.log(`Role:      ${role}`);

  const user = await provisionAdminUser({
    email,
    password,
    fullName,
    role,
  });

  console.log('----------------------------------------------------');
  console.log('✔ Administrator provisioned successfully!');
  console.log(`User ID: ${user.id}`);
  console.log('Password has been securely hashed with scrypt.');
  console.log('You can now log in at /admin/login');
  console.log('----------------------------------------------------');
  process.exit(0);
} catch (error) {
  console.error('✖ Failed to provision admin:', error.message);
  process.exit(1);
}
