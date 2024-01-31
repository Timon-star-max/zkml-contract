import { ec as EC } from 'elliptic';
import { useCallback, useContext, useEffect, useState } from 'react';
import { faCopy, faSave } from '@fortawesome/free-regular-svg-icons';
import { faCheckCircle, faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { base58 } from 'ethers/lib/utils.js';
import { copyTextToClipboard } from '../utils/clipboard';
import { calculateCrc } from '../utils/crc16';
import { downloadTxtFile } from '../utils/download';
import { useLocalStorage } from '../utils/localstorage';
import { AddressContext, AddressContextType } from './address';
import { FileUploader } from './upload';
import './zkmlid.css';
import ZkmlIdBg from '../assets/svg/ZkmlidBg.svg';
import ZkmlHeader from '../assets/svg/ZkmlHeader.svg';
import EllipseEffect from '../assets/svg/Ellipse.svg';
const Zkmlid = () => {
    const ec = new EC('secp256k1');

    const { spendingKey, setSpendingKey, setVerxioPrivateKey } = useContext(
        AddressContext
    ) as AddressContextType;

    const [metaAddr, setMetaAddr] = useState<string>();
    const [copied, setCopied] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [loadSuccess, setLoadSuccess] = useState<boolean>(false);
    const [keySaved, setKeySaved] = useState<boolean>(true);

    const [storedSpendingKey, setStoredSpendingKey] = useLocalStorage<
        string | null
    >('spendingKey', null);

    const generateNewKey = () => {
        const key = ec.genKeyPair();
        setSpendingKey(key);
        setStoredSpendingKey(key.getPrivate().toString(16));
        setKeySaved(false);
        setLoadError(false);
    };

    useEffect(() => {
        let skey;

        if (storedSpendingKey) {
            try {
                skey = ec.keyFromPrivate(storedSpendingKey, 'hex');
                setSpendingKey(skey);
                setVerxioPrivateKey(metaAddr);
            } catch (e) {
                console.log(e);
            }
        }
        if (!skey) {
            generateNewKey();
        }
        
    }, [storedSpendingKey]);

    useEffect(() => {
        if (!spendingKey) return;

        const data = Uint8Array.from(
            spendingKey.getPublic().encodeCompressed('array')
        );
        const crc = calculateCrc(data);

        const addr = new Uint8Array(data.length + 2);
        addr.set(data);
        addr.set(crc, data.length);

        setMetaAddr('V' + base58.encode(addr));
        setVerxioPrivateKey('V' + base58.encode(addr));
    }, [spendingKey]);

    const handleFile = async (f: File) => {
        if (!f) return;

        if (f.size !== 64) {
            setLoadError(true);
            return;
        }

        try {
            const key = await f.text();
            const skey = ec.keyFromPrivate(key, 'hex');

            setVerxioPrivateKey(metaAddr);
            setSpendingKey(skey);
            setStoredSpendingKey(key);

            setLoadSuccess(true);
            setKeySaved(true);

            setTimeout(() => {
                setLoadSuccess(false);
            }, 1500);
        } catch (e) {
            setLoadError(true);
            console.log(e);
        }
    };

    const handleCopy = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            copyTextToClipboard(metaAddr ? `${metaAddr}` : '').then(
                () => {
                    setCopied(true);
                    setTimeout(() => {
                        setCopied(false);
                    }, 1500);
                }
            );
        },
        [metaAddr]
    );

    return (
        <div className='zkmlid-content'>
            <div className='zkml-bg'>
                <img src={ZkmlIdBg} className='zkml-bg-img'></img>
            </div>
            <div className='zkml-circle-effect'>
                <img src={EllipseEffect}></img>
            </div>
            <div className='zkml-body'>
                <h1 className='zkml-title'>Share the ZKML ID to receive ETH</h1>
                <div className='zkmlid'>
                    <div className='zkmlid-body'>
                        <div className='zkmlid-body-generate'>
                            <h1 className='zkmlid-txt'>ZKML ID</h1>
                            <p className="zkml-id-contracted">{metaAddr}</p>
                            <div className="header-item">
                                <button
                                    className="zkml-button hbutton-lnk"
                                    title="Copy link"
                                    onClick={handleCopy}
                                >
                                    <span>
                                        COPY <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
                                    </span>
                                </button>
                                <button
                                    className="zkml-button hbutton-lnk"
                                    title="Generate new"
                                    onClick={generateNewKey}
                                >
                                    <span>
                                        Generate New <FontAwesomeIcon icon={faRotate} />
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className='zkmlid-body-control'>
                            <p className="zkml-body-txt">
                                After you've shared your ID, make sure to save its key. You'll need the key to withdraw funds. Remember, only share the ID, not the key.
                            </p>
                            <div className="header-item">
                                <FileUploader
                                    preLoad={() => {
                                        setLoadError(false);
                                        setLoadSuccess(false);
                                    }}
                                    handleFile={handleFile}
                                />

                                {spendingKey && (
                                    <button
                                        className={keySaved ? 'zkml-button hbutton-lnk' : 'zkml-button'}
                                        onClick={() => {
                                            downloadTxtFile(
                                                spendingKey.getPrivate().toString(16),
                                                `Zkml_${metaAddr}.txt`
                                            )();
                                            setKeySaved(true);
                                        }}
                                        disabled={!spendingKey}
                                    >
                                        <span>
                                            Save key <FontAwesomeIcon icon={faSave} />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='zkmlid-header'>
                        <img src={ZkmlHeader} alt="" />
                    </div>
                    <div
                        className="xcrypt-pane-header block message"
                        style={{
                            width: '90%',
                            display: loadSuccess || loadError ? 'block' : 'none',
                        }}
                    >
                        <div
                            className="block-wide error-text"
                            style={{
                                display: loadError ? 'block' : 'none',
                            }}
                        >
                            Incorrect Verxio ID keyfile
                        </div>
                        <div
                            className="block-wide"
                            style={{
                                display: loadSuccess ? 'inline' : 'none',
                            }}
                        >
                            Keyfile loaded!
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
export default Zkmlid;