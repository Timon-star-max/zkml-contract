import {
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import ReactLoading from 'react-loading';
import { useNetwork } from 'wagmi';

import AddressProvider from '../components/address';
import { Connect } from '../components/connect';
import { Send } from '../components/send';
import { Withdraw } from '../components/withdraw';
import { TransactionPool } from '../components/tsx-pools';

import Home from "../components/home";
import Intro from "../components/intro";
import ZkmlId from "../components/zkmlid";
import { registryAddress, explorer } from '../utils/constants';

import SendMoneyIcon from '../assets/svg/MoneySendCircle.svg';
import ReceiveMoneyIcon from '../assets/svg/MoneyReceiveCircle.svg';
import PoolIcon from '../assets/svg/DataPool.svg';
import Logo from '../assets/logo.svg'
import './main.css';

const Main = () => {
  const [activeTab, setActiveTab] = useState<string>('send');
  const [isLoading, setIsLoading] = useState(false);


  const { chain } = useNetwork();
  const contractAddress = registryAddress[chain?.id || 100 || 10200];
  const explorerAddress = explorer[chain?.id || 100 || 10200];

  return (
    <section className="layout">
      <div className="header">
        <div className="">
          <img className="logo" src={Logo} />
        </div>
        <div className="connect-wallet">
          <Connect />
        </div>
      </div>
      <Home></Home>
      <Intro></Intro>
      <AddressProvider>
        <ZkmlId></ZkmlId>
        <div className="main-panel">
          <div className="nav-tabs">
            <div
              className={activeTab === 'send' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('send')}
            >
              <h2>
                Send
              </h2>
              <img src={SendMoneyIcon}></img>
            </div>
            <div
              className={activeTab === 'withdraw' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('withdraw')}
            >
              <h2>
                Receive
              </h2>
              <img src={ReceiveMoneyIcon}></img>
            </div>

            <div
              className={activeTab === 'spend' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('spend')}
            >
              <h2>
                Pool
              </h2>
              <img src={PoolIcon}></img>
            </div>
          </div>
          <div
            className="pane send"
            style={{ display: activeTab === 'send' ? 'block' : 'none' }}
          >
            <Send setIsLoading={setIsLoading} />
          </div>
          <div
            className="pane receive"
            style={{
              display: activeTab === 'withdraw' ? 'block' : 'none',
            }}
          >
            <Withdraw setIsLoading={setIsLoading} activeTab={activeTab}/>
          </div>
          <div
            className="pane datapool"
            style={{ display: activeTab === 'spend' ? 'block' : 'none' }}
          >
            < TransactionPool activeTab={activeTab}/>
          </div>

        </div>
      </AddressProvider>
      <div className='footer'>
        <a
          href={`https://${explorerAddress}/address/${contractAddress}`}
          style={{ flexGrow: 1 }}
          target="_blank"
          rel="noreferrer"
          className='register-contract'
        >
          <span>
            Registry contract &nbsp;
            <FontAwesomeIcon
              icon={faArrowRight}
              transform={{ rotate: -45 }}
            />
          </span>
        </a>
        <h2 className="version">v1.0.0</h2>
      </div>
      {
        isLoading &&
        <div className='loading'>
          <ReactLoading type="bars" color="#38E5FF" />
        </div>
      }
    </section>
  );
}
export default Main;