'use client';

import * as React from 'react';
import { Input, InputProps } from './input';

export interface DecimalInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Valor numérico actual (fuente de verdad). */
  value: number | undefined;
  /** Se emite al cambiar. Si está vacío, emite `emptyValue`. */
  onValueChange: (value: number | undefined) => void;
  /** Solo enteros (sin punto decimal). */
  integer?: boolean;
  /** Valor a emitir cuando el campo queda vacío. Default: undefined. */
  emptyValue?: number;
  /** Mostrar vacío en pantalla cuando el valor es 0 (UX más limpia). */
  blankZero?: boolean;
}

/**
 * Input numérico que permite escribir decimales correctamente.
 *
 * El bug del input controlado clásico: con `type="number"` + valor numérico +
 * `parseFloat(e.target.value)` en cada tecla, al escribir "5." o "23.10" el
 * punto/cero final se borra al reconvertir a número en cada render. Aquí
 * mantenemos el TEXTO crudo en estado local y solo emitimos el número al padre,
 * sin reescribir el texto mientras el valor numérico sigue siendo equivalente.
 */
export const DecimalInput = React.forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ value, onValueChange, integer = false, emptyValue, blankZero = false, ...props }, ref) => {
    const format = React.useCallback(
      (v: number | undefined): string => {
        if (v === undefined || v === null || Number.isNaN(v)) return '';
        if (blankZero && v === 0) return '';
        return String(v);
      },
      [blankZero],
    );

    const parse = React.useCallback(
      (raw: string): number | undefined => {
        const norm = raw.replace(',', '.');
        if (norm === '' || norm === '.') return emptyValue;
        const n = integer ? parseInt(norm, 10) : parseFloat(norm);
        return Number.isNaN(n) ? emptyValue : n;
      },
      [integer, emptyValue],
    );

    const [text, setText] = React.useState<string>(() => format(value));

    // Re-sincroniza el texto solo cuando el valor externo difiere del que el
    // usuario tiene escrito (p.ej. cambio programático: "Copiar del anterior").
    // No toca el texto si el número equivale a lo escrito → preserva "5." y "23.10".
    React.useEffect(() => {
      const current = parse(text);
      if ((value ?? null) !== (current ?? null)) {
        setText(format(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const pattern = integer ? /^[0-9]*$/ : /^[0-9]*[.,]?[0-9]*$/;

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== '' && !pattern.test(raw)) return; // ignora teclas inválidas
          setText(raw);
          onValueChange(parse(raw));
        }}
        onBlur={() => setText(format(value))}
      />
    );
  },
);
DecimalInput.displayName = 'DecimalInput';
