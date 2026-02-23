/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { FigmaCloseIcon } from './Icons';

const InfoBadge = () => (
  <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="44" cy="44" r="41" fill="url(#badgeGradient)" />
    <path d="M44 22a5 5 0 1 0 0 .1V22Zm-7 14h14v30H37V36Z" fill="#fff" />
    <defs>
      <linearGradient id="badgeGradient" x1="9" y1="14" x2="78" y2="78" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8A89FF" />
        <stop offset="0.5" stopColor="#FF8CB6" />
        <stop offset="1" stopColor="#FFC674" />
      </linearGradient>
    </defs>
  </svg>
);

const InfoDialog: React.FC<{
  title: string;
  goal: string;
  goalNote?: string;
  onClose?: () => void;
}> = ({ title, goal, goalNote, onClose = () => {} }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  const dismissInfoDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const clickedOutside = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
      if (clickedOutside) dismissInfoDialog();
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('close', onClose);
    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('close', onClose);
    };
  }, [dismissInfoDialog, onClose]);

  return (
    <dialog ref={dialogRef} className="sparkli-info-dialog" aria-label="How to play">
      <div className="sparkli-info-content">
        <button
          type="button"
          aria-label="Dismiss instructions"
          onClick={dismissInfoDialog}
          className="sparkli-info-close sparkli-hard-icon-button"
        >
          <FigmaCloseIcon className="sparkli-info-close-icon" />
        </button>

        <div className="sparkli-info-badge">
          <InfoBadge />
        </div>

        <h3>{title}</h3>
        <p>{goal}</p>
        {goalNote && <p className="sparkli-info-note">{goalNote}</p>}
      </div>
    </dialog>
  );
};

export default InfoDialog;
