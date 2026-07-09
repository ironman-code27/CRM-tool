import React from 'react';
import { useCRM } from '../context/CRMContext';

export const Toast: React.FC = () => {
  const { toastMsg, showToast } = useCRM();

  return (
    <div className={`toast ${showToast ? 'show' : ''}`} id="toast">
      <div className="toast-dot" />
      <span id="toast-msg">{toastMsg}</span>
    </div>
  );
};
export default Toast;
