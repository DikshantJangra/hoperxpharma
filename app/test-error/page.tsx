'use client';

import ErrorComponent from '../error';

export default function TestErrorPage() {
    return (
        <ErrorComponent
            error={new Error('This is a test error message for visual verification.')}
            reset={() => alert('Reset function called')}
        />
    );
}
