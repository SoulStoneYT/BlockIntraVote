/**
 * Utility functions for institutional email validation and domain restrictions.
 */

// Official institutional domain for NHITM
export const ALLOWED_DOMAIN = "nhitm.ac.in";

/**
 * Validates if an email belongs strictly to the allowed college domain (@nhitm.ac.in).
 * Matches:
 *  - name@nhitm.ac.in
 *  - name.surname@nhitm.ac.in
 *  - name@subdomain.nhitm.ac.in (if any institutional subdomains exist)
 * Rejects:
 *  - @gmail.com, @yahoo.com, etc.
 *  - @othernhitm.ac.in, @nhitm.ac.in.fake.com
 */
export const isValidCollegeEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Strict regex for NHITM institutional domain:
  // Must have local part, '@', optional subdomains, then exactly 'nhitm.ac.in'
  const nhitmRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*nhitm\.ac\.in$/;
  return nhitmRegex.test(cleanEmail);
};
