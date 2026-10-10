import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postmanPath = path.resolve(__dirname, '../../E2_Stories_OTT_Auth_APIs.postman_collection.json');

const raw = fs.readFileSync(postmanPath, 'utf8');
const collection = JSON.parse(raw);

// Ensure collection variables
const ensureVar = (key, value, description) => {
  const existing = collection.variable.find((v) => v.key === key);
  if (!existing) {
    collection.variable.push({ key, value, type: 'string', description });
    console.log(`[OK] Added variable ${key}`);
  }
};

ensureVar('promoId', '', 'MongoDB ObjectId of a Promo discount code');
ensureVar('voucherId', '', 'MongoDB ObjectId of a Plan Voucher');
ensureVar('promoCode', 'WELCOME20', 'Sample promo code for discount checkout');
ensureVar('voucherCode', 'VIP1M-GIFT', 'Sample voucher code for full plan grant');

const adminFolder = collection.item.find((i) => i.name === 'ADMIN PANEL');
const mobileFolder = collection.item.find((i) => i.name === 'MOBILE APP');

if (!adminFolder || !mobileFolder) {
  console.error('[ERR] Required folders not found');
  process.exit(1);
}

// 1. Remove old Promo/Voucher folders if any
adminFolder.item = adminFolder.item.filter(
  (it) => !it.name.includes('Promo') && !it.name.includes('Voucher')
);

// 2. Admin Promo Codes Folder
const adminPromosFolder = {
  name: '10. Promo Codes Management (Discount Coupons)',
  description: 'Full CRUD, bulk generation, and toggle controls for promotional discount codes (Percentage & Flat discounts on subscription plans).',
  item: [
    {
      name: '10.1 List All Promo Codes',
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/promos/admin?page=1&limit=50&status=ALL&search=',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '50' },
            { key: 'status', value: 'ALL' },
            { key: 'search', value: '' }
          ]
        },
        description: 'Fetch paginated promotional discount codes along with active, expired, and total redemption counters.'
      }
    },
    {
      name: '10.2 Create Promo Code',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              code: 'FESTIVAL50',
              discountType: 'PERCENTAGE',
              discountValue: 50,
              applicablePlan: 'ALL',
              maxUses: 500,
              expiryDate: '2026-12-31T23:59:59.000Z',
              description: 'Special 50% discount on all passes'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/promos/admin',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin']
        },
        description: 'Create a new promotional discount coupon.'
      }
    },
    {
      name: '10.3 Bulk Generate Promo Codes',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              prefix: 'DIWALI',
              count: 10,
              discountType: 'PERCENTAGE',
              discountValue: 20,
              applicablePlan: 'ALL',
              maxUses: 100,
              expiryDate: '2026-12-31T23:59:59.000Z',
              description: 'Diwali festive campaign batch'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/promos/admin/bulk-generate',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin', 'bulk-generate']
        },
        description: 'Batch generates multiple unique promo discount codes with a common prefix.'
      }
    },
    {
      name: '10.4 Get Single Promo Code Details',
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/promos/admin/{{promoId}}',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin', '{{promoId}}']
        },
        description: 'Fetch details, status, and usage counts for a single promo code by ID or code string.'
      }
    },
    {
      name: '10.5 Update Promo Code',
      request: {
        method: 'PATCH',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              discountValue: 40,
              maxUses: 1000,
              description: 'Updated 40% discount'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/promos/admin/{{promoId}}',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin', '{{promoId}}']
        },
        description: 'Update discount values, usage quota, or expiry of a promo code.'
      }
    },
    {
      name: '10.6 Toggle Promo Status (Active / Paused)',
      request: {
        method: 'PATCH',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/promos/admin/{{promoId}}/toggle',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin', '{{promoId}}', 'toggle']
        },
        description: 'Instantly pause or reactivate a promo code.'
      }
    },
    {
      name: '10.7 Delete Promo Code',
      request: {
        method: 'DELETE',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/promos/admin/{{promoId}}',
          host: ['{{baseUrl}}'],
          path: ['promos', 'admin', '{{promoId}}']
        },
        description: 'Permanently remove a promo discount code.'
      }
    }
  ]
};

// 3. Admin Plan Vouchers Folder
const adminVouchersFolder = {
  name: '11. Plan Vouchers Management (Complete Plan Access)',
  description: 'Manage 100% complimentary subscription plan vouchers (grant 1M, 6M, 12M passes) for giveaways, partnerships, and influencers.',
  item: [
    {
      name: '11.1 List All Plan Vouchers',
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/vouchers/admin?page=1&limit=50&status=ALL&search=',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '50' },
            { key: 'status', value: 'ALL' },
            { key: 'search', value: '' }
          ]
        },
        description: 'Fetch paginated subscription plan vouchers with redemptions and quota stats.'
      }
    },
    {
      name: '11.2 Create Plan Voucher',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              code: 'VIPGIFT30',
              planCode: 'PLAN_1M',
              planName: '1 Month Pass',
              durationDays: 30,
              voucherType: 'SINGLE_USE',
              maxUses: 1,
              expiryDate: '2026-12-31T23:59:59.000Z',
              campaignName: 'Tech Influencer Review Campaign',
              notes: 'Gifted to YouTube reviewer @techguru'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/vouchers/admin',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin']
        },
        description: 'Create a voucher that grants a full subscription plan directly.'
      }
    },
    {
      name: '11.3 Bulk Generate Plan Vouchers',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              prefix: 'CAMPUS',
              count: 20,
              planCode: 'PLAN_1M',
              voucherType: 'SINGLE_USE',
              expiryDate: '2026-12-31T23:59:59.000Z',
              campaignName: 'College Fest Giveaway',
              notes: 'Handed out at annual college fest'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/vouchers/admin/bulk-generate',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin', 'bulk-generate']
        },
        description: 'Generates a batch of unique single-use or multi-use plan vouchers with a given prefix.'
      }
    },
    {
      name: '11.4 Get Single Plan Voucher Details',
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/vouchers/admin/{{voucherId}}',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin', '{{voucherId}}']
        },
        description: 'Fetch voucher details including claimant users and timestamps.'
      }
    },
    {
      name: '11.5 Update Plan Voucher',
      request: {
        method: 'PATCH',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              campaignName: 'Updated Campaign Title',
              notes: 'Extended expiry and added notes'
            },
            null,
            2
          )
        },
        url: {
          raw: '{{baseUrl}}/vouchers/admin/{{voucherId}}',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin', '{{voucherId}}']
        },
        description: 'Update voucher parameters, assigned plan duration, and notes.'
      }
    },
    {
      name: '11.6 Toggle Voucher Status',
      request: {
        method: 'PATCH',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/vouchers/admin/{{voucherId}}/toggle',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin', '{{voucherId}}', 'toggle']
        },
        description: 'Pause or unpause a plan voucher.'
      }
    },
    {
      name: '11.7 Delete Plan Voucher',
      request: {
        method: 'DELETE',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/vouchers/admin/{{voucherId}}',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'admin', '{{voucherId}}']
        },
        description: 'Delete a plan voucher from database.'
      }
    }
  ]
};

// 4. Mobile App Voucher & Promo Validation & Redemption
let subFolder = mobileFolder.item.find((it) => it.name.includes('Subscription'));
if (subFolder) {
  // Ensure we don't have duplicate validation requests
  subFolder.item = subFolder.item.filter(
    (it) => !it.name.includes('Validate Promo') && !it.name.includes('Apply Promo') && !it.name.includes('Voucher')
  );

  subFolder.item.push(
    {
      name: '4.8 Validate Promo Discount Code',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ code: '{{promoCode}}', planCode: 'PLAN_1M' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/promos/validate',
          host: ['{{baseUrl}}'],
          path: ['promos', 'validate']
        },
        description: 'Validates promotional discount code during checkout and previews discounted plan pricing.'
      }
    },
    {
      name: '4.9 Apply Promo Code (Checkout Pricing Calculation)',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ code: '{{promoCode}}', planId: '{{planId}}' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/promos/apply',
          host: ['{{baseUrl}}'],
          path: ['promos', 'apply']
        },
        description: 'Applies promo code to checkout session, verifying plan eligibility and returning complete discount breakdown.'
      }
    },
    {
      name: '4.10 Validate Plan Voucher',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ code: '{{voucherCode}}' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/vouchers/validate',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'validate']
        },
        description: 'Checks if a plan voucher is valid and previews the complete plan granted.'
      }
    },
    {
      name: '4.11 Redeem Plan Voucher (Instant VIP Activation)',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
          { key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ code: '{{voucherCode}}' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/vouchers/redeem',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'redeem']
        },
        description: 'Redeems voucher code and instantly grants the user 100% free VIP subscription access.'
      }
    },
    {
      name: '4.12 Get My Voucher Redemption History',
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{authToken}}', type: 'text' }],
        url: {
          raw: '{{baseUrl}}/vouchers/my-history',
          host: ['{{baseUrl}}'],
          path: ['vouchers', 'my-history']
        },
        description: 'Fetches the list of all plan vouchers redeemed by the current logged-in user.'
      }
    }
  );
}

adminFolder.item.push(adminPromosFolder, adminVouchersFolder);

fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('[SUCCESS] Postman collection updated successfully with comprehensive Promo and Voucher endpoints.');
