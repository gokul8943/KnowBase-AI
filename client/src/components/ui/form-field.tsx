import { ReactNode } from 'react';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { cn } from '../../utils/cn';

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, description, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export function InputField({ label, description, error, required, className, ...props }: InputFieldProps) {
  return (
    <FormField label={label} description={description} error={error} required={required}>
      <Input error={!!error} className={className} {...props} />
    </FormField>
  );
}

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export function TextareaField({ label, description, error, required, className, ...props }: TextareaFieldProps) {
  return (
    <FormField label={label} description={description} error={error} required={required}>
      <Textarea error={!!error} className={className} {...props} />
    </FormField>
  );
}

interface SelectFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectField({ label, description, error, required, placeholder, options, value, onValueChange, disabled }: SelectFieldProps) {
  return (
    <FormField label={label} description={description} error={error} required={required}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger error={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}