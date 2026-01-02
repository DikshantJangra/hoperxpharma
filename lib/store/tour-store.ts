import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TourState {
    hasCompletedTour: boolean;
    hasSeenTour: boolean; // Set to true if user skips
    currentStepIndex: number;
    isTourActive: boolean;
    shouldAutoStart: boolean; // Flag to trigger auto-start after demo creation

    // Actions
    startTour: () => void;
    completeTour: () => void;
    skipTour: () => void;
    resetTour: () => void;
    setShouldAutoStart: (value: boolean) => void;
    setCurrentStep: (index: number) => void;
    setTourActive: (active: boolean) => void;
}

export const useTourStore = create<TourState>()(
    persist(
        (set) => ({
            hasCompletedTour: false,
            hasSeenTour: false,
            currentStepIndex: 0,
            isTourActive: false,
            shouldAutoStart: false,

            startTour: () => set({
                isTourActive: true,
                currentStepIndex: 0,
                hasSeenTour: true
            }),

            completeTour: () => set({
                hasCompletedTour: true,
                isTourActive: false,
                hasSeenTour: true
            }),

            skipTour: () => set({
                isTourActive: false,
                hasSeenTour: true
            }),

            resetTour: () => set({
                hasCompletedTour: false,
                currentStepIndex: 0,
                isTourActive: false,
                hasSeenTour: false
            }),

            setShouldAutoStart: (value: boolean) => set({ shouldAutoStart: value }),

            setCurrentStep: (index: number) => set({ currentStepIndex: index }),

            setTourActive: (active: boolean) => set({ isTourActive: active })
        }),
        {
            name: 'tour-storage',
            // Only persist these fields
            partialize: (state) => ({
                hasCompletedTour: state.hasCompletedTour,
                hasSeenTour: state.hasSeenTour,
                shouldAutoStart: state.shouldAutoStart
            })
        }
    )
);
