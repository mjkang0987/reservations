export type AppRole = 'owner' | 'manager' | 'staff';

// 숫자가 낮을수록 상위 권한. hasRequiredRole: current <= required.
export const ROLE_PRIORITY: Record<AppRole, number> = {
    owner: 0,
    manager: 1,
    staff: 2,
};

export function hasRequiredRole(
    currentRole: AppRole | null | undefined,
    requiredRole: AppRole
): boolean {
    if (!currentRole) {
        return false;
    }

    return ROLE_PRIORITY[currentRole] <= ROLE_PRIORITY[requiredRole];
}
