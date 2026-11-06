export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type DialogState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

