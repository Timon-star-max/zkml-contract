import { useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import {
  faArrowRight,
  faArrowTurnDown,
  faCheckCircle,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  fetchBalance,
  prepareSendTransaction,
  fetchFeeData,
  waitForTransaction
} from '@wagmi/core';
import { ec as EC } from 'elliptic';
import { ethers } from 'ethers';
import { parseEther } from 'viem'
import { getAddress, keccak256 } from 'ethers/lib/utils';
import { useAccount, useContractRead, useNetwork, } from 'wagmi';
import { supabase } from '../utils/constants';

import { ZkmlPayABI } from '../contracts/abi.json';
import { copyTextToClipboard } from '../utils/clipboard';
import { registryAddress, explorer } from '../utils/constants';
import { AddressContext, AddressContextType } from './address';

import NothingHere from '../assets/svg/NothingHere.svg';
import './panes.css';


export function Withdraw(props:any) {

  const ec = useMemo(() => {
    return new EC('secp256k1');
  }, []);

  const { verxioPrivateKey }                  = useContext(AddressContext) as AddressContextType;
  const { spendingKey }                       = useContext(AddressContext) as AddressContextType;
  const [keyAddrs, setKeyAddrs]               = useState<Array<string[]>>([]);
  const [modalVisible, setModalVisible]       = useState<boolean>(false);
  const [active, setActive]                   = useState<any>({});
  const [targetAddr, setTargetAddr]           = useState<string>('');
  const [isSending, setIsSending]             = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid]   = useState<boolean>(true);
  const [isCopied, setIsCopied]               = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string>();
  const [withdrawError, setWithdrawError]     = useState<string>();
  const [txPending, setTxPending]             = useState<string>('');
  const [keysCount, setKeysCount]             = useState<number>(0);
  const [keysIndex, setKeysIndex]             = useState<number>(0);

  const toast                    = useToast();
  const { chain }                = useNetwork();
  const { isConnected, address } = useAccount();

  const { setIsLoading, activeTab } = props;
  const registryConfig = {
    address: registryAddress[chain?.id || 100 || 10200],
    abi: ZkmlPayABI,
  };
  const explorerAddress = explorer[chain?.id || 100 || 10200];

  useEffect(() => {
    setKeyAddrs([]);
    setKeysIndex(0);
  }, [spendingKey, chain]);

  const { refetch: refetchKeys } = useContractRead({
    ...registryConfig,
    functionName: 'getNextKeys',
    args: [keysIndex] as const,
    enabled: isConnected,
  });

  const { data: _keysCount, refetch: refetchKeysCount } = useContractRead({
    ...registryConfig,
    functionName: 'totalKeys',
    enabled: isConnected,
  });

  const saveData =  async (address: any) => {
    const date = new Date(); 
    const isoDateString = date.toISOString();

    await supabase
      .from('zkml')
      .upsert([
        { 
          zkmlid: verxioPrivateKey, 
          type: 'receive',
          address: address,
          amount:  active?.balance,
          createtime: isoDateString,
          cryptotype: chain?.nativeCurrency.symbol,
          explorerAddress: explorerAddress
        },
      ])
  }


  useEffect(() => {
    if (!isConnected || !!!_keysCount) return;

    setKeysCount(Number(_keysCount) || 0);
    const handler = setInterval(() => {
      refetchKeysCount().then((x) =>
        setKeysCount(Number(x.data))
      );
    }, 10000);

    return () => {
      clearInterval(handler);
    };
  }, [isConnected, chain, refetchKeysCount]);

  useEffect(() => {
    if (!keysCount || !spendingKey || !isConnected) return;

    // console.log('Effect keys, idx: ' + keysIndex);

    refetchKeys().then((x) => {
      findMatch(x.data as KeyObject[]).then(() => {
        if (keysCount > keysIndex) {
          // delay between sequential calls
          setTimeout(() => {
            setKeysIndex(Math.min(keysCount, keysIndex + 10));
          }, 750);
        }
      });
    });
  }, [keysCount, refetchKeys, isConnected, spendingKey, keysIndex, activeTab]);

  useEffect(() => {
    setTargetAddr('');
    setIsSending(false);
    setIsAddressValid(true);
    setWithdrawError(undefined);
    setWithdrawSuccess(undefined);
    setTxPending('');
  }, [modalVisible]);

  useEffect(() => {
    try {
      getAddress(targetAddr);
      setIsAddressValid(true);
    } catch (e) {
      setIsAddressValid(false);
    }
  }, [targetAddr]);

  interface KeyObject {
    x: string;
    y: string;
    ss: string;
    token: string;
  }

  const findMatch = async (keys: KeyObject[]) => {
    if (!spendingKey || !isConnected) return;

    const _addrs = await Promise.all(

      keys.map(async (key) => {

        const { x, y, ss, token } = key;
        const _x = parseInt(x, 16);
        const _y = parseInt(y, 16);
        if (_x === 0 || _y === 0) return null;

        let eph;
        try {
          eph = ec.keyFromPublic(`04${x.slice(2)}${y.slice(2)}`, 'hex');
        } catch (e) {
          console.error("Error", e)
          return null;
        }

        const _ss = spendingKey.derive(eph.getPublic());


        // early check if shared secret might be the same
        if (_ss.toArray()[0] == parseInt(ss, 16)) return null;

        const hashed = ec.keyFromPrivate(keccak256(_ss.toArray()));
        // console.log(hashed)
        const pub = spendingKey
          .getPublic()
          .add(hashed.getPublic())
          .encode('array', false);

        const _addr = keccak256(pub.splice(1));
        const addr = getAddress(
          '0x' + _addr.substring(_addr.length - 40, _addr.length)
        );

        if (token === ethers.constants.AddressZero) {
          const bal = await fetchBalance({ address: `0x${addr.substring(2)}` });

          if (bal.formatted != '0') {
            return [x, y, token, bal.formatted, addr];
          }
        } else {
          console.error("Token transfers aren't supported yet");
        }

        return null;
      })
    );

    const addrs = _addrs.filter((_y) => _y !== null);
    // console.log('Found new keys: ' + addrs.length + ' from ' + keys.length);
    setKeyAddrs([...keyAddrs, ...(addrs as Array<string[]>)]);

    // console.log(addrs)

  };

  const buildPrivateKey = (x: string, y: string, spendingKey: EC.KeyPair) => {
    const eph = ec.keyFromPublic(`04${x.slice(2)}${y.slice(2)}`, 'hex');

    const ss = spendingKey.derive(eph.getPublic());
    const hashed = ec.keyFromPrivate(keccak256(ss.toArray()));

    const _key = spendingKey.getPrivate().add(hashed.getPrivate());
    const key = _key.mod(ec.curve.n);

    return key;
  };

  const withdraw = async (
    x: string,
    y: string,
    // token: string,
    addr: `0x${string}`,
    target: `0x${string}`
  ) => {
    
    if (!spendingKey) return;
    let receiveaddress;
    setIsSending(true);
    setIsLoading(true);
    const bal = await fetchBalance({ address: addr });
    const key = buildPrivateKey(x, y, spendingKey);
    // Prepare the transaction
    let request = await prepareSendTransaction({
      to: target,
      // value: parseEther(bal.formatted) ,
    });

    try {
      const provider = new StaticJsonRpcProvider(chain?.rpcUrls.public.http[0]);
      const signer = new ethers.Wallet(key.toArray(undefined, 32), provider);

      let gasLimit = request.gas!;
      const feeData = await fetchFeeData()
      const gasPrice = feeData.gasPrice!

      let fee = gasLimit * gasPrice;
      const originalBalance = parseEther(bal.formatted);


      const sendValue = originalBalance - fee
      const result = await signer.sendTransaction({
        to: target,
        value: sendValue,
        gasPrice: gasPrice
      });

      setTxPending(result.hash);
      const data = await waitForTransaction({
        hash: result.hash as `0x${string}`,
      });

      setTxPending('');
      setWithdrawSuccess(data.transactionHash);
      receiveaddress = data.transactionHash;
      // exclude address from the list
      setKeyAddrs(keyAddrs.filter((p) => p[4] !== addr));
    } catch (e) {
      setWithdrawError((e as Error).message);
      setTxPending('');
    }
    saveData(receiveaddress);
    setIsSending(false);
  };

  useEffect(() => {
      setIsLoading(isSending);
  }, [isSending]);

  useEffect(() => {
    if(withdrawError){
      toast({
        title: 'Transaction Warning',
        description: withdrawError.slice(0, 40) + '...',
        status: 'warning', // success, error, warning, info
        duration: 5000, // Duration in milliseconds
        isClosable: true, // Whether the toast is closable by user
        position: "top-right"
      });
    };
    if (withdrawSuccess) {
      toast({
        title: 'Transaction Success',
        description: 'Celbrate! You have successfully withdrawn your funds.',
        status: 'success', // success, error, warning, info
        duration: 5000, // Duration in milliseconds
        isClosable: true, // Whether the toast is closable by user
        position: "top-right"
      });
    }
  }, [withdrawError, withdrawSuccess])
  if (!isConnected) {
    return (
      <div className="lane">
        <p>
          <b
            onClick={() => {
              window.scrollTo({ top: 0 });
            }}
          >
            Connect wallet
          </b>{' '}
          to proceed.
        </p>
      </div>
    );
  } else {
    return (
      <div>
        {keyAddrs.length === 0 && !modalVisible && (
          <div className="lane" style={{ marginTop: '1rem' }}>
            <div className='nothing-here'>
              <img src={NothingHere}></img>
            </div>
            <p style={{color: 'white'}}>Nothing to withdraw yet</p>
          </div>
        )}

        {keyAddrs.length > 0 && !modalVisible && (
          <div className="lane" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
              {keyAddrs
                // .filter((item) => Number(item[3]) > 0) // Filter out items with balance <= 0
                .map((item, index) => {
                  const [_x, _y, token, bal, addr] = item;
                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: '1.8rem',
                        margin: '0 1rem 0.75rem 0',
                      }}
                    >
                      <button
                        className="hbutton"
                        color="success"
                        onClick={(e) => {
                          e.preventDefault();
                          setActive({
                            x: _x,
                            y: _y,
                            token,
                            addr,
                            balance: Number(bal),
                          });
                          setModalVisible(true);
                        }}
                      >
                        {bal} {chain?.nativeCurrency.symbol}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className={modalVisible ? 'modal active' : 'modal'}>
          <div className="lane" style={{ marginTop: '1rem' }}>
            <div className="modal-window">
              <p className='receive-txt'>
                Withdraw {active.balance || '0'}{' '}
                {chain?.nativeCurrency.symbol}
              </p>

              <button
                className="back-to-list hbutton-lnk"
                onClick={(e) => {
                  e.preventDefault();
                  setModalVisible(false);
                }}
              >
                {"< "}back to list
              </button>
            </div>
          </div>
          <div className="lane withdraw" style={{ marginTop: '1rem' }}>
            <form
              onSubmit={() => {
                return false;
              }}
            >
              <div className="input-container">
                <label htmlFor="targetAddr">To address</label>
                <input
                  type="text"
                  id="targetAddr"
                  value={targetAddr}
                  className={!isAddressValid ? 'error-input' : ''}
                  spellCheck="false"
                  autoComplete="off"
                  placeholder="0x943sI865PYt2W..."
                  disabled={isSending}
                  onChange={(e) => {
                    setIsAddressValid(true);
                    setTargetAddr(e.target.value);
                  }}
                />
              </div>
              <div className="lane" style={{ marginTop: '1rem', padding: '0px 10px' }}>
                <button
                  className="hbutton hbutton-lnk"
                  disabled={isSending}
                  onClick={(e) => {
                    e.preventDefault();
                    setTargetAddr(address || '');
                  }}
                >
                  use connected wallet
                </button>
              </div>
            </form>
          </div>

          {!!spendingKey && (
            <div className="header-item withdraw-div">
              <button
                className="withdraw_button hbutton-lnk"
                disabled={isSending || !targetAddr || !isAddressValid}
                onClick={() => 
                  withdraw(
                    active.x,
                    active.y,
                    active.addr as `0x${string}`,
                    targetAddr as `0x${string}`
                  )
                }
              >
                <span>
                  <FontAwesomeIcon icon={faArrowTurnDown} flip="horizontal" />
                  &nbsp;
                  {isSending ? 'Sending...' : 'Withdraw'}
                </span>
              </button>
              <button
                className="withdraw_button hbutton-lnk"
                onClick={() => {
                  const key = buildPrivateKey(
                    active.x,
                    active.y,
                    spendingKey
                  );
                  copyTextToClipboard(key.toString(16, 32));
                  setIsCopied(true);
                  setTimeout(() => {
                    setIsCopied(false);
                  }, 1500);
                }}
              >
                <span>
                  <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} />{' '}
                  &nbsp;
                  {isCopied ? 'Copied!' : 'Copy private key'}
                </span>
              </button>
            </div>
          )}
          {(!!withdrawError || !!withdrawSuccess || !!txPending) && (
            <div className="lane">
              {txPending !== '' && (
                <p className="message">
                  <span style={{color: 'yellow'}}>Transaction pending. </span>
                  <a
                    href={`https://${explorerAddress}/tx/${txPending}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link-text"
                  >
                    View on {chain?.name.split(' ')[0]} Explorer{' '}
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      transform={{ rotate: -45 }}
                    />
                  </a>
                </p>
              )}
              {!!withdrawError && (
                <p className="message error">Error: {withdrawError}</p>
              )}
              {!!withdrawSuccess && (
                <p className="message">
                  <strong>Transaction sent! </strong>
                  <a
                    href={`https://${explorerAddress}/tx/${withdrawSuccess}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link-text"
                  >
                    View on {chain?.name.split(' ')[0]} Explorer{' '}
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      transform={{ rotate: -45 }}
                    />
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    );
  }
}
