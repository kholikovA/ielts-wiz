// Test accounts (profiles.is_test) see the hub as a student of ONE class at a
// time. The shell sets the active class here; the data layer drops anything
// that belongs to a different class. Work not tied to a class is kept.
let scope = null;
export const setGroupScope = (classId) => { scope = classId || null; };
export const groupScope = () => scope;
export const inGroupScope = (classId) => !scope || !classId || classId === scope;
