
import { AddrMapType, MapType } from './types';
import { createClient } from '@supabase/supabase-js'

export const registryAddress: AddrMapType = {
  0: '0x0',
  1440002: '0xA2A3b38f6088d729a1454BCD2863ce87B9953079',
  5: '0xa94306874257f2Db42e639C5Ee70DC8617BF8763',
}

export const explorer: MapType = {
  1440002: 'evm-sidechain.xrpl.org',
  5: 'goerli.etherscan.io'
}



const supabaseUrl = 'https://sxdgeiweathzyzyqbqux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZGdlaXdlYXRoenl6eXFicXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ0NjAzMjUsImV4cCI6MjAyMDAzNjMyNX0.etStl6NY6KXxb2YFezJuxpHtf4Pmfg5JFp8JuqyTvqQ'

export const supabase = createClient(
  supabaseUrl, supabaseAnonKey
);
