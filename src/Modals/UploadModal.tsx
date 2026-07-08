import React from 'react';

interface UploadModalProps {
  uploadResultsHtml: string;
  close: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ uploadResultsHtml, close }) => {
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>Upload results</h2>
        <div id="upload-results" dangerouslySetInnerHTML={{ __html: uploadResultsHtml }} />
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default UploadModal;
