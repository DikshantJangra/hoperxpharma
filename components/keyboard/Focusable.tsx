import React, { forwardRef } from 'react';
import { ZoneId } from '@/lib/keyboard/types';

interface FocusableProps extends React.HTMLAttributes<HTMLDivElement> {
    zone?: ZoneId;
    as?: React.ElementType;
    children: React.ReactNode;
}

export const Focusable = forwardRef<HTMLElement, FocusableProps>(({
    zone,
    as: Component = 'div',
    children,
    ...props
}, ref) => {
    return (
        <Component
            ref={ref}
            data-zone={zone}
            tabIndex={0} // Make focusable by default
            {...props}
        >
            {children}
        </Component>
    );
});

Focusable.displayName = 'Focusable';
