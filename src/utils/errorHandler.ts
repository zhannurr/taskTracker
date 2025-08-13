import { Alert } from 'react-native';
import { logError, logWarn } from './logger';

export interface AppError {
  code?: string;
  message: string;
  details?: any;
  isUserError?: boolean;
}

export class ErrorHandler {
  /**
   * Handle Firebase authentication errors with user-friendly messages
   */
  static handleAuthError(error: any): AppError {
    let message = 'Authentication failed';
    let isUserError = false;

    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'User not found. Please check your email or create an account.';
          isUserError = true;
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          isUserError = true;
          break;
        case 'auth/invalid-email':
          message = 'Invalid email format. Please enter a valid email address.';
          isUserError = true;
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Please choose a stronger password.';
          isUserError = true;
          break;
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists. Please use a different email or try logging in.';
          isUserError = true;
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          isUserError = true;
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection and try again.';
          isUserError = true;
          break;
        default:
          message = 'An unexpected error occurred. Please try again.';
          isUserError = false;
      }
    }

    const appError: AppError = {
      code: error.code,
      message,
      details: error,
      isUserError
    };

    logError('Authentication error', error, { appError });
    return appError;
  }

  /**
   * Handle Firebase Firestore errors
   */
  static handleFirestoreError(error: any, operation: string): AppError {
    let message = `${operation} failed`;
    let isUserError = false;

    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          message = 'You don\'t have permission to perform this action.';
          isUserError = true;
          break;
        case 'not-found':
          message = 'The requested resource was not found.';
          isUserError = true;
          break;
        case 'already-exists':
          message = 'This resource already exists.';
          isUserError = true;
          break;
        case 'resource-exhausted':
          message = 'Service temporarily unavailable. Please try again later.';
          isUserError = true;
          break;
        case 'unavailable':
          message = 'Service is currently unavailable. Please try again later.';
          isUserError = true;
          break;
        case 'unauthenticated':
          message = 'Please log in to perform this action.';
          isUserError = true;
          break;
        default:
          message = `An error occurred while ${operation.toLowerCase()}. Please try again.`;
          isUserError = false;
      }
    }

    const appError: AppError = {
      code: error.code,
      message,
      details: error,
      isUserError
    };

    logError(`Firestore error during ${operation}`, error, { appError });
    return appError;
  }

  /**
   * Handle general application errors
   */
  static handleGeneralError(error: any, context: string): AppError {
    const message = 'An unexpected error occurred. Please try again.';
    
    const appError: AppError = {
      code: error.code || 'unknown',
      message,
      details: error,
      isUserError: false
    };

    logError(`General error in ${context}`, error, { appError });
    return appError;
  }

  /**
   * Show error alert to user
   */
  static showErrorAlert(error: AppError, title: string = 'Error') {
    Alert.alert(title, error.message);
  }

  /**
   * Show confirmation dialog
   */
  static showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', style: 'destructive', onPress: onConfirm }
      ]
    );
  }

  /**
   * Show success message
   */
  static showSuccess(message: string, title: string = 'Success') {
    Alert.alert(title, message);
  }

  /**
   * Handle async operations with error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    errorContext: string,
    showAlert: boolean = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.handleGeneralError(error, errorContext);
      
      if (showAlert) {
        this.showErrorAlert(appError);
      }
      
      return null;
    }
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(fields: Record<string, any>, fieldNames: string[]): string[] {
    const errors: string[] = [];
    
    fieldNames.forEach(fieldName => {
      const value = fields[fieldName];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldName} is required`);
      }
    });
    
    return errors;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export convenience functions
export const handleAuthError = (error: any) => ErrorHandler.handleAuthError(error);
export const handleFirestoreError = (error: any, operation: string) => ErrorHandler.handleFirestoreError(error, operation);
export const handleGeneralError = (error: any, context: string) => ErrorHandler.handleGeneralError(error, context);
export const showErrorAlert = (error: AppError, title?: string) => ErrorHandler.showErrorAlert(error, title);
export const showConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => 
  ErrorHandler.showConfirmation(title, message, onConfirm, onCancel);
export const showSuccess = (message: string, title?: string) => ErrorHandler.showSuccess(message, title);
export const handleAsync = <T>(operation: () => Promise<T>, errorContext: string, showAlert?: boolean) => 
  ErrorHandler.handleAsync(operation, errorContext, showAlert);
export const validateRequiredFields = (fields: Record<string, any>, fieldNames: string[]) => 
  ErrorHandler.validateRequiredFields(fields, fieldNames);
export const validateEmail = (email: string) => ErrorHandler.validateEmail(email);
export const validatePassword = (password: string) => ErrorHandler.validatePassword(password);
