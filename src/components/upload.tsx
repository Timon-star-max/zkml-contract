import React from 'react';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export const FileUploader = ({ preLoad, handleFile }: { preLoad: () => void, handleFile: (f: File) => void }) => {
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    preLoad()
    hiddenFileInput.current?.click();
  };

  const handleChange = (event: any) => {
    const fileUploaded = event.target.files[0];
    handleFile(fileUploaded);
  };

  return (
    <>
      <button className="zkml-button hbutton-lnk" onClick={handleClick}>
        <span>
          Load key <FontAwesomeIcon icon={faUpload} /> 
        </span>
      </button>
      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  );
}