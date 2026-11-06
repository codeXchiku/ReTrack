export type ToastKind = 'info' | 'success' | 'error';

export type ToastMessage = {
  id: string;
  message: string;
  kind: ToastKind;
};

