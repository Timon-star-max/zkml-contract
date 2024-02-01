import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { curve, ec as EC } from 'elliptic';
import { BigNumber, ethers } from 'ethers';
import { base58, getAddress, keccak256, parseEther } from 'ethers/lib/utils.js';
import {
  useAccount,
  useBalance,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction
} from 'wagmi';

import { ZkmlPayABI } from '../contracts/abi.json';
import { registryAddress, explorer } from '../utils/constants';
import { calculateCrc } from '../utils/crc16';
import useDebounce from '../utils/debounce';
import { Connect } from './connect';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { supabase } from '../utils/constants';

import './panes.css';

const zero = BigNumber.from(0);

export function Send(props: any) {
  
  const ec = useMemo(() => {
    return new EC('secp256k1');
  }, []);

  const { chain } = useNetwork();
  const { setIsLoading } = props;
  const explorerAddress = explorer[chain?.id || 100 || 10200];
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
    watch: true,
    cacheTime: 3_500,
  });
  
  const [xdcAddr, setxdcAddr]                   = useState<string>(ethers.constants.AddressZero);
  const [sharedSecretByte, setSharedSecretByte] = useState<string>('0x00');
  const [theirID, setTheirID]                   = useState<string>('');
  const [ephPublic, setEphPublic]               = useState<curve.base.BasePoint>();
  const [ZkmlIDError, setZkmlIDError]           = useState<boolean>(false);
  const [amountError, setAmountError]           = useState<boolean>(false);
  const [amount, setAmount]                     = useState<string>('0');
  const [amountWei, setAmountWei]               = useState<BigNumber>(zero);
  const [hash]                                  = useState<string>(window.location.hash);
  const toast                                   = useToast();

  const debouncedAmount = useDebounce(amountWei, 500);
  const debouncedAddr   = useDebounce(xdcAddr, 500);
  
  const {
    isError: isPrepareError,
    error: prepareError,
    config,
  } = usePrepareContractWrite({
    address: registryAddress[chain?.id || 0],
    abi: ZkmlPayABI,
    functionName: 'publishAndSend',
    args: [
      '0x' + ephPublic?.getX().toString(16, 64),
      '0x' + ephPublic?.getY().toString(16, 64),
      '0x' + sharedSecretByte,
      debouncedAddr,
    ],
    value: debouncedAmount.toBigInt(),
    enabled: debouncedAmount.gt(zero),
  });

  const { data, isError, error, write, reset } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleIDInput = (ev: React.FormEvent<HTMLInputElement>) => {
    setTheirID(ev.currentTarget.value);
    setZkmlIDError(false);
    reset();
  };

  const handleAmountInput = (event: React.FormEvent<HTMLInputElement>) => {
    console.log(event.currentTarget.value)
    setAmount(event.currentTarget.value);
    setAmountError(false);
  };


  const generateNewEphKey = useCallback(() => {
    if (!theirID) return;

    if (theirID.at(0) !== 'V') {
      setZkmlIDError(true);
      return;
    }

    const _theirID = theirID.slice(1);
    let decodedID: Uint8Array;
    try {
      decodedID = base58.decode(_theirID);
    } catch (e) {
      console.log('Invalid base58 encoding');
      setZkmlIDError(true);
      return;
    }

    if (decodedID.length !== 35) {
      setZkmlIDError(true);
      return;
    }

    

    const trueID = decodedID.subarray(0, 33);
    const crc = calculateCrc(trueID);
    if (!crc.every((x, idx) => x === decodedID[33 + idx])) {
      console.log('CRC error: ' + crc + '; ' + decodedID);
      setZkmlIDError(true);
      return;
    }

    try {
      const meta = ec.keyFromPublic(trueID, 'hex');

      // generate eph key
      const ephKey = ec.genKeyPair();
      setEphPublic(ephKey.getPublic());

      const ss = ephKey.derive(meta.getPublic());

      const hashed = ec.keyFromPrivate(keccak256(ss.toArray()));
      const pub = meta
        .getPublic()
        .add(hashed.getPublic())
        .encode('array', false);

      const addr = keccak256(pub.splice(1));

      setxdcAddr(
        getAddress('0x' + addr.substring(addr.length - 40, addr.length))
      );

      setSharedSecretByte(ss.toArray()[0].toString(16).padStart(2, '0'));

      console.log(
        `Current ephemeral pubkey: ${ephKey.getPublic().encode('hex', true)}`
      );
    } catch (e) {
      setZkmlIDError(true);
    }
  }, [theirID, ec]);

  const saveData =  async () => {
    const date = new Date(); 
    const isoDateString = date.toISOString();

    await supabase
      .from('zkml')
      .upsert([
        { 
          zkmlid: theirID, 
          type: 'send',
          address: data?.hash,
          amount:  amount,
          createtime: isoDateString,
          cryptotype: chain?.nativeCurrency.symbol,
          explorerAddress: explorerAddress
        },
      ])
  }

  useEffect(() => {
    if (!theirID) {
      setZkmlIDError(true);
      return;
    }

    if (theirID.startsWith('https://zkml/#')) {
      setTheirID(theirID.replace('https://zkml/#', ''));
    } else {
      generateNewEphKey();
    }
  }, [theirID, generateNewEphKey]);

  
  useEffect(() => {
    generateNewEphKey();
    if (isSuccess) {
      toast({
        title: 'Success Transaction',
        description: 'You can withdraw funds by use key',
        status: 'success', // success, error, warning, info
        duration: 5000, // Duration in milliseconds
        isClosable: true, // Whether the toast is closable by user
        position: "top-right"
      });
      saveData();
    }
    setIsLoading(isLoading);
  }, [isSuccess, isLoading]);

  useEffect(() => {
    if (isPrepareError) {
      toast({
        title: "Transaction Failed",
        description: prepareError?.message.slice(0, 40) + '...',
        status: 'error', // success, error, warning, info
        duration: 5000, // Duration in milliseconds
        isClosable: true, // Whether the toast is closable by user
        position: "top-right"
      });
    }
    if (isError) {
      toast({
        title: "Transaction Failed",
        description: error?.message.slice(0, 40) + '...',
        status: 'error', // success, error, warning, info
        duration: 5000, // Duration in milliseconds
        isClosable: true, // Whether the toast is closable by user
        position: "top-right"
      });
    }
  }, [isPrepareError, isError])

  useEffect(() => {
    if (hash.length > 20) {
      setTheirID(hash.slice(1));
    }
  }, [hash]);

  useEffect(() => {
    try {
      const _amount = parseEther(amount);
      setAmountWei(_amount);

      if (balance) {
        if (_amount.gte(balance.value)) {
          setAmountError(true);
        }
      }
    } catch (e) {
      setAmountError(true);
    }
  }, [amount, balance]);

  return (
    <div style={{ paddingTop: '1rem' }}>
      <p className="send-txt-content">
        {chain?.nativeCurrency.symbol || 'Crypto'} will be sent to a secret blockchain account that will hold the {chain?.nativeCurrency.symbol || 'crypto'} temporarily.
        The user who owns the ZKML ID will have control over the secret account.
      </p>
      <form
        className="lane"
        onSubmit={() => {
          return false;
        }}
      ><div className='header-item'>
          <div className="input-container">
            <label htmlFor="xcryptID">ZKML ID</label>
            <input
              type="text"
              id="xcryptID"
              value={theirID}
              disabled={!isConnected || isLoading}
              spellCheck="false"
              autoComplete="off"
              placeholder="Enter receiver Zkml ID"
              onChange={handleIDInput}
            />
          </div>
        </div>
      </form>

      {!isConnected && (
        <>
          <div className='connected_send'>
            <Connect />
          </div>
        </>
      )}

      {isConnected && balance && (
        <>
          <form
            className="lane"
            onSubmit={() => {
              return false;
            }}
          >
            <div className="header-item">
              <div className="input-container">
                <label htmlFor="amount">
                  Amount ({chain?.nativeCurrency.symbol})
                </label>
                <input
                  type="text"
                  value={amount}
                  autoComplete="off"
                  id="amount"
                  disabled={isLoading}
                  style={{ textAlign: 'left' }}
                  className={amountError ? 'error-input' : ''}
                  placeholder="0.00"
                  onChange={handleAmountInput}
                />
              </div>
              <div className='send-footer'>
                <button
                  className="hbutton control-wallet"
                  color="success"
                  disabled={!write || isLoading || amountError || ZkmlIDError}
                  onClick={(e) => {
                    e.preventDefault();
                    write?.();
                  }}
                >
                  <span>
                    <FontAwesomeIcon icon={faArrowRight} />
                    &nbsp;
                    {isLoading
                      ? 'Sending...'
                      : `Send ${chain?.nativeCurrency.symbol}`}
                  </span>
                </button>

                <input
                  value={`${Number(balance.formatted).toFixed(4)} ${chain?.nativeCurrency.symbol
                    }`}
                  style={{ backgroundColor: "black" }}
                  disabled
                />
                <span className="send-txt-label">Available:</span>
              </div>
            </div>
          </form>
          {theirID && ZkmlIDError && (
            <div className="lane">
              <p className="message error">Invalid Zkml ID</p>
            </div>
          )}
          {isSuccess && !isError && !isPrepareError && (
            <div className="lane">
              <p className="message">
                <strong style={{ color: '#38E5FF' }}>Successfully sent!</strong>&nbsp;
                <a
                  href={`https://${explorerAddress}/tx/${data?.hash}`}
                  className="link-text"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on {chain?.name.split(' ')[0]} Explorer{' '}
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    transform={{ rotate: -45 }}
                  />
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
