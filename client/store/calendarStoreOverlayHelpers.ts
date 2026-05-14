type OverlayState = {
    selectedReservation: number | null;
    selectedReservations: number[];
    createReservationInitial: { date: string; startTime: string } | null;
};

export function buildOpenedReservationState(
    state: Pick<OverlayState, 'selectedReservations'>,
    selectedReservationId: number
): Pick<OverlayState, 'selectedReservation' | 'selectedReservations' | 'createReservationInitial'> {
    const nextReservations = [...state.selectedReservations, selectedReservationId];

    return {
        selectedReservation: selectedReservationId,
        selectedReservations: nextReservations,
        createReservationInitial: null,
    };
}

export function buildClosedReservationState(
    state: Pick<OverlayState, 'selectedReservations'>,
    layerIndex: number
): Pick<OverlayState, 'selectedReservation' | 'selectedReservations'> {
    const nextReservations = state.selectedReservations.filter((_, index) => index !== layerIndex);

    return {
        selectedReservations: nextReservations,
        selectedReservation: nextReservations[nextReservations.length - 1] ?? null,
    };
}
