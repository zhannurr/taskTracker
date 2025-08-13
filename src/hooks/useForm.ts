import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
  isValid: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setValuesPartial = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async () => {
    // Validate form if validation function is provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      // If there are validation errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // Handle submission errors if needed
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [values, validate, onSubmit]);

  // Check if form is valid (no errors and all required fields have values)
  const isValid = Object.keys(errors).length === 0 && 
    Object.values(values).every(value => value !== undefined && value !== '');

  return {
    values,
    errors,
    loading,
    setFieldValue,
    setFieldError,
    handleSubmit,
    resetForm,
    setValues: setValuesPartial,
    isValid
  };
}
