import React, { useState, useEffect } from 'react';
import Table from '../assets/svg/Table.svg';

function TransactionPool() {

  return (
    <>
      <div className="lane" style={{ marginTop: '1rem' }}>
        <div className='nothing-here'>
          <img src={Table}></img>
        </div>
        <p className="send-txt-content">Display Transaction History</p>
      </div>
    </>
  );
}

export default TransactionPool;
