/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

const COMPANY_NAME = 'Bell Registry';
const COPYRIGHT_YEAR = new Date().getFullYear();
const COPYRIGHT_LINE = `Copyright © ${COPYRIGHT_YEAR} ${COMPANY_NAME}. All rights reserved.`;

let bannerLogged = false;

export function logStartupBanner() {
  if (bannerLogged) return;
  
  console.log(`🔔 Admin Portal - ${COPYRIGHT_LINE}`);
  bannerLogged = true;
}
