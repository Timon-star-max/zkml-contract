
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
} from "@chakra-ui/react";

import { useAccount, useNetwork } from 'wagmi';
import { supabase } from '../utils/constants';
import { useEffect, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { AddressContext, AddressContextType } from './address';
import './panes.css';


export function TransactionPool(props: any) {

  const { activeTab } = props;
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  const [transactions, setTransactions] = useState<Array<any>>([]);
  const { verxioPrivateKey }            = useContext(AddressContext) as AddressContextType;
  
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('zkml')
        .select()
        .eq('zkmlid', verxioPrivateKey);

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setTransactions(data);
      }
    }
    if(verxioPrivateKey){
      fetchData();
    }
  }, [verxioPrivateKey, activeTab]);
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
      <>
        <Table variant="simple" color='white' fontSize={14}>
          <TableCaption>A total of {transactions.length} transactions were performed.</TableCaption>
          <Thead>
            <Tr>
              <Th>Transaction Type</Th>
              <Th>Amount</Th>
              <Th>CrypTo Type</Th>
              <Th>Create Time</Th>
              <Th>View</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions.map((transaction, index) => {
              return (
                <Tr key={index}>
                  <Td>{transaction.type}</Td>
                  <Td>{transaction.amount}</Td>
                  <Td>{transaction.cryptotype}</Td>
                  <Td>{transaction.createtime}</Td>
                  <Td>
                    <a
                      href={`https://${transaction.explorerAddress}/tx/${transaction.address}`}
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
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </>
    );
  }
}
