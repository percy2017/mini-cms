import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import intlTelInput from 'intl-tel-input/intlTelInputWithUtils';

export type PhoneInputHandle = {
    /** E.164-formatted number (with leading +), or '' when invalid/empty. */
    getNumber: () => string;
    /** Whether the current value is a valid number for the selected country. */
    isValid: () => boolean;
};

type Props = {
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (valid: boolean) => void;
    /** id used by the surrounding <Label htmlFor=...> */
    id?: string;
    /** Optional className for the wrapper — the plugin wraps our <input> in
     *  its own .iti element, so styling the input directly is awkward. */
    className?: string;
    /** Optional placeholder shown when the field is empty. */
    placeholder?: string;
    /** Initial country, ISO 3166-1 alpha-2 (e.g. "bo"). Defaults to "bo"
     *  because this app is deployed in Bolivia. */
    initialCountry?: string;
};

/**
 * Phone input with country selector + dial code + validation, powered by
 * intl-tel-input.
 *
 * Parents that need the E.164 value at submit time should use the ref and
 * call `getNumber()` (since the visible field is wrapped by the plugin and
 * may contain just the national digits). The `onChange` callback fires on
 * every keystroke with the current E.164 number, but it can be stale if
 * the user never touched the field — so the ref is the source of truth.
 */
const PhoneInput = forwardRef<PhoneInputHandle, Props>(function PhoneInput(
    { value, onChange, onValidityChange, id, className, placeholder, initialCountry = 'bo' },
    ref,
) {
    const inputRef = useRef<HTMLInputElement>(null);
    const instanceRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

    useImperativeHandle(
        ref,
        () => ({
            getNumber: () => instanceRef.current?.getNumber() ?? '',
            isValid: () => instanceRef.current?.isValidNumber() ?? false,
        }),
        [],
    );

    useEffect(() => {
        if (!inputRef.current) return;

        const instance = intlTelInput(inputRef.current, {
            initialCountry,
            preferredCountries: ['bo', 'ar', 'br', 'cl', 'pe', 'us'],
            separateDialCode: true,
            nationalMode: false,
        });
        instanceRef.current = instance;

        const handleChange = () => {
            onChange(instance.getNumber() || inputRef.current?.value || '');
            onValidityChange?.(instance.isValidNumber());
        };

        inputRef.current.addEventListener('input', handleChange);
        inputRef.current.addEventListener('countrychange', handleChange);

        return () => {
            inputRef.current?.removeEventListener('input', handleChange);
            inputRef.current?.removeEventListener('countrychange', handleChange);
            instance.destroy();
            instanceRef.current = null;
        };
    }, [initialCountry]); // onChange / onValidityChange intentionally excluded — stable callbacks expected

    return (
        <div className={className}>
            <input
                ref={inputRef}
                id={id}
                type="tel"
                defaultValue={value}
                placeholder={placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            />
        </div>
    );
});

export default PhoneInput;